import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";

const COOKIE_CONSENT_KEY = "autobazar123_cookie_consent";
const TOP_OPTIONAL_FILTER = "is_top_ad:true<score=10>";
const ALGOLIA_QUERIES_ENDPOINT_PATTERN =
  /\/1\/indexes\/(?:\*|[^/?]+)\/queries(?:\?|$)/;
const NO_ACCOUNT_ADS_PATTERN =
  /Zatiaľ nemáte žiadne inzeráty|Nemáte žiadne inzeráty|You don't have any ads yet|You have no ads|No ads yet/i;
const DASHBOARD_TOP_ACTION_PATTERN = /Exclusive|Topovať|Topovat|Boost|Feature/i;
const LISTING_TEST_IMAGE_PATHS = [
  path.join(process.cwd(), "public", "placeholder-car.jpg"),
  path.join(process.cwd(), "public", "homepage-reference-hero.png"),
];

const AUTH_EMAIL = process.env.E2E_AUTH_EMAIL ?? "";
const AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD ?? "";
const HAS_AUTH_CREDS = AUTH_EMAIL.length > 0 && AUTH_PASSWORD.length > 0;
const AUTH_IS_ADMIN = process.env.E2E_AUTH_IS_ADMIN === "true";

type AuthCredentials = {
  email: string;
  password: string;
};

type SellerAdSnapshot = {
  id: string;
  status: string | null;
  is_hidden: boolean | null;
  expires_at: string | null;
  updated_at: string | null;
};

const PRIMARY_CREDENTIALS = HAS_AUTH_CREDS
  ? {
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD,
    }
  : null;

function readCredentialPair(emailEnv: string, passwordEnv: string): AuthCredentials | null {
  const email = process.env[emailEnv] ?? "";
  const password = process.env[passwordEnv] ?? "";

  return email.length > 0 && password.length > 0
    ? {
        email,
        password,
      }
    : null;
}

const ADMIN_CREDENTIALS =
  readCredentialPair("E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD") ??
  (AUTH_IS_ADMIN ? PRIMARY_CREDENTIALS : null);
const NON_ADMIN_CREDENTIALS =
  readCredentialPair("E2E_NON_ADMIN_EMAIL", "E2E_NON_ADMIN_PASSWORD") ??
  (!AUTH_IS_ADMIN ? PRIMARY_CREDENTIALS : null);
const SELLER_WITH_AD_CREDENTIALS =
  readCredentialPair("E2E_SELLER_EMAIL", "E2E_SELLER_PASSWORD") ?? PRIMARY_CREDENTIALS;
const DEALER_CREDENTIALS =
  readCredentialPair("E2E_DEALER_EMAIL", "E2E_DEALER_PASSWORD") ?? PRIMARY_CREDENTIALS;
const NON_DEALER_CREDENTIALS = NON_ADMIN_CREDENTIALS ?? PRIMARY_CREDENTIALS;

function hasCredentials(
  credentials: AuthCredentials | null,
): credentials is AuthCredentials {
  return credentials !== null;
}

function createAdminTestClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function createAnonTestClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function createPasswordRecoveryFixture(credentials: AuthCredentials) {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for password recovery.");
  }

  const resetOrigin = (process.env.TEST_URL || "http://localhost:3000").replace(/\/$/, "");
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: credentials.email.trim().toLowerCase(),
    options: {
      redirectTo: `${resetOrigin}/auth/reset-password`,
    },
  });

  if (error) {
    throw error;
  }

  const tokenHash = data.properties?.hashed_token;
  const userId = data.user?.id;
  if (!tokenHash || !userId) {
    throw new Error("Supabase did not return a recovery token fixture.");
  }

  return {
    resetUrl: `/auth/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`,
    userId,
  };
}

async function setAuthUserPassword(userId: string, password: string) {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for password restore.");
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) {
    throw error;
  }
}

async function canSignInWithPassword(credentials: AuthCredentials) {
  const client = createAnonTestClient();
  if (!client) {
    throw new Error("Missing Supabase anon client for password verification.");
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });

  if (data.session) {
    await client.auth.signOut();
  }

  return !error && Boolean(data.session);
}

async function getReusableCloudflareImageUrls() {
  const admin = createAdminTestClient();
  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from("ads")
    .select("photos_json")
    .not("photos_json", "is", null)
    .limit(50);

  if (error) {
    throw error;
  }

  const reusableUrls = new Set<string>();
  for (const row of data ?? []) {
    const photos = (row as { photos_json?: unknown }).photos_json;
    if (!Array.isArray(photos)) {
      continue;
    }

    for (const photo of photos) {
      if (typeof photo === "string" && photo.startsWith("https://imagedelivery.net/")) {
        reusableUrls.add(photo);
      }
      if (reusableUrls.size >= 2) {
        return Array.from(reusableUrls);
      }
    }
  }

  return Array.from(reusableUrls);
}

