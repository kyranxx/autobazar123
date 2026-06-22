#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { config as loadDotenv } from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_PACKAGE_ID = "dealer_100";
const PRODUCTION_HOSTS = new Set(["autobazar123.sk", "www.autobazar123.sk"]);

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeBaseUrl(value) {
  const raw = trim(value);
  if (!raw) {
    throw new Error("TEST_URL is empty.");
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid TEST_URL: ${raw}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`TEST_URL must be http or https: ${raw}`);
  }

  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/u, "");
  return parsed.toString().replace(/\/$/u, "");
}

export function readCredentialPair(env, emailName, passwordName) {
  const email = trim(env[emailName]);
  const password = env[passwordName] ?? "";

  if (!email || !password) {
    return null;
  }

  return { email, password, source: `${emailName}/${passwordName}` };
}

export function resolveDealerTopupSmokeCredentials(env) {
  const dealer = readCredentialPair(
    env,
    "E2E_DEALER_EMAIL",
    "E2E_DEALER_PASSWORD",
  );

  if (!dealer) {
    throw new Error(
      "Missing E2E_DEALER_EMAIL/E2E_DEALER_PASSWORD for dealer topup smoke.",
    );
  }

  return dealer;
}

export function assertSafeSmokeTarget(baseUrl, env = process.env) {
  const normalized = normalizeBaseUrl(baseUrl);
  const hostname = new URL(normalized).hostname.toLowerCase();
  if (
    PRODUCTION_HOSTS.has(hostname) &&
    env.DEALER_TOPUP_SMOKE_ALLOW_PRODUCTION_TARGET !== "true"
  ) {
    throw new Error(
      "stripe-dealer-topup-smoke refuses production targets by default. Use Preview or localhost, or set DEALER_TOPUP_SMOKE_ALLOW_PRODUCTION_TARGET=true after confirming Stripe is test-mode.",
    );
  }
}

export function assertTestModeCheckoutSessionId(sessionId) {
  const normalized = trim(sessionId);
  if (!normalized) {
    throw new Error("Stripe checkout response is missing a sessionId.");
  }

  if (!normalized.startsWith("cs_test_")) {
    throw new Error(
      `Refusing non-test Stripe Checkout session: ${normalized.slice(0, 8)}...`,
    );
  }

  return normalized;
}

export function parseCheckoutResponsePayload(payload) {
  const sessionId = assertTestModeCheckoutSessionId(payload?.sessionId);
  const url = trim(payload?.url);
  if (!url) {
    throw new Error("Stripe checkout response is missing a url.");
  }

  return { sessionId, url };
}

export function buildDealerTopupCheckoutRequest({
  packageId = DEFAULT_PACKAGE_ID,
  runId = `dealer-topup-smoke-${Date.now()}`,
} = {}) {
  const normalizedPackageId = trim(packageId) || DEFAULT_PACKAGE_ID;
  const normalizedRunId = trim(runId) || `dealer-topup-smoke-${Date.now()}`;

  return {
    body: {
      type: "dealer_topup",
      packageId: normalizedPackageId,
    },
    idempotencyKey: `${normalizedRunId}-${normalizedPackageId}`.slice(0, 255),
  };
}

function resolveSupabaseCleanupConfig(env) {
  const supabaseUrl = trim(env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = trim(env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for cleanup.",
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

function resolveStripeCleanupConfig(env) {
  const secretKey = trim(env.STRIPE_SECRET_KEY);
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY for checkout-session cleanup.");
  }

  if (!secretKey.startsWith("sk_test_")) {
    throw new Error(
      "stripe-dealer-topup-smoke requires a test-mode STRIPE_SECRET_KEY for cleanup.",
    );
  }

  return { secretKey };
}

function resolveSmokeConfig(env = process.env) {
  const baseUrl = normalizeBaseUrl(env.TEST_URL || "http://localhost:3000");
  assertSafeSmokeTarget(baseUrl, env);

  return {
    baseUrl,
    credentials: resolveDealerTopupSmokeCredentials(env),
    supabase: resolveSupabaseCleanupConfig(env),
    stripe: resolveStripeCleanupConfig(env),
    packageId: trim(env.DEALER_TOPUP_SMOKE_PACKAGE_ID) || DEFAULT_PACKAGE_ID,
    channel: trim(env.PLAYWRIGHT_CHROMIUM_CHANNEL) || undefined,
    timeoutMs: Number(env.DEALER_TOPUP_SMOKE_TIMEOUT_MS || 60_000),
  };
}

function createSupabaseAdmin({ supabaseUrl, serviceRoleKey }) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function createStripe(secretKey) {
  return new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  });
}

