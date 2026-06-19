import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const COOKIE_CONSENT_KEY = "autobazar123_cookie_consent";
const TOP_OPTIONAL_FILTER = "is_top_ad:true<score=10>";
const ALGOLIA_QUERIES_ENDPOINT_PATTERN =
  /\/1\/indexes\/(?:\*|[^/?]+)\/queries(?:\?|$)/;
const NO_ACCOUNT_ADS_PATTERN =
  /Zatiaľ nemáte žiadne inzeráty|Nemáte žiadne inzeráty|You don't have any ads yet|You have no ads|No ads yet/i;
const DASHBOARD_TOP_ACTION_PATTERN = /Exclusive|Topovať|Topovat|Boost|Feature/i;

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
  await page.waitForTimeout(1500);
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
});