async function ensureActiveSellerAdFixture(
  credentials: AuthCredentials,
): Promise<(() => Promise<void>) | null> {
  const admin = createAdminTestClient();
  if (!admin) {
    return null;
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", credentials.email.trim().toLowerCase())
    .maybeSingle();

  if (profileError || !profile?.id) {
    return null;
  }

  const { data: activeAds, error: activeAdsError } = await admin
    .from("ads")
    .select("id")
    .eq("seller_id", profile.id)
    .eq("status", "active")
    .limit(1);

  if (activeAdsError) {
    throw activeAdsError;
  }

  if ((activeAds ?? []).length > 0) {
    return async () => {};
  }

  const { data: ad, error: adError } = await admin
    .from("ads")
    .select("id,status,is_hidden,expires_at,updated_at")
    .eq("seller_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (adError) {
    throw adError;
  }

  if (!ad?.id) {
    return null;
  }

  const original = ad as SellerAdSnapshot;
  const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await admin
    .from("ads")
    .update({
      status: "active",
      is_hidden: true,
      expires_at: futureExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", original.id);

  if (updateError) {
    throw updateError;
  }

  return async () => {
    const { error: restoreError } = await admin
      .from("ads")
      .update({
        status: original.status,
        is_hidden: original.is_hidden,
        expires_at: original.expires_at,
        updated_at: original.updated_at,
      })
      .eq("id", original.id);

    if (restoreError) {
      throw restoreError;
    }
  };
}

async function ensurePublicSellerAdFixture(
  credentials: AuthCredentials,
): Promise<{ adId: string; cleanup: () => Promise<void> } | null> {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for public listing fixture.");
  }

  const profileId = await getProfileIdForCredentials(credentials);
  if (!profileId) {
    return null;
  }

  const { data: visibleAds, error: visibleAdsError } = await admin
    .from("ads")
    .select("id")
    .eq("seller_id", profileId)
    .eq("status", "active")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (visibleAdsError) {
    throw visibleAdsError;
  }

  const visibleAdId = visibleAds?.[0]?.id;
  if (typeof visibleAdId === "string") {
    return {
      adId: visibleAdId,
      cleanup: async () => {},
    };
  }

  const { data: ad, error: adError } = await admin
    .from("ads")
    .select("id,status,is_hidden,expires_at,updated_at")
    .eq("seller_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (adError) {
    throw adError;
  }

  if (!ad?.id) {
    return null;
  }

  const original = ad as SellerAdSnapshot;
  const { error: updateError } = await admin
    .from("ads")
    .update({
      status: "active",
      is_hidden: false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", original.id);

  if (updateError) {
    throw updateError;
  }

  return {
    adId: original.id,
    cleanup: async () => {
      const { error } = await admin
        .from("ads")
        .update({
          status: original.status,
          is_hidden: original.is_hidden,
          expires_at: original.expires_at,
          updated_at: original.updated_at,
        })
        .eq("id", original.id);

      if (error) {
        throw error;
      }
    },
  };
}

async function deleteSellerAdsByIds(
  credentials: AuthCredentials,
  adIds: Iterable<string>,
) {
  const ids = Array.from(new Set(adIds)).filter(Boolean);
  if (ids.length === 0) {
    return;
  }

  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for listing cleanup.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", credentials.email.trim().toLowerCase())
    .maybeSingle();

  if (profileError || !profile?.id) {
    throw profileError ?? new Error("Seller profile not found for listing cleanup.");
  }

  const { error } = await admin
    .from("ads")
    .delete()
    .in("id", ids)
    .eq("seller_id", profile.id);

  if (error) {
    throw error;
  }
}

async function getSellerAdSnapshot(adId: string) {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for listing verification.");
  }

  const { data, error } = await admin
    .from("ads")
    .select("id,status,price_eur,description,photos_json,is_hidden")
    .eq("id", adId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error(`Ad ${adId} not found.`);
  }

  return data as {
    id: string;
    status: string | null;
    price_eur: number | null;
    description: string | null;
    photos_json: string[] | null;
    is_hidden: boolean | null;
  };
}

async function getProfileIdForCredentials(credentials: AuthCredentials) {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for profile lookup.");
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", credentials.email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof data?.id === "string" ? data.id : null;
}

async function getInquiryById(inquiryId: string) {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for inquiry lookup.");
  }

  const { data, error } = await admin
    .from("inquiries")
    .select("id,ad_id,sender_id,recipient_id,message")
    .eq("id", inquiryId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    | {
        id: string;
        ad_id: string;
        sender_id: string;
        recipient_id: string;
        message: string;
      }
    | null;
}

async function deleteInquiryFixture({
  inquiryId,
  message,
}: {
  inquiryId?: string | null;
  message: string;
}) {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for inquiry cleanup.");
  }

  let query = admin.from("inquiries").delete();
  query = inquiryId ? query.eq("id", inquiryId) : query.eq("message", message);
  const { error } = await query;

  if (error) {
    throw error;
  }
}

async function createPendingDealerVerificationRequestFixture(
  credentials: AuthCredentials,
): Promise<{ dealerName: string; cleanup: () => Promise<void> } | null> {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for dealer verification fixture.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", credentials.email.trim().toLowerCase())
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.id) {
    return null;
  }

  const { data: dealer, error: dealerError } = await admin
    .from("dealers")
    .select("id,name")
    .eq("owner_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (dealerError) {
    throw dealerError;
  }

  if (!dealer?.id) {
    return null;
  }

  const { data: inserted, error: insertError } = await admin
    .from("dealer_verification_requests")
    .insert({
      dealer_id: dealer.id,
      requester_user_id: profile.id,
      request_note: `Release gauntlet admin visibility ${Date.now()}`,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    throw insertError ?? new Error("Dealer verification fixture was not created.");
  }

  return {
    dealerName: typeof dealer.name === "string" ? dealer.name : "Dealer",
    cleanup: async () => {
      const { error } = await admin
        .from("dealer_verification_requests")
        .delete()
        .eq("id", inserted.id);

      if (error) {
        throw error;
      }
    },
  };
}

async function getLatestSellerAdId(credentials: AuthCredentials) {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for listing lookup.");
  }

  const profileId = await getProfileIdForCredentials(credentials);
  if (!profileId) {
    return null;
  }

  const { data, error } = await admin
    .from("ads")
    .select("id")
    .eq("seller_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof data?.id === "string" ? data.id : null;
}

async function sellerAdExists(adId: string) {
  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for listing verification.");
  }

  const { data, error } = await admin
    .from("ads")
    .select("id")
    .eq("id", adId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
}

async function ensureAdActiveForSoldCheck(adId: string) {
  const current = await getSellerAdSnapshot(adId);
  if (current.status === "active") {
    return;
  }

  const admin = createAdminTestClient();
  if (!admin) {
    throw new Error("Missing Supabase service role client for listing activation.");
  }

  const { error } = await admin
    .from("ads")
    .update({
      status: "active",
      is_hidden: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", adId);

  if (error) {
    throw error;
  }
}

async function mockCloudflareImageUploads(
  page: Page,
  reusableCloudflareImageUrls: string[],
) {
  const diagnostics = {
    directUploadRequests: 0,
    directUploadMethods: [] as string[],
    uploadUrlRequests: 0,
  };
  let uploadCount = 0;

  await page.route("**/api/images/upload-url", async (route) => {
    diagnostics.uploadUrlRequests += 1;
    uploadCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        uploadUrl: `https://upload.imagedelivery.net/autobazar123/${uploadCount}`,
      }),
    });
  });

  await page.route("https://upload.imagedelivery.net/**", async (route) => {
    diagnostics.directUploadRequests += 1;
    diagnostics.directUploadMethods.push(route.request().method());
    const corsHeaders = {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
    };

    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
      return;
    }

    const id = route.request().url().split("/").pop() || "1";
    const reusableUrl =
      reusableCloudflareImageUrls[(Number(id) - 1) % reusableCloudflareImageUrls.length];
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        result: {
          variants: [
            reusableUrl
              ?? `https://imagedelivery.net/autobazar123/release-gauntlet-${id}/public`,
          ],
        },
      }),
    });
  });

  return diagnostics;
}