async function lookupDealerFixture(admin, credentials) {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not load E2E dealer profile: ${profileError.message}`);
  }

  if (!profile?.id) {
    throw new Error("Configured E2E dealer email has no matching profile row.");
  }

  const { data: dealer, error: dealerError } = await admin
    .from("dealers")
    .select("id, prepaid_balance_cents")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (dealerError) {
    throw new Error(`Could not load E2E dealer row: ${dealerError.message}`);
  }

  if (!dealer?.id) {
    throw new Error("Configured E2E dealer account has no dealer profile.");
  }

  return {
    userId: profile.id,
    dealerId: dealer.id,
    initialBalanceCents: Number(dealer.prepaid_balance_cents || 0),
  };
}

async function waitForReactInputHydration(page, selector) {
  await page.waitForFunction(
    (inputSelector) => {
      const element = document.querySelector(inputSelector);
      return Boolean(element?._valueTracker);
    },
    selector,
    { timeout: 15_000 },
  );
}

async function loginWithPassword(page, credentials) {
  await page.goto("/auth/login?redirect=/dealer", { waitUntil: "domcontentloaded" });

  const alreadyLoggedInContinue = page
    .getByRole("button", { name: /^(Pokračovať|Continue)$/iu })
    .first();

  if (await alreadyLoggedInContinue.isVisible().catch(() => false)) {
    await alreadyLoggedInContinue.click();
  } else {
    await page.locator("#auth-login-email").waitFor({ state: "visible", timeout: 15_000 });
    await waitForReactInputHydration(page, "#auth-login-email");
    await waitForReactInputHydration(page, "#auth-login-password");
    await page.locator("#auth-login-email").fill(credentials.email);
    await page.locator("#auth-login-password").fill(credentials.password);
    const loginForm = page
      .locator("form")
      .filter({ has: page.locator("#auth-login-email") })
      .first();
    await loginForm.getByRole("button", { name: /Prihlásiť sa|Sign in|Login/iu }).click();
  }

  await page.waitForURL(
    (url) => url.pathname === "/dealer" || url.pathname === "/" || url.pathname === "/moj-ucet",
    { timeout: 20_000 },
  );
  await page.goto("/dealer", { waitUntil: "domcontentloaded" });

  if (new URL(page.url()).pathname !== "/dealer") {
    throw new Error("Login did not reach /dealer.");
  }
}

async function createDealerTopupCheckout(page, checkoutRequest) {
  const result = await page.evaluate(async ({ body, idempotencyKey }) => {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  }, checkoutRequest);

  let payload;
  try {
    payload = JSON.parse(result.text);
  } catch {
    throw new Error(`Dealer topup checkout did not return JSON. status=${result.status}`);
  }

  if (!result.ok) {
    throw new Error(`Dealer topup checkout failed. status=${result.status}`);
  }

  return parseCheckoutResponsePayload(payload);
}

async function lookupCheckoutRow(admin, sessionId) {
  const { data, error } = await admin
    .from("billing_checkout_sessions")
    .select(
      "id, stripe_session_id, actor_user_id, dealer_id, actor_type, checkout_kind, operation_type, status, resolved_price_cents, bonus_cents, metadata",
    )
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load checkout row: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Dealer topup checkout row was not written.");
  }

  return data;
}

function assertCheckoutRow(row, fixture, packageId, sessionId) {
  if (row.stripe_session_id !== sessionId) {
    throw new Error("Checkout row session id mismatch.");
  }
  if (row.actor_user_id !== fixture.userId) {
    throw new Error("Checkout row actor user mismatch.");
  }
  if (row.dealer_id !== fixture.dealerId) {
    throw new Error("Checkout row dealer mismatch.");
  }
  if (row.actor_type !== "dealer" || row.checkout_kind !== "dealer_topup") {
    throw new Error("Checkout row is not a dealer topup.");
  }
  if (row.operation_type !== packageId || row.metadata?.packageId !== packageId) {
    throw new Error("Checkout row package metadata mismatch.");
  }
  if (row.status !== "created") {
    throw new Error(`Checkout row should be created before payment, got ${row.status}.`);
  }
  if (Number(row.resolved_price_cents || 0) <= 0) {
    throw new Error("Checkout row has no positive resolved price.");
  }
}

async function findIdempotencyKeysForSession(admin, sessionId, startedAtIso) {
  const { data, error } = await admin
    .from("idempotency_keys")
    .select("key, response, created_at")
    .gte("created_at", startedAtIso)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Could not lookup idempotency cleanup rows: ${error.message}`);
  }

  return (data || [])
    .filter((row) => row?.response?.sessionId === sessionId)
    .map((row) => row.key)
    .filter(nonEmpty);
}

