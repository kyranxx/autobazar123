import { expect, test, type Page } from "@playwright/test";

const COOKIE_CONSENT_KEY = "autobazar123_cookie_consent";
const TOP_OPTIONAL_FILTER = "is_top_ad:true<score=10>";

const AUTH_EMAIL = process.env.E2E_AUTH_EMAIL ?? "";
const AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD ?? "";
const HAS_AUTH_CREDS = AUTH_EMAIL.length > 0 && AUTH_PASSWORD.length > 0;
const AUTH_IS_ADMIN = process.env.E2E_AUTH_IS_ADMIN === "true";

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

async function loginWithPassword(page: Page) {
  await page.goto("/auth/login?redirect=/", { waitUntil: "domcontentloaded" });

  const alreadyLoggedInContinue = page
    .getByRole("button", { name: /Pokračovať|Continue/i })
    .first();

  if (await alreadyLoggedInContinue.isVisible().catch(() => false)) {
    await alreadyLoggedInContinue.click();
    return;
  }

  await expect(page.locator("#auth-login-email")).toBeVisible({ timeout: 15_000 });
  await page.locator("#auth-login-email").fill(AUTH_EMAIL);
  await page.locator("#auth-login-password").fill(AUTH_PASSWORD);

  await page
    .getByRole("button", { name: /Prihlásiť sa|Sign in|Login/i })
    .first()
    .click();

  await expect
    .poll(() => currentPathname(page), { timeout: 20_000 })
    .not.toBe("/auth/login");
}

async function openUserMenu(page: Page) {
  const trigger = page
    .getByRole("button", { name: /Používateľské menu|User menu/i })
    .first();
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
}

async function signOutFromUserMenu(page: Page) {
  await openUserMenu(page);
  await page
    .getByRole("button", { name: /Odhlásiť sa|Odhlásenie|Logout|Sign out/i })
    .first()
    .click();
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
        .getByRole("button", { name: /Prihlásiť sa|Log In|Sign in|Login/i })
        .first(),
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

  test("search requests include top-ad optional ranking filter", async ({ page }) => {
    await seedCookieConsent(page);

    const requestPayloads: string[] = [];
    page.on("request", (request) => {
      const isAlgoliaQueryRequest =
        request.method() === "POST" &&
        /\/1\/indexes\/.*\/queries/i.test(request.url());

      if (!isAlgoliaQueryRequest) return;

      const body = request.postData();
      if (body) {
        requestPayloads.push(body);
      }
    });

    await page.goto("/vysledky", { waitUntil: "domcontentloaded" });

    const searchUnavailable = await page
      .getByText(/Search is temporarily unavailable/i)
      .isVisible()
      .catch(() => false);
    test.skip(searchUnavailable, "Algolia client is not configured in this environment.");

    const searchInput = page.locator("input[type='search']").first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill("octavia");

    await expect
      .poll(() => requestPayloads.some((payload) => payloadHasTopOptionalFilter(payload)), {
        timeout: 15_000,
      })
      .toBe(true);
  });

  test("credits page exposes premium actions and full pack catalog", async ({ page }) => {
    await seedCookieConsent(page);
    await page.goto("/kredity", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /Kúpiť kredity|Buy credits/i }),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: /Kúpiť|Buy/i })).toHaveCount(5);
    await expect(page.getByText(/Zverejniť inzerát|Publish Ad/i).first()).toBeVisible();
    await expect(page.getByText(/Topovanie|Top Ad/i).first()).toBeVisible();
    await expect(page.getByText(/Zvýraznenie|Highlight/i).first()).toBeVisible();
    await expect(page.getByText(/Vyzdvihnúť|Bump/i).first()).toBeVisible();
  });
});

test.describe("Release gauntlet authenticated flows", () => {
  test.skip(!HAS_AUTH_CREDS, "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated flow checks.");

  test.beforeEach(async ({ page }) => {
    await seedCookieConsent(page);
    await loginWithPassword(page);
  });

  test("authenticated user can reach dashboard and sign out", async ({ page }) => {
    await page.goto("/moj-ucet", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/moj-ucet/);
    await expect(page.getByText(/Moje inzeráty|My ads/i).first()).toBeVisible();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await signOutFromUserMenu(page);

    await page.goto("/moj-ucet", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("link", { name: /Prihlásiť sa|Login/i }),
    ).toBeVisible();
  });

  test("danger-zone delete gate only enables submit with DELETE keyword", async ({ page }) => {
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
    test.skip(AUTH_IS_ADMIN, "Configured account is admin; non-admin redirect check is not applicable.");

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => currentPathname(page), { timeout: 15_000 })
      .toBe("/");
  });

  test("credits checkout starts with selected pack and redirects to success route", async ({ page }) => {
    const checkoutCapture: { packId?: string } = {};

    await page.route("**/api/stripe/checkout", async (route) => {
      const payload = route.request().postDataJSON() as { packId?: string } | null;
      checkoutCapture.packId = payload?.packId;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionId: "cs_test_release_gauntlet",
          url: "/kredity/uspech?session_id=cs_test_release_gauntlet",
        }),
      });
    });

    try {
      await page.goto("/kredity", { waitUntil: "domcontentloaded" });
      const buyButtons = page.getByRole("button", { name: /Kúpiť|Buy/i });
      await expect(buyButtons.first()).toBeVisible({ timeout: 10_000 });
      await buyButtons.first().click();

      await expect
        .poll(() => currentPathname(page), { timeout: 10_000 })
        .toBe("/kredity/uspech");
      expect(checkoutCapture.packId).toBeTruthy();
    } finally {
      await page.unroute("**/api/stripe/checkout");
    }
  });

  test("dashboard ads expose edit/top/sold controls when ads are present", async ({ page }) => {
    await page.goto("/moj-ucet?tab=ads", { waitUntil: "domcontentloaded" });

    const noAds = await page
      .getByText(/Zatiaľ nemáte žiadne inzeráty|No ads yet/i)
      .first()
      .isVisible()
      .catch(() => false);
    test.skip(noAds, "Configured E2E account has no ads to verify dashboard action controls.");

    const editButton = page.getByRole("button", { name: /Upraviť|Edit/i }).first();
    await expect(editButton).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Topovať|Topovat|TOP|Boost/i }).first(),
    ).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: /Označiť ako predané|Mark as sold/i })
        .first(),
    ).toBeVisible();

    await editButton.click();
    await expect(page).toHaveURL(/\/upravit-inzerat\/.+/);
  });
});