async function selectListingOption(page: Page, testId: string, optionName: RegExp) {
  await page.getByTestId(testId).click();
  await page.getByRole("option", { name: optionName }).click();
}

async function advanceListingWizardTo(page: Page, targetTestId: string) {
  const target = page.getByTestId(targetTestId);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await target.isVisible().catch(() => false)) {
      return;
    }

    await page.getByTestId("listing-submit").click();
  }

  await expect(target).toBeVisible();
}

async function waitForReactInputHydration(page: Page, selector: string) {
  await expect
    .poll(
      () =>
        page
          .locator(selector)
          .evaluate((element) =>
            Boolean(
              (element as HTMLInputElement & { _valueTracker?: unknown })
                ._valueTracker,
            ),
          )
          .catch(() => false),
      { timeout: 15_000 },
    )
    .toBe(true);
}

async function openSellerContactForm(page: Page) {
  const openContactFormButton = page.getByRole("button", {
    name: /Napísať správu predajcovi|Skryť formulár správy/i,
  });
  const contactForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: /Odoslať dopyt/i }) })
    .first();
  const textarea = contactForm.locator("textarea").first();

  await expect(openContactFormButton).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(
      async () => {
        if (await textarea.isVisible().catch(() => false)) {
          return true;
        }

        const label = await openContactFormButton.textContent().catch(() => "");
        if (!/Skryť formulár správy/i.test(label ?? "")) {
          await openContactFormButton.click();
        }

        await page.waitForTimeout(250);
        return textarea.isVisible().catch(() => false);
      },
      { timeout: 20_000 },
    )
    .toBe(true);

  return contactForm;
}

function currentPathname(page: Page): string {
  try {
    return new URL(page.url()).pathname;
  } catch {
    return "";
  }
}

async function seedCookieConsent(page: Page) {
  const consent = JSON.stringify({
    necessary: true,
    analytics: true,
    marketing: true,
    timestamp: Date.now(),
  });

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    {
      key: COOKIE_CONSENT_KEY,
      value: consent,
    },
  );
}

async function loginWithPassword(page: Page, credentials: AuthCredentials) {
  await page.goto("/auth/login?redirect=/", { waitUntil: "domcontentloaded" });

  const alreadyLoggedInContinue = page
    .getByRole("button", { name: /^(Pokračovať|Continue)$/i })
    .first();

  if (await alreadyLoggedInContinue.isVisible().catch(() => false)) {
    await alreadyLoggedInContinue.click();
    await expect
      .poll(async () => {
        await page.goto("/moj-ucet", { waitUntil: "domcontentloaded" });
        return currentPathname(page);
      }, { timeout: 20_000 })
      .toBe("/moj-ucet");
    return;
  }

  await expect(page.locator("#auth-login-email")).toBeVisible({ timeout: 15_000 });
  await waitForReactInputHydration(page, "#auth-login-email");
  await waitForReactInputHydration(page, "#auth-login-password");
  await page.locator("#auth-login-email").fill(credentials.email);
  await page.locator("#auth-login-password").fill(credentials.password);
  const loginForm = page.locator("form").filter({ has: page.locator("#auth-login-email") }).first();

  await loginForm.getByRole("button", { name: /Prihlásiť sa|Sign in|Login/i }).click();

  await expect
    .poll(
      () =>
        page.evaluate(() => ({
          path: window.location.pathname,
          hasAuthCookie: document.cookie.includes("-auth-token="),
        })),
      { timeout: 20_000 },
    )
    .toEqual({ path: "/", hasAuthCookie: true });

  await expect
    .poll(async () => {
      await page.goto("/moj-ucet", { waitUntil: "domcontentloaded" });
      return currentPathname(page);
    }, { timeout: 20_000 })
    .toBe("/moj-ucet");
}

async function openUserMenu(page: Page) {
  const trigger = page
    .locator("header")
    .getByRole("link", { name: /Môj účet|My account/i })
    .first();
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.hover();
  await expect
    .poll(
      () =>
        page
          .getByRole("menu")
          .first()
          .evaluate((element) => window.getComputedStyle(element).pointerEvents),
      { timeout: 8_000 },
    )
    .toBe("auto");
}

async function signOutFromUserMenu(page: Page) {
  const signOutMenuItem = page
    .getByRole("menuitem", { name: /Odhlásiť sa|Odhlásenie|Log Out|Logout|Sign out/i })
    .first();

  await openUserMenu(page);
  await expect(signOutMenuItem).toBeVisible({ timeout: 8_000 });
  await signOutMenuItem.click();
  await expect
    .poll(
      () =>
        page.evaluate(() => ({
          hasAuthCookie: document.cookie.includes("-auth-token="),
          path: window.location.pathname,
        })),
      { timeout: 10_000 },
    )
    .toEqual({ hasAuthCookie: false, path: "/" });
}

async function readDashboardAdsState(page: Page): Promise<"empty" | "with-ads" | "loading"> {
  const noAdsVisible = await page
    .getByText(NO_ACCOUNT_ADS_PATTERN)
    .first()
    .isVisible()
    .catch(() => false);
  if (noAdsVisible) {
    return "empty";
  }

  const editVisible = await page
    .getByRole("button", { name: /Upraviť|Edit/i })
    .first()
    .isVisible()
    .catch(() => false);
  const topVisible = await page
    .getByRole("button", { name: DASHBOARD_TOP_ACTION_PATTERN })
    .first()
    .isVisible()
    .catch(() => false);

  return editVisible || topVisible ? "with-ads" : "loading";
}

function payloadHasTopOptionalFilter(rawPayload: string): boolean {
  try {
    const parsed = JSON.parse(rawPayload) as {
      requests?: Array<{
        params?: string;
        optionalFilters?: string[] | string;
      }>;
    };

    if (!Array.isArray(parsed.requests)) {
      return false;
    }

    return parsed.requests.some((request) => {
      if (Array.isArray(request.optionalFilters)) {
        return request.optionalFilters.includes(TOP_OPTIONAL_FILTER);
      }

      if (typeof request.optionalFilters === "string") {
        return request.optionalFilters.includes(TOP_OPTIONAL_FILTER);
      }

      if (typeof request.params === "string") {
        const decoded = decodeURIComponent(request.params);
        return decoded.includes(TOP_OPTIONAL_FILTER);
      }

      return false;
    });
  } catch {
    return false;
  }
}