async function deleteRowsByIds(admin, table, ids) {
  if (!ids.length) {
    return 0;
  }

  const { data, error } = await admin.from(table).delete().in("id", ids).select("id");
  if (error) {
    throw new Error(`Could not delete ${table}: ${error.message}`);
  }

  return data?.length || 0;
}

async function cleanupIdempotencyRows(admin, keys) {
  if (!keys.length) {
    return 0;
  }

  const { data, error } = await admin
    .from("idempotency_keys")
    .delete()
    .in("key", keys)
    .select("key");

  if (error) {
    throw new Error(`Could not delete idempotency rows: ${error.message}`);
  }

  return data?.length || 0;
}

async function cleanupWebhookLogsForSession(admin, sessionId) {
  const { data, error } = await admin
    .from("stripe_webhook_logs")
    .delete()
    .eq("session_id", sessionId)
    .select("id");

  if (error) {
    throw new Error(`Could not delete webhook logs: ${error.message}`);
  }

  return data?.length || 0;
}

async function countRows(admin, table, column, value) {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);

  if (error) {
    throw new Error(`Could not count ${table}: ${error.message}`);
  }

  return count || 0;
}

async function getDealerBalanceCents(admin, dealerId) {
  const { data, error } = await admin
    .from("dealers")
    .select("prepaid_balance_cents")
    .eq("id", dealerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not reload dealer balance: ${error.message}`);
  }

  return Number(data?.prepaid_balance_cents || 0);
}

async function cleanupSmokeRows({ admin, stripe, sessionId, checkoutRow, startedAtIso }) {
  let stripeExpired = false;
  let checkoutDeleted = 0;
  let idempotencyDeleted = 0;
  let webhookLogsDeleted = 0;

  if (sessionId) {
    await stripe.checkout.sessions.expire(sessionId);
    stripeExpired = true;
  }

  const transactionCount = sessionId
    ? await countRows(admin, "billing_transactions", "stripe_session_id", sessionId)
    : 0;
  if (transactionCount > 0) {
    throw new Error(
      `Dealer topup smoke created ${transactionCount} billing transaction(s); refusing to hide a balance-affecting side effect.`,
    );
  }

  const idempotencyKeys = sessionId
    ? await findIdempotencyKeysForSession(admin, sessionId, startedAtIso)
    : [];
  idempotencyDeleted = await cleanupIdempotencyRows(admin, idempotencyKeys);

  if (checkoutRow?.id) {
    checkoutDeleted = await deleteRowsByIds(admin, "billing_checkout_sessions", [
      checkoutRow.id,
    ]);
  }

  if (sessionId) {
    webhookLogsDeleted += await cleanupWebhookLogsForSession(admin, sessionId);
    await sleep(1_000);
    webhookLogsDeleted += await cleanupWebhookLogsForSession(admin, sessionId);
  }

  return {
    stripeExpired,
    checkoutDeleted,
    idempotencyDeleted,
    webhookLogsDeleted,
  };
}

async function verifyCleanup({ admin, sessionId, checkoutRow, fixture }) {
  if (checkoutRow?.id) {
    const checkoutCount = await countRows(
      admin,
      "billing_checkout_sessions",
      "id",
      checkoutRow.id,
    );
    if (checkoutCount !== 0) {
      throw new Error("Dealer topup checkout cleanup left a checkout row.");
    }
  }

  if (sessionId) {
    const transactionCount = await countRows(
      admin,
      "billing_transactions",
      "stripe_session_id",
      sessionId,
    );
    const webhookLogCount = await countRows(
      admin,
      "stripe_webhook_logs",
      "session_id",
      sessionId,
    );

    if (transactionCount !== 0) {
      throw new Error("Dealer topup smoke left billing transaction residue.");
    }
    if (webhookLogCount !== 0) {
      throw new Error("Dealer topup smoke left webhook log residue.");
    }
  }

  const finalBalanceCents = await getDealerBalanceCents(admin, fixture.dealerId);
  if (finalBalanceCents !== fixture.initialBalanceCents) {
    throw new Error("Dealer prepaid balance changed during topup creation smoke.");
  }
}

export async function runDealerTopupCheckoutSmoke(config = resolveSmokeConfig()) {
  const admin = createSupabaseAdmin(config.supabase);
  const stripe = createStripe(config.stripe.secretKey);
  const fixture = await lookupDealerFixture(admin, config.credentials);
  const checkoutRequest = buildDealerTopupCheckoutRequest({
    packageId: config.packageId,
  });
  const startedAtIso = new Date().toISOString();
  const browser = await chromium.launch(
    config.channel ? { channel: config.channel } : undefined,
  );
  let sessionId = null;
  let checkoutRow = null;
  let cleanup = null;

  try {
    const page = await browser.newPage({ baseURL: config.baseUrl });
    page.setDefaultTimeout(config.timeoutMs);

    await loginWithPassword(page, config.credentials);
    const checkout = await createDealerTopupCheckout(page, checkoutRequest);
    sessionId = checkout.sessionId;
    checkoutRow = await lookupCheckoutRow(admin, sessionId);
    assertCheckoutRow(checkoutRow, fixture, config.packageId, sessionId);

    cleanup = await cleanupSmokeRows({
      admin,
      stripe,
      sessionId,
      checkoutRow,
      startedAtIso,
    });
    await verifyCleanup({ admin, sessionId, checkoutRow, fixture });

    return {
      ok: true,
      targetOrigin: new URL(config.baseUrl).origin,
      credentialSource: config.credentials.source,
      packageId: config.packageId,
      sessionId,
      cleanup,
    };
  } finally {
    try {
      if (sessionId && (!cleanup || cleanup.checkoutDeleted === 0)) {
        await cleanupSmokeRows({ admin, stripe, sessionId, checkoutRow, startedAtIso });
      }
    } finally {
      await browser.close();
    }
  }
}

function formatSessionId(sessionId) {
  return `${sessionId.slice(0, 8)}...${sessionId.slice(-6)}`;
}

function formatResult(result) {
  return [
    "stripe-dealer-topup-smoke: OK",
    `target=${result.targetOrigin}`,
    `credentials=${result.credentialSource}`,
    `packageId=${result.packageId}`,
    `session=${formatSessionId(result.sessionId)}`,
    `cleanup=stripeExpired:${result.cleanup.stripeExpired},checkoutDeleted:${result.cleanup.checkoutDeleted},idempotencyDeleted:${result.cleanup.idempotencyDeleted},webhookLogsDeleted:${result.cleanup.webhookLogsDeleted}`,
  ].join("\n");
}

async function main() {
  loadDotenv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
  const result = await runDealerTopupCheckoutSmoke();
  console.log(formatResult(result));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      `stripe-dealer-topup-smoke: BLOCKED\n${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
