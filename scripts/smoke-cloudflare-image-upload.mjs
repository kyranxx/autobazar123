#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { config as loadDotenv } from "dotenv";

export const DEFAULT_SMOKE_IMAGE = path.join("public", "placeholder-car.jpg");

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
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

export function resolveSmokeCredentials(env) {
  const seller =
    readCredentialPair(env, "E2E_SELLER_EMAIL", "E2E_SELLER_PASSWORD") ??
    readCredentialPair(env, "E2E_AUTH_EMAIL", "E2E_AUTH_PASSWORD");

  if (!seller) {
    throw new Error(
      "Missing E2E_SELLER_EMAIL/E2E_SELLER_PASSWORD or E2E_AUTH_EMAIL/E2E_AUTH_PASSWORD.",
    );
  }

  return seller;
}

export function resolveCloudflareCleanupConfig(env) {
  const accountId = trim(env.CLOUDFLARE_ACCOUNT_ID);
  const apiToken = trim(env.CLOUDFLARE_API_TOKEN);

  if (!accountId || !apiToken) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN for cleanup.");
  }

  return { accountId, apiToken };
}

export function resolveSmokeConfig(env = process.env, cwd = process.cwd()) {
  return {
    baseUrl: normalizeBaseUrl(env.TEST_URL || "http://localhost:3000"),
    credentials: resolveSmokeCredentials(env),
    cleanup: resolveCloudflareCleanupConfig(env),
    imagePath: path.resolve(cwd, env.CLOUDFLARE_UPLOAD_SMOKE_IMAGE || DEFAULT_SMOKE_IMAGE),
    channel: trim(env.PLAYWRIGHT_CHROMIUM_CHANNEL) || undefined,
    timeoutMs: Number(env.CLOUDFLARE_UPLOAD_SMOKE_TIMEOUT_MS || 60_000),
  };
}

export function parseUploadUrlPayload(payload) {
  const uploadUrl = payload?.uploadUrl;
  const id = payload?.id;

  if (!nonEmpty(uploadUrl) || !nonEmpty(id)) {
    throw new Error("Upload URL response did not include both uploadUrl and id.");
  }

  return { uploadUrl: uploadUrl.trim(), imageId: id.trim() };
}

export function parseDirectUploadPayload(payload) {
  if (payload?.success !== true) {
    throw new Error("Cloudflare direct upload did not return success=true.");
  }

  const variants = payload?.result?.variants;
  if (!Array.isArray(variants) || variants.length === 0) {
    throw new Error("Cloudflare direct upload did not return any variants.");
  }

  const publicVariant =
    variants.find((variant) => typeof variant === "string" && variant.endsWith("/public")) ??
    variants.find((variant) => typeof variant === "string" && variant.length > 0);

  if (!publicVariant) {
    throw new Error("Cloudflare direct upload variants were not usable.");
  }

  return { publicVariant };
}

export function buildCloudflareImageDeleteUrl(accountId, imageId) {
  if (!nonEmpty(accountId) || !nonEmpty(imageId)) {
    throw new Error("Cloudflare account id and image id are required for deletion.");
  }

  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    accountId.trim(),
  )}/images/v1/${encodeURIComponent(imageId.trim())}`;
}

async function parseJsonResponse(response, label) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} did not return JSON. status=${response.status}`);
  }
}

async function loginWithPassword(page, credentials) {
  await page.goto("/auth/login?redirect=/", { waitUntil: "domcontentloaded" });

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

  await page.waitForURL((url) => url.pathname === "/", { timeout: 20_000 });
  await page.goto("/moj-ucet", { waitUntil: "domcontentloaded" });
  if (new URL(page.url()).pathname !== "/moj-ucet") {
    throw new Error("Login did not reach /moj-ucet.");
  }
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

async function createUploadUrl(page) {
  const result = await page.evaluate(async () => {
    const response = await fetch("/api/images/upload-url", {
      method: "POST",
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      text,
    };
  });

  let payload;
  try {
    payload = JSON.parse(result.text);
  } catch {
    throw new Error(`Upload URL route did not return JSON. status=${result.status}`);
  }

  if (!result.ok) {
    throw new Error(`Upload URL route failed. status=${result.status}`);
  }

  return parseUploadUrlPayload(payload);
}

async function uploadImage({ uploadUrl, imagePath }) {
  const bytes = await fs.readFile(imagePath);
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([bytes], { type: "image/jpeg" }),
    path.basename(imagePath),
  );

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const payload = await parseJsonResponse(response, "Cloudflare direct upload");
  if (!response.ok) {
    throw new Error(`Cloudflare direct upload HTTP failure. status=${response.status}`);
  }

  return parseDirectUploadPayload(payload);
}

export async function deleteCloudflareImage({
  accountId,
  apiToken,
  imageId,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(buildCloudflareImageDeleteUrl(accountId, imageId), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
  const payload = await response.json().catch(() => null);

  return {
    ok: response.ok && payload?.success === true,
    status: response.status,
  };
}

export async function runCloudflareUploadSmoke(config = resolveSmokeConfig()) {
  const browser = await chromium.launch(
    config.channel ? { channel: config.channel } : undefined,
  );
  let imageId = null;
  let cleanupResult = null;

  try {
    const page = await browser.newPage({ baseURL: config.baseUrl });
    page.setDefaultTimeout(config.timeoutMs);

    await loginWithPassword(page, config.credentials);
    const uploadTarget = await createUploadUrl(page);
    imageId = uploadTarget.imageId;
    const directUpload = await uploadImage({
      uploadUrl: uploadTarget.uploadUrl,
      imagePath: config.imagePath,
    });

    cleanupResult = await deleteCloudflareImage({
      accountId: config.cleanup.accountId,
      apiToken: config.cleanup.apiToken,
      imageId,
    });

    if (!cleanupResult.ok) {
      throw new Error(`Cloudflare image cleanup failed. status=${cleanupResult.status}`);
    }

    return {
      ok: true,
      targetOrigin: new URL(config.baseUrl).origin,
      credentialSource: config.credentials.source,
      variantHost: new URL(directUpload.publicVariant).host,
      cleanup: "deleted",
    };
  } finally {
    try {
      if (imageId && !cleanupResult?.ok) {
        cleanupResult = await deleteCloudflareImage({
          accountId: config.cleanup.accountId,
          apiToken: config.cleanup.apiToken,
          imageId,
        });
      }
    } finally {
      await browser.close();
    }
  }
}

function formatResult(result) {
  return [
    "cloudflare-upload-smoke: OK",
    `target=${result.targetOrigin}`,
    `credentials=${result.credentialSource}`,
    `variantHost=${result.variantHost}`,
    `cleanup=${result.cleanup}`,
  ].join("\n");
}

async function main() {
  loadDotenv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
  const result = await runCloudflareUploadSmoke();
  console.log(formatResult(result));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      `cloudflare-upload-smoke: BLOCKED\n${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