function makeSearchHit({
  id,
  brand,
  model,
  tier,
}: {
  id: string;
  brand: string;
  model: string;
  tier: "none" | "premium" | "top";
}) {
  return {
    objectID: id,
    brand,
    model,
    year: 2022,
    price_eur: 19990,
    mileage_km: 45000,
    fuel: "petrol",
    transmission: "manual",
    body_style: "combi",
    power_kw: 110,
    location_city: "Bratislava",
    photos_json: [],
    promotion_tier: tier,
    is_top_ad: tier === "top",
    is_highlighted: tier === "premium",
    is_vat_deductible: false,
    has_service_book: true,
    not_crashed: true,
    is_bought_in_sk: true,
    created_at: Date.now(),
  };
}

test.describe("Release gauntlet critical checks", () => {
  test("guest guardrails protect admin and add-listing entrypoints", async ({ page }) => {
    await seedCookieConsent(page);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => currentPathname(page), { timeout: 15_000 })
      .toBe("/auth/login");
    await expect(page).toHaveURL(/redirect=%2Fadmin|redirect=\/admin/);

    await page.goto("/pridat-inzerat", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#auth-login-email")).toBeVisible();
    await expect(
      page
        .locator("form")
        .filter({ has: page.locator("#auth-login-email") })
        .first()
        .getByRole("button", { name: /Prihlásiť sa|Log In|Sign in|Login/i }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: /Pokračovať s Google|Continue with Google/i })
        .first(),
    ).toBeVisible();
  });

  test("cookie consent persists after accepting all", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate((key) => {
      window.localStorage.removeItem(key);
    }, COOKIE_CONSENT_KEY);

    await page.reload({ waitUntil: "domcontentloaded" });

    const acceptAll = page
      .getByRole("button", { name: /Prijať všetko|Accept all/i })
      .first();
    await expect(acceptAll).toBeVisible({ timeout: 12_000 });
    await acceptAll.click();
    await expect(acceptAll).toBeHidden({ timeout: 8_000 });

    const storedConsentRaw = await page.evaluate((key) =>
      window.localStorage.getItem(key),
      COOKIE_CONSENT_KEY,
    );
    expect(storedConsentRaw).toBeTruthy();

    const storedConsent = JSON.parse(storedConsentRaw || "{}") as {
      analytics?: boolean;
      marketing?: boolean;
    };
    expect(storedConsent.analytics).toBe(true);
    expect(storedConsent.marketing).toBe(true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(acceptAll).toBeHidden({ timeout: 6_000 });
  });

  test("default search keeps promoted results first without old global top filter", async ({ page }) => {
    await seedCookieConsent(page);

    const requestPayloads: string[] = [];
    await page.route(ALGOLIA_QUERIES_ENDPOINT_PATTERN, async (route) => {
      const body = route.request().postData();
      if (body) {
        requestPayloads.push(body);
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              hits: [
                makeSearchHit({
                  id: "search-top-1",
                  brand: "Skoda",
                  model: "Exclusive",
                  tier: "top",
                }),
                makeSearchHit({
                  id: "search-premium-1",
                  brand: "Skoda",
                  model: "Premium",
                  tier: "premium",
                }),
                makeSearchHit({
                  id: "search-basic-1",
                  brand: "Skoda",
                  model: "Basic",
                  tier: "none",
                }),
              ],
              nbHits: 3,
              page: 0,
              hitsPerPage: 24,
              nbPages: 1,
              processingTimeMS: 1,
              query: "octavia",
              params: "",
            },
          ],
        }),
      });
    });

    try {
      await page.goto("/vysledky", { waitUntil: "domcontentloaded" });

      const searchUnavailable = page.getByText(
        /Vyhľadávanie je dočasne nedostupné|Search is temporarily unavailable/i,
      );
      test.skip(
        await searchUnavailable.isVisible().catch(() => false),
        "Algolia client is not configured in this environment.",
      );

      const searchInput = page.locator("#search-results-query");
      await expect(searchInput).toBeVisible({ timeout: 10_000 });
      await searchInput.fill("octavia");

      await expect
        .poll(() => requestPayloads.length, { timeout: 10_000 })
        .toBeGreaterThan(0);

      const resultArticles = page.locator("main article");
      await expect(resultArticles).toHaveCount(3);
      await expect(resultArticles.nth(0).getByRole("heading", { name: "Skoda Exclusive" })).toBeVisible();
      await expect(resultArticles.nth(0).getByText(/^Exclusive$/)).toBeVisible();
      await expect(resultArticles.nth(1).getByRole("heading", { name: "Skoda Premium" })).toBeVisible();
      await expect(resultArticles.nth(1).getByText(/^Premium$/)).toBeVisible();
      await expect(resultArticles.nth(2).getByRole("heading", { name: "Skoda Basic" })).toBeVisible();

      expect(requestPayloads.some((payload) => payloadHasTopOptionalFilter(payload))).toBe(false);
    } finally {
      await page.unroute(ALGOLIA_QUERIES_ENDPOINT_PATTERN);
    }
  });

  test("legacy credits route redirects to pricing", async ({ page }) => {
    await seedCookieConsent(page);
    await page.goto("/kredity", { waitUntil: "domcontentloaded" });

    await expect
      .poll(() => currentPathname(page), { timeout: 10_000 })
      .toBe("/ceny");
    await expect(page.getByRole("heading", { name: /Cenník|Pricing/i })).toBeVisible();
    await expect(page.getByText(/Premium|Exclusive/i).first()).toBeVisible();
  });
});

