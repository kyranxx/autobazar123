import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

const NAV_RACE_ITERATIONS = Number(process.env.NAV_RACE_ITERATIONS || 8);
const E2E_AUTH_EMAIL = process.env.E2E_AUTH_EMAIL ?? "";
const E2E_AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD ?? "";
const HAS_E2E_AUTH_CREDS =
  E2E_AUTH_EMAIL.length > 0 && E2E_AUTH_PASSWORD.length > 0;

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function waitForPath(page: Page, pathname: string, timeoutMs: number) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const url = new URL(page.url());
      if (url.pathname === pathname) return;
    } catch {
      // Ignore URL parse errors during navigation transitions.
    }

    await page.waitForTimeout(100);
  }

  throw new Error(
    `Timed out waiting for navigation to '${pathname}'. Current URL: ${page.url()}`,
  );
}

async function loginWithPassword(page: Page) {
  await page.goto("/auth/login?redirect=/", { waitUntil: "domcontentloaded" });

  const alreadyLoggedInContinue = page
    .getByRole("button", { name: /continue|pokra/i })
    .first();

  if (await alreadyLoggedInContinue.isVisible().catch(() => false)) {
    await alreadyLoggedInContinue.click();
    return;
  }

  await expect(page.locator("#auth-login-email")).toBeVisible({ timeout: 15_000 });
  await page.locator("#auth-login-email").fill(E2E_AUTH_EMAIL);
  await page.locator("#auth-login-password").fill(E2E_AUTH_PASSWORD);

  await page
    .getByRole("button", { name: /sign in|login|prihl/i })
    .first()
    .click();

  await expect
    .poll(() => {
      try {
        return new URL(page.url()).pathname;
      } catch {
        return "";
      }
    }, { timeout: 20_000 })
    .not.toBe("/auth/login");
}

test.describe("Autobazar123 E2E", () => {
  test("Homepage loads", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(/Autobazar123/i);
    await expect(page.locator("nav").first()).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Cars listing page", async ({ page }) => {
    await page.goto("/vysledky", { waitUntil: "domcontentloaded" });
    await page
      .locator("main, input, [role='main']")
      .first()
      .waitFor({ timeout: 10_000 });

    const title = await page.title();
    const normalizedTitle = normalizeText(title);
    const isExpected =
      normalizedTitle.includes("vysledky") ||
      normalizedTitle.includes("autobazar123");

    expect(isExpected).toBe(true);

    const filtersCount = await page
      .locator("[class*='filter'], [class*='search'], form")
      .count();

    if (filtersCount === 0) {
      console.log("Warning: Filters section not found (may be expected if no cars)");
    }
  });

  test("Login page", async ({ page }) => {
    await page.goto("/auth/login", { waitUntil: "networkidle" });

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test("Register page", async ({ page }) => {
    await page.goto("/auth/register", { waitUntil: "networkidle" });

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("Credits page", async ({ page }) => {
    await page.goto("/kredity", { waitUntil: "networkidle" });

    const title = await page.title();
    const normalizedTitle = normalizeText(title);

    expect(
      normalizedTitle.includes("kredit") ||
        normalizedTitle.includes("autobazar123"),
    ).toBe(true);

    const content = normalizeText(await page.content());
    expect(
      content.includes("eur") ||
        content.includes("kredit") ||
        content.includes("kr"),
    ).toBe(true);
  });

  test("Terms of Service", async ({ page }) => {
    await page.goto("/obchodne-podmienky", { waitUntil: "networkidle" });

    const heading = await page.locator("h1").first().textContent();
    const normalized = normalizeText(heading || "");

    expect(normalized.includes("obchodne")).toBe(true);
    expect(normalized.includes("podmienky")).toBe(true);
  });

  test("Privacy Policy", async ({ page }) => {
    await page.goto("/ochrana-udajov", { waitUntil: "networkidle" });

    const heading = await page.locator("h1").first().textContent();
    const normalized = normalizeText(heading || "");

    expect(normalized.includes("ochrana")).toBe(true);
    expect(normalized.includes("udajov")).toBe(true);
  });

  test("Navigation works", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const resultsLink = page.locator('a[href="/vysledky"]').first();

    if ((await resultsLink.count()) > 0) {
      await resultsLink.click();
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/vysledky/);
    }
  });

  test("Results page hydrates search query from URL params", async ({ page }) => {
    await page.goto("/vysledky?q=octavia&priceFrom=10000&yearFrom=2018", {
      waitUntil: "domcontentloaded",
    });

    const resultsSearchInput = page.locator("input[type='search']").first();
    await expect(resultsSearchInput).toHaveValue("octavia");
    await expect(page).toHaveURL(/\/vysledky\?q=octavia/);
  });

  test("Critical path: home search opens results, listing detail, and seller contact form", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const homeSearchInput = page.locator("#home-search-q");
    await expect(homeSearchInput).toBeVisible({ timeout: 10_000 });
    await homeSearchInput.fill("octavia");
    await expect(homeSearchInput).toHaveValue("octavia");
    await homeSearchInput.evaluate((input) => {
      const form = input.closest("form");
      if (!(form instanceof HTMLFormElement)) {
        throw new Error("Home search form not found");
      }
      form.requestSubmit();
    });

    await expect
      .poll(() => {
        try {
          return new URL(page.url()).pathname;
        } catch {
          return "";
        }
      }, { timeout: 12_000 })
      .toBe("/vysledky");

    const searchUnavailable = await page
      .getByText(/search is temporarily unavailable/i)
      .first()
      .isVisible()
      .catch(() => false);
    test.skip(searchUnavailable, "Algolia client is not configured in this environment.");

    const resultsSearchInput = page.locator("#search-results-query").first();
    await expect(resultsSearchInput).toBeVisible({ timeout: 12_000 });

    const detailLinks = page.locator("a[href^='/auto/']");
    await page.waitForTimeout(1_000);
    const detailLinkCount = await detailLinks.count();
    test.skip(detailLinkCount === 0, "No searchable listing links are available in this environment.");

    await detailLinks.first().click();
    await expect(page).toHaveURL(/\/auto\//, { timeout: 15_000 });

    const contactCard = page.locator("aside .card").first();
    await expect(contactCard).toBeVisible({ timeout: 10_000 });

    const toggleContactFormButton = contactCard
      .locator("button[type='button']")
      .first();
    await expect(toggleContactFormButton).toBeVisible({ timeout: 10_000 });
    await toggleContactFormButton.click();

    await expect(contactCard.locator("textarea")).toBeVisible({ timeout: 10_000 });
  });

  test("Critical path: auth entry and exit happy path", async ({ page }) => {
    test.skip(
      !HAS_E2E_AUTH_CREDS,
      "Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run auth happy-path guardrail.",
    );

    await loginWithPassword(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const userMenuButton = page
      .getByRole("button", { name: /user menu|pouzivatel|pouzi/i })
      .first();
    await expect(userMenuButton).toBeVisible({ timeout: 15_000 });
    await userMenuButton.click();

    const signOutButton = page
      .getByRole("button", { name: /sign out|logout|odhl/i })
      .first();
    await expect(signOutButton).toBeVisible({ timeout: 8_000 });
    await signOutButton.click();

    await page.goto("/moj-ucet", { waitUntil: "domcontentloaded" });

    const hasLoginField = await page
      .locator("#auth-login-email")
      .first()
      .isVisible()
      .catch(() => false);
    const hasLoginLink = await page
      .getByRole("link", { name: /login|prihl/i })
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasLoginField || hasLoginLink).toBe(true);
  });

  test("Search navigation stability", async ({ page }) => {
    test.setTimeout(180_000);

    const issues: Array<{ type: string; text: string }> = [];

    const onConsole = (msg: ConsoleMessage) => {
      const type = msg.type();
      if (type !== "error" && type !== "warning") return;
      issues.push({ type, text: msg.text() });
    };

    const onPageError = (err: Error) => {
      issues.push({ type: "pageerror", text: err.message });
    };

    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(20_000);

    page.on("console", onConsole);
    page.on("pageerror", onPageError);

    try {
      for (let i = 0; i < NAV_RACE_ITERATIONS; i++) {
        await page.goto("/vysledky", {
          waitUntil: "domcontentloaded",
          timeout: 20_000,
        });

        const homeLink = page
          .locator('a[aria-label="Autobazar123 - Domov"], nav a[href="/"], a[href="/"]')
          .first();

        await page
          .locator("input[type='search']")
          .first()
          .waitFor({ timeout: 10_000 });
        await homeLink
          .waitFor({ timeout: 10_000 });

        await page.evaluate(() => {
          const el = document.querySelector(
            "input[type='search']",
          ) as HTMLInputElement | null;
          if (!el) throw new Error("search input not found");

          el.focus();
          el.value = "hon";
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        });

        await homeLink.click();

        await waitForPath(page, "/", 10_000);
        await page.waitForTimeout(900);

        const url = new URL(page.url());
        expect(url.pathname).toBe("/");
      }
    } finally {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    }

    const IGNORE = [
      /Download the React DevTools/i,
      /\[Fast Refresh\]/i,
      /favicon\.ico/i,
      /InstantSearchNext relies on experimental APIs/i,
      /Largest Contentful Paint \(LCP\)/i,
    ];

    const realIssues = issues.filter(
      (issue) => !IGNORE.some((pattern) => pattern.test(issue.text)),
    );

    expect(realIssues, JSON.stringify(realIssues, null, 2)).toHaveLength(0);
  });

  test("Cookie banner", async ({ context, page }) => {
    await context.clearCookies();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });

    await page.waitForTimeout(1_500);

    const cookieBannerCount = await page
      .locator("[class*='cookie'], [class*='Cookie']")
      .count();

    console.log(
      `Cookie banner ${cookieBannerCount > 0 ? "found" : "not found (may be previously accepted)"}`,
    );
  });

  test("No console errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    const realErrors = errors.filter(
      (entry) =>
        !entry.includes("favicon") &&
        !entry.includes("404") &&
        !entry.includes("the server responded with a status of"),
    );

    expect(realErrors, realErrors.join(", ")).toHaveLength(0);
  });

  test("Performance", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "networkidle" });
    const loadTime = Date.now() - start;

    console.log(`Page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThanOrEqual(10_000);

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let resolved = false;

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (!resolved && lastEntry) {
            resolved = true;
            resolve(lastEntry.startTime);
          }
        });

        observer.observe({ type: "largest-contentful-paint", buffered: true });

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(0);
          }
        }, 5_000);
      });
    });

    console.log(`LCP: ${lcp.toFixed(0)}ms`);
  });
});