test.describe("Release gauntlet authenticated flows", () => {
  test.beforeEach(async ({ page }) => {
    await seedCookieConsent(page);
  });

  test("authenticated user can reach dashboard and sign out", async ({ page }) => {
    test.skip(
      !hasCredentials(PRIMARY_CREDENTIALS),
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run the primary authenticated flow.",
    );
    if (!hasCredentials(PRIMARY_CREDENTIALS)) {
      return;
    }
    await loginWithPassword(page, PRIMARY_CREDENTIALS);

    await page.goto("/moj-ucet", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/moj-ucet/);
    await expect(page.getByText(/Moje inzeráty|My ads/i).first()).toBeVisible();

    await signOutFromUserMenu(page);

    await page.goto("/moj-ucet", { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.evaluate(() => document.cookie.includes("-auth-token=")), { timeout: 10_000 })
      .toBe(false);
    const hasLoginField = await page.locator("#auth-login-email").first().isVisible().catch(() => false);
    const hasLoginLink = await page
      .getByRole("link", { name: /Log In|Prihlásiť/i })
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasLoginField || hasLoginLink).toBe(true);
    await expect(page.getByText(/Moje inzeráty|My ads/i).first()).toBeHidden();
  });

  test("dashboard create tab keeps a single page h1", async ({ page }) => {
    test.skip(
      !hasCredentials(PRIMARY_CREDENTIALS),
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run the primary authenticated flow.",
    );
    if (!hasCredentials(PRIMARY_CREDENTIALS)) {
      return;
    }

    await loginWithPassword(page, PRIMARY_CREDENTIALS);
    await page.goto("/moj-ucet?tab=create", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("listing-submit")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Správa vášho účtu|Manage your account|Fiók kezelése/i,
      }),
    ).toBeVisible();
  });

  test("password recovery token lets a non-admin reset and restore password", async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(
      !hasCredentials(NON_ADMIN_CREDENTIALS),
      "Set E2E_NON_ADMIN_EMAIL/E2E_NON_ADMIN_PASSWORD to run recovery-token checks.",
    );
    if (!hasCredentials(NON_ADMIN_CREDENTIALS)) {
      return;
    }

    const recovery = await createPasswordRecoveryFixture(NON_ADMIN_CREDENTIALS);
    const temporaryPassword = `Aa1!release-${Date.now()}`;
    const temporaryCredentials = {
      email: NON_ADMIN_CREDENTIALS.email,
      password: temporaryPassword,
    };

    try {
      await page.goto(recovery.resetUrl, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /Nové heslo|New password/i }),
      ).toBeVisible({ timeout: 15_000 });

      const passwordInput = page.locator("#password");
      const confirmPasswordInput = page.locator("#confirmPassword");
      await waitForReactInputHydration(page, "#password");
      await waitForReactInputHydration(page, "#confirmPassword");
      await passwordInput.fill(temporaryPassword);
      await expect(passwordInput).toHaveValue(temporaryPassword);
      await confirmPasswordInput.fill(temporaryPassword);
      await expect(passwordInput).toHaveValue(temporaryPassword);
      await expect(confirmPasswordInput).toHaveValue(temporaryPassword);

      const recoveryResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/account/password/recovery")
          && response.request().method() === "POST",
        { timeout: 30_000 },
      );
      await page
        .getByRole("button", { name: /Uložiť nové heslo|Save new password/i })
        .click();
      const recoveryResponse = await recoveryResponsePromise;
      expect(recoveryResponse.ok()).toBe(true);

      await expect(
        page.getByText(/Heslo bolo úspešne zmenené|Password changed successfully/i),
      ).toBeVisible({ timeout: 15_000 });

      expect(await canSignInWithPassword(NON_ADMIN_CREDENTIALS)).toBe(false);
      await loginWithPassword(page, temporaryCredentials);
    } finally {
      await setAuthUserPassword(recovery.userId, NON_ADMIN_CREDENTIALS.password);
    }

    await expect
      .poll(() => canSignInWithPassword(NON_ADMIN_CREDENTIALS), { timeout: 20_000 })
      .toBe(true);
  });

  test("danger-zone delete gate only enables submit with DELETE keyword", async ({ page }) => {
    test.skip(
      !hasCredentials(PRIMARY_CREDENTIALS),
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run account settings checks.",
    );
    if (!hasCredentials(PRIMARY_CREDENTIALS)) {
      return;
    }
    await loginWithPassword(page, PRIMARY_CREDENTIALS);

    await page.goto("/moj-ucet?tab=settings", { waitUntil: "domcontentloaded" });

    const confirmInput = page.locator("#dashboard-delete-confirm");
    await expect(confirmInput).toBeVisible({ timeout: 12_000 });

    const deleteButton = page
      .getByRole("button", { name: /Zmazať účet|Delete account/i })
      .first();

    await expect(deleteButton).toBeDisabled();
    await confirmInput.fill("delete");
    await expect(deleteButton).toBeEnabled();
    await confirmInput.fill("NOPE");
    await expect(deleteButton).toBeDisabled();
  });

  test("non-admin authenticated user is redirected away from admin page", async ({ page }) => {
    test.skip(
      !hasCredentials(NON_ADMIN_CREDENTIALS),
      "Set E2E_NON_ADMIN_EMAIL/E2E_NON_ADMIN_PASSWORD, or run with non-admin E2E_AUTH credentials.",
    );
    if (!hasCredentials(NON_ADMIN_CREDENTIALS)) {
      return;
    }
    await loginWithPassword(page, NON_ADMIN_CREDENTIALS);

    const response = await page.goto("/admin", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(403);
    await expect(page.getByText(/Forbidden: Admin access required/i)).toBeVisible();
  });

  test("admin authenticated user can reach admin dashboard", async ({ page }) => {
    test.skip(
      !hasCredentials(ADMIN_CREDENTIALS),
      "Set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD, or run with E2E_AUTH_IS_ADMIN=true.",
    );
    if (!hasCredentials(ADMIN_CREDENTIALS)) {
      return;
    }
    await loginWithPassword(page, ADMIN_CREDENTIALS);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => currentPathname(page), { timeout: 15_000 })
      .toBe("/admin");
    await expect(
      page.getByRole("heading", { name: /Riadiace centrum|Control Center/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("non-dealer authenticated user sees dealer registration prompt", async ({ page }) => {
    test.skip(
      !hasCredentials(NON_DEALER_CREDENTIALS),
      "Set E2E_NON_ADMIN_EMAIL/E2E_NON_ADMIN_PASSWORD or E2E_AUTH credentials to run non-dealer checks.",
    );
    if (!hasCredentials(NON_DEALER_CREDENTIALS)) {
      return;
    }
    await loginWithPassword(page, NON_DEALER_CREDENTIALS);

    await page.goto("/dealer", { waitUntil: "domcontentloaded" });

    const billingTab = page.getByRole("tab", { name: /Platby/i }).first();
    test.skip(
      await billingTab.isVisible().catch(() => false),
      "Configured E2E account is already a dealer; non-dealer prompt is not applicable.",
    );

    await expect(
      page.getByRole("heading", { name: /Staňte sa dealerom|Become a Dealer/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("link", { name: /Registrovať dealerstvo|Register Dealership/i }).first(),
    ).toBeVisible();
  });

  test("dashboard paid action uses private listing checkout and success route", async ({ page }) => {
    test.skip(
      !hasCredentials(SELLER_WITH_AD_CREDENTIALS),
      "Set E2E_SELLER_EMAIL/E2E_SELLER_PASSWORD, or E2E_AUTH credentials, to run seller dashboard checks.",
    );
    if (!hasCredentials(SELLER_WITH_AD_CREDENTIALS)) {
      return;
    }
    const restoreSellerAd = await ensureActiveSellerAdFixture(SELLER_WITH_AD_CREDENTIALS);
    test.skip(
      !restoreSellerAd,
      "Configured E2E seller account has no owned ad fixture that can be activated for dashboard checks.",
    );
    const checkoutCapture: { type?: string; adId?: string; operation?: string } = {};

    try {
      await loginWithPassword(page, SELLER_WITH_AD_CREDENTIALS);

      await page.route("**/api/account/ads/apply-action", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            checkoutRequired: true,
            operation: "prolong_top",
          }),
        });
      });

      await page.route("**/api/stripe/checkout", async (route) => {
        const payload = route.request().postDataJSON() as
          | { type?: string; adId?: string; operation?: string }
          | null;
        checkoutCapture.type = payload?.type;
        checkoutCapture.adId = payload?.adId;
        checkoutCapture.operation = payload?.operation;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sessionId: "cs_test_release_gauntlet",
            url: "/platba/uspech?session_id=cs_test_release_gauntlet",
          }),
        });
      });

      await page.goto("/moj-ucet?tab=ads", { waitUntil: "domcontentloaded" });

      await expect
        .poll(() => readDashboardAdsState(page), { timeout: 15_000 })
        .not.toBe("loading");
      test.skip(
        (await readDashboardAdsState(page)) === "empty",
        "Configured E2E account has no ads to verify paid dashboard actions.",
      );

      const topButton = page
        .getByRole("button", { name: DASHBOARD_TOP_ACTION_PATTERN })
        .first();
      await expect(topButton).toBeVisible();
      await topButton.click();

      await expect
        .poll(() => currentPathname(page), { timeout: 10_000 })
        .toBe("/platba/uspech");

      expect(checkoutCapture.type).toBe("private_listing_action");
      expect(checkoutCapture.operation).toBe("prolong_top");
      expect(checkoutCapture.adId).toBeTruthy();
    } finally {
      await restoreSellerAd?.();
      await page.unroute("**/api/account/ads/apply-action");
      await page.unroute("**/api/stripe/checkout");
    }
  });

  test("buyer inquiry reaches the seller messages dashboard", async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(
      !hasCredentials(NON_ADMIN_CREDENTIALS) || !hasCredentials(SELLER_WITH_AD_CREDENTIALS),
      "Set E2E_NON_ADMIN_EMAIL/E2E_NON_ADMIN_PASSWORD and E2E_SELLER_EMAIL/E2E_SELLER_PASSWORD to run inquiry delivery checks.",
    );
    if (!hasCredentials(NON_ADMIN_CREDENTIALS) || !hasCredentials(SELLER_WITH_AD_CREDENTIALS)) {
      return;
    }

    test.skip(
      NON_ADMIN_CREDENTIALS.email.trim().toLowerCase()
        === SELLER_WITH_AD_CREDENTIALS.email.trim().toLowerCase(),
      "Inquiry delivery needs distinct buyer and seller accounts.",
    );

    const buyerProfileId = await getProfileIdForCredentials(NON_ADMIN_CREDENTIALS);
    const sellerProfileId = await getProfileIdForCredentials(SELLER_WITH_AD_CREDENTIALS);
    test.skip(
      !buyerProfileId || !sellerProfileId,
      "Configured buyer or seller E2E profile is missing.",
    );
    if (!buyerProfileId || !sellerProfileId) {
      return;
    }

    const publicAdFixture = await ensurePublicSellerAdFixture(SELLER_WITH_AD_CREDENTIALS);
    test.skip(
      !publicAdFixture,
      "Configured seller E2E account has no ad fixture for inquiry delivery checks.",
    );
    if (!publicAdFixture) {
      return;
    }

    const inquiryMessage = `Release gauntlet inquiry ${Date.now()}`;
    let inquiryId: string | null = null;

    try {
      await loginWithPassword(page, NON_ADMIN_CREDENTIALS);
      await page.goto(`/auto/${publicAdFixture.adId}`, {
        waitUntil: "domcontentloaded",
      });

      const contactForm = await openSellerContactForm(page);
      await expect(contactForm.locator("textarea").first()).toBeVisible({
        timeout: 20_000,
      });
      await contactForm.locator("textarea").first().fill(inquiryMessage);

      const submitButton = contactForm.getByRole("button", { name: /Odoslať dopyt/i });
      await expect(submitButton).toBeEnabled({ timeout: 45_000 });

      const inquiryResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/inquiries")
          && response.request().method() === "POST",
        { timeout: 30_000 },
      );
      await submitButton.click();
      const inquiryResponse = await inquiryResponsePromise;
      expect(inquiryResponse.ok()).toBe(true);

      const inquiryPayload = (await inquiryResponse.json()) as {
        inquiryId?: string;
      };
      expect(inquiryPayload.inquiryId).toBeTruthy();
      inquiryId = inquiryPayload.inquiryId ?? null;

      await expect(page.getByText(/Správa odoslaná/i).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect
        .poll(async () => {
          if (!inquiryId) return null;
          const inquiry = await getInquiryById(inquiryId);
          return inquiry
            ? {
                adId: inquiry.ad_id,
                senderId: inquiry.sender_id,
                recipientId: inquiry.recipient_id,
                message: inquiry.message,
              }
            : null;
        }, { timeout: 15_000 })
        .toEqual({
          adId: publicAdFixture.adId,
          senderId: buyerProfileId,
          recipientId: sellerProfileId,
          message: inquiryMessage,
        });

      await signOutFromUserMenu(page);
      await loginWithPassword(page, SELLER_WITH_AD_CREDENTIALS);
      await page.goto("/moj-ucet?tab=messages", {
        waitUntil: "domcontentloaded",
      });

      await expect(
        page.getByRole("heading", { name: /Konverzácie|Conversations/i }).first(),
      ).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(inquiryMessage, { exact: true }).first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(/Váš inzerát|Your ad/i).first()).toBeVisible();
    } finally {
      await deleteInquiryFixture({ inquiryId, message: inquiryMessage });
      await publicAdFixture.cleanup();
    }

    if (inquiryId) {
      await expect
        .poll(() => getInquiryById(inquiryId), { timeout: 15_000 })
        .toBe(null);
    }
  });

  test("dealer billing topup uses dealer_topup checkout payload", async ({ page }) => {
    test.skip(
      !hasCredentials(DEALER_CREDENTIALS),
      "Set E2E_DEALER_EMAIL/E2E_DEALER_PASSWORD, or E2E_AUTH credentials, to run dealer checks.",
    );
    if (!hasCredentials(DEALER_CREDENTIALS)) {
      return;
    }
    await loginWithPassword(page, DEALER_CREDENTIALS);

    const checkoutCapture: { type?: string; packageId?: string } = {};

    await page.goto("/dealer", { waitUntil: "domcontentloaded" });

    const billingTab = page.getByRole("tab", { name: /Platby/i }).first();
    await expect(billingTab).toBeVisible({ timeout: 15_000 });

    await page.route("**/api/stripe/checkout", async (route) => {
      const payload = route.request().postDataJSON() as
        | { type?: string; packageId?: string }
        | null;
      checkoutCapture.type = payload?.type;
      checkoutCapture.packageId = payload?.packageId;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionId: "cs_test_dealer_topup",
          url: "/platba/uspech?session_id=cs_test_dealer_topup",
        }),
      });
    });

    try {
      await billingTab.click();

      const topupButton = page.getByRole("button", { name: /Dobiť zostatok/i }).first();
      await expect(topupButton).toBeVisible();
      await topupButton.click();

      await expect
        .poll(() => currentPathname(page), { timeout: 10_000 })
        .toBe("/platba/uspech");

      expect(checkoutCapture.type).toBe("dealer_topup");
      expect(checkoutCapture.packageId).toBe("dealer_100");
    } finally {
      await page.unroute("**/api/stripe/checkout");
    }
  });

  test("admin settings exposes dealer verification request area", async ({ page }) => {
    test.skip(
      !hasCredentials(ADMIN_CREDENTIALS) || !hasCredentials(DEALER_CREDENTIALS),
      "Set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD and E2E_DEALER_EMAIL/E2E_DEALER_PASSWORD to run admin dealer verification checks.",
    );
    if (!hasCredentials(ADMIN_CREDENTIALS) || !hasCredentials(DEALER_CREDENTIALS)) {
      return;
    }

    const fixture = await createPendingDealerVerificationRequestFixture(DEALER_CREDENTIALS);
    test.skip(
      !fixture,
      "Configured E2E dealer account has no dealer profile for admin verification checks.",
    );

    if (!fixture) {
      return;
    }

    try {
      await loginWithPassword(page, ADMIN_CREDENTIALS);

      await page.goto("/admin?tab=settings", { waitUntil: "domcontentloaded" });
      await expect
        .poll(() => currentPathname(page), { timeout: 15_000 })
        .toBe("/admin");

      await expect(page.getByText("Žiadosti o overenie dealerov").first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(fixture.dealerName).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(/Čaká/i).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /Schváliť/i }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /Zamietnuť/i }).first()).toBeVisible();
    } finally {
      await fixture.cleanup();
    }
  });

  test("dashboard ads expose edit/top/sold controls when ads are present", async ({ page }) => {
    test.skip(
      !hasCredentials(SELLER_WITH_AD_CREDENTIALS),
      "Set E2E_SELLER_EMAIL/E2E_SELLER_PASSWORD, or E2E_AUTH credentials, to run owned-ad checks.",
    );
    if (!hasCredentials(SELLER_WITH_AD_CREDENTIALS)) {
      return;
    }
    const restoreSellerAd = await ensureActiveSellerAdFixture(SELLER_WITH_AD_CREDENTIALS);
    test.skip(
      !restoreSellerAd,
      "Configured E2E seller account has no owned ad fixture that can be activated for dashboard checks.",
    );

    try {
      await loginWithPassword(page, SELLER_WITH_AD_CREDENTIALS);

      await page.goto("/moj-ucet?tab=ads", { waitUntil: "domcontentloaded" });

      await expect
        .poll(() => readDashboardAdsState(page), { timeout: 15_000 })
        .not.toBe("loading");
      test.skip(
        (await readDashboardAdsState(page)) === "empty",
        "Configured E2E account has no ads to verify dashboard action controls.",
      );

      const editLink = page.getByRole("link", { name: /Upraviť|Edit/i }).first();
      await expect(editLink).toBeVisible();
      await expect(
        page.getByRole("button", { name: DASHBOARD_TOP_ACTION_PATTERN }).first(),
      ).toBeVisible();
      await expect(
        page
          .getByRole("button", { name: /Označiť ako predané|Mark as sold/i })
          .first(),
      ).toBeVisible();

      await editLink.click();
      await expect(page).toHaveURL(/\/upravit-inzerat\/.+/);
    } finally {
      await restoreSellerAd?.();
    }
  });

  test("non-owner cannot open another seller's edit page", async ({ page }) => {
    test.skip(
      !hasCredentials(SELLER_WITH_AD_CREDENTIALS) || !hasCredentials(NON_ADMIN_CREDENTIALS),
      "Set E2E_SELLER_EMAIL/E2E_SELLER_PASSWORD and E2E_NON_ADMIN_EMAIL/E2E_NON_ADMIN_PASSWORD to run non-owner edit checks.",
    );
    if (!hasCredentials(SELLER_WITH_AD_CREDENTIALS) || !hasCredentials(NON_ADMIN_CREDENTIALS)) {
      return;
    }

    const sellerProfileId = await getProfileIdForCredentials(SELLER_WITH_AD_CREDENTIALS);
    const nonOwnerProfileId = await getProfileIdForCredentials(NON_ADMIN_CREDENTIALS);
    test.skip(
      !sellerProfileId || !nonOwnerProfileId || sellerProfileId === nonOwnerProfileId,
      "Configured seller and non-owner accounts must resolve to different profiles.",
    );

    const sellerAdId = await getLatestSellerAdId(SELLER_WITH_AD_CREDENTIALS);
    test.skip(
      !sellerAdId,
      "Configured seller account has no owned ad fixture for non-owner edit denial.",
    );

    await loginWithPassword(page, NON_ADMIN_CREDENTIALS);
    await page.goto(`/upravit-inzerat/${sellerAdId}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Chyba|Error/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(
        /Nemáte oprávnenie na prístup k tejto stránke|You are not authorized to access this page|Stránka sa nenašla|Page not found/i,
      ),
    ).toBeVisible();
    await expect(page.getByTestId("listing-submit")).toHaveCount(0);
  });

  test("seller can create, edit photos, mark a listing sold, and delete it", async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(
      !hasCredentials(SELLER_WITH_AD_CREDENTIALS),
      "Set E2E_SELLER_EMAIL/E2E_SELLER_PASSWORD, or E2E_AUTH credentials, to run listing lifecycle checks.",
    );
    if (!hasCredentials(SELLER_WITH_AD_CREDENTIALS)) {
      return;
    }

    const createdAdIds = new Set<string>();
    const uploadClientErrors: string[] = [];

    try {
      await loginWithPassword(page, SELLER_WITH_AD_CREDENTIALS);
      const reusableCloudflareImageUrls = await getReusableCloudflareImageUrls();
      const uploadDiagnostics = await mockCloudflareImageUploads(
        page,
        reusableCloudflareImageUrls,
      );
      page.on("console", async (message) => {
        if (!message.text().includes("Photo upload error")) {
          return;
        }

        const errorArg = message.args()[1];
        const errorDetails = errorArg
          ? await errorArg
              .evaluate((value) => {
                if (value instanceof Error) {
                  return {
                    message: value.message,
                    name: value.name,
                    stack: value.stack,
                  };
                }

                return value;
              })
              .catch(() => null)
          : null;

        uploadClientErrors.push(
          JSON.stringify({
            details: errorDetails,
            text: message.text(),
          }),
        );
      });
      page.on("requestfailed", (request) => {
        if (
          request.url().includes("/api/images/upload-url")
          || request.url().includes("https://upload.imagedelivery.net/")
        ) {
          uploadClientErrors.push(
            JSON.stringify({
              error: request.failure()?.errorText,
              method: request.method(),
              text: "requestfailed",
              url: request.url(),
            }),
          );
        }
      });

      await page.goto("/pridat-inzerat", { waitUntil: "domcontentloaded" });
      await page.getByTestId("listing-category-personal").click();
      await page.getByTestId("listing-submit").click();

      await selectListingOption(page, "listing-brand", /^Škoda$/);
      await selectListingOption(page, "listing-model", /^Octavia$/);
      await selectListingOption(page, "listing-year", /^2020$/);
      await page.getByTestId("listing-submit").click();

      await page.getByTestId("listing-fuel-petrol").click();
      await page.getByTestId("listing-transmission-manual").click();
      await page.getByTestId("listing-body-sedan").click();
      await page.getByTestId("listing-mileage").fill("123456");
      await page.getByTestId("listing-submit").click();

      await page.getByTestId("listing-location-city").fill("Bratislava");
      await page.getByTestId("listing-description").fill("Release gauntlet listing lifecycle test.");
      await page.getByTestId("listing-submit").click();

      await page.getByTestId("listing-photo-upload").setInputFiles(LISTING_TEST_IMAGE_PATHS);
      await expect(page.getByTestId("listing-photo-count")).toHaveText("2");
      await page.getByTestId("listing-price").fill("12345");

      const createResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/account/ads")
          && response.request().method() === "POST",
        { timeout: 30_000 },
      ).catch((error: unknown) => {
        throw new Error(
          [
            error instanceof Error ? error.message : String(error),
            `Upload diagnostics: ${JSON.stringify(uploadDiagnostics)}`,
            `Client upload errors: ${uploadClientErrors.join(" | ") || "none"}`,
          ].join("\n"),
        );
      });
      await page.getByTestId("listing-submit").click();
      const createResponse = await createResponsePromise;
      const createPayload = (await createResponse.json()) as {
        adId?: string;
        error?: string;
      };
      expect(
        createResponse.ok(),
        `Listing create failed with ${createResponse.status()}: ${JSON.stringify(createPayload)}`,
      ).toBe(true);
      expect(createPayload.adId).toBeTruthy();
      const adId = createPayload.adId!;
      createdAdIds.add(adId);

      await expect
        .poll(() => currentPathname(page), { timeout: 20_000 })
        .toBe("/moj-ucet");

      await page.goto(`/upravit-inzerat/${adId}`, { waitUntil: "domcontentloaded" });
      await advanceListingWizardTo(page, "listing-description");
      await page
        .getByTestId("listing-description")
        .fill("Release gauntlet updated description.");
      await page.getByTestId("listing-submit").click();

      await page.getByTestId("listing-photo-remove-0").click();
      await expect(page.getByTestId("listing-photo-count")).toHaveText("1");
      await page.getByTestId("listing-price").fill("13000");

      const editResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/account/ads")
          && response.request().method() === "PATCH",
      );
      await page.getByTestId("listing-submit").click();
      const editResponse = await editResponsePromise;
      expect(editResponse.ok()).toBe(true);

      await expect
        .poll(async () => {
          const snapshot = await getSellerAdSnapshot(adId);
          return {
            price: snapshot.price_eur,
            description: snapshot.description,
            photos: snapshot.photos_json?.length ?? 0,
          };
        }, { timeout: 15_000 })
        .toEqual({
          price: 13000,
          description: "Release gauntlet updated description.",
          photos: 1,
        });

      await ensureAdActiveForSoldCheck(adId);
      await page.goto("/moj-ucet?tab=ads", { waitUntil: "domcontentloaded" });
      await expect
        .poll(() => readDashboardAdsState(page), { timeout: 15_000 })
        .toBe("with-ads");
      await page
        .getByRole("button", { name: /Označiť ako predané|Mark as sold/i })
        .first()
        .click();
      await expect
        .poll(async () => (await getSellerAdSnapshot(adId)).status, { timeout: 15_000 })
        .toBe("sold");

      const deleteResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/account/ads")
          && response.request().method() === "DELETE",
        { timeout: 30_000 },
      );
      await page.getByTestId(`listing-delete-${adId}`).click();
      await page.getByTestId("listing-delete-confirm").click();
      const deleteResponse = await deleteResponsePromise;
      expect(deleteResponse.ok()).toBe(true);
      await expect
        .poll(() => sellerAdExists(adId), { timeout: 15_000 })
        .toBe(false);
      createdAdIds.delete(adId);
    } finally {
      await page.unroute("**/api/images/upload-url").catch(() => undefined);
      await page.unroute("https://upload.imagedelivery.net/**").catch(() => undefined);
      await deleteSellerAdsByIds(SELLER_WITH_AD_CREDENTIALS, createdAdIds);
    }
  });
});
