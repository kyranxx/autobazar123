import { expect, test, type Page } from "@playwright/test";

type Market = {
  code: "SK" | "RO";
  origin: string;
  legacyOrigin: string;
  apexOrigin: string;
  searchPath: string;
  pricingPath: string;
  accountPath: string;
  termsPath: string;
  privacyPath: string;
  searchButton: RegExp;
};

const markets: Market[] = [
  {
    code: "SK",
    origin: "https://www.autoninja.sk",
    legacyOrigin: "https://www.autobazar123.sk",
    apexOrigin: "https://autoninja.sk",
    searchPath: "/vysledky",
    pricingPath: "/ceny",
    accountPath: "/moj-ucet",
    termsPath: "/obchodne-podmienky",
    privacyPath: "/ochrana-udajov",
    searchButton: /hľadať autá/i,
  },
  {
    code: "RO",
    origin: "https://www.autoninja.ro",
    legacyOrigin: "https://www.autobazar123.ro",
    apexOrigin: "https://autoninja.ro",
    searchPath: "/masini",
    pricingPath: "/preturi",
    accountPath: "/contul-meu",
    termsPath: "/termeni-si-conditii",
    privacyPath: "/politica-de-confidentialitate",
    searchButton: /caută mașini/i,
  },
];

async function collectUnexpectedRuntimeErrors(page: Page) {
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (
      /favicon|third-party cookie|ERR_BLOCKED_BY_CLIENT|Failed to load resource/i.test(
        text,
      )
    ) {
      return;
    }
    errors.push(`console: ${text}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    if (/favicon/i.test(response.url())) return;
    errors.push(`response ${response.status()}: ${response.url()}`);
  });

  return errors;
}

for (const market of markets) {
  test.describe(`${market.code} production`, () => {
    test("homepage has the correct market identity and working search", async ({
      page,
    }) => {
      const errors = await collectUnexpectedRuntimeErrors(page);
      await page.goto(market.origin, { waitUntil: "networkidle" });

      await expect(page).toHaveTitle(/AutoNinja/i);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/autobazar123/i);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`^${market.origin}/?$`),
      );

      const searchInput = page.locator("#home-search-q");
      await expect(searchInput).toBeVisible();
      await searchInput.fill("Toyota");
      await page.getByRole("button", { name: market.searchButton }).click();
      await expect(page).toHaveURL(
        new RegExp(`${market.searchPath.replace("/", "\\/")}\\?.*q=Toyota`),
      );
      expect(errors).toEqual([]);
    });

    test("results page settles instead of remaining on skeletons", async ({
      page,
    }) => {
      const errors = await collectUnexpectedRuntimeErrors(page);
      await page.goto(`${market.origin}${market.searchPath}`, {
        waitUntil: "domcontentloaded",
      });

      await expect(page.locator("#results-grid")).toBeVisible({ timeout: 20_000 });
      await expect
        .poll(
          async () =>
            page
              .locator("#results-grid [data-slot='skeleton'], #results-grid .animate-pulse")
              .count(),
          { timeout: 30_000 },
        )
        .toBe(0);
      await expect(page.locator("#results-grid")).toContainText(/\S/);
      expect(errors).toEqual([]);
    });

    test("core public and account routes render", async ({ page }) => {
      for (const path of [
        market.pricingPath,
        market.termsPath,
        market.privacyPath,
        market.accountPath,
      ]) {
        const response = await page.goto(`${market.origin}${path}`, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status(), `${market.code} ${path}`).toBeLessThan(400);
        await expect(page.locator("main").first()).toBeVisible();
        await expect(page.locator("body")).not.toContainText(/autobazar123/i);
      }
    });

    test("apex and retired domain preserve path and query", async ({
      request,
    }) => {
      for (const origin of [market.apexOrigin, market.legacyOrigin]) {
        const response = await request.get(
          `${origin}/test-path?utm_source=e2e`,
          { maxRedirects: 0 },
        );
        expect(response.status()).toBe(308);
        expect(response.headers().location).toBe(
          `${market.origin}/test-path?utm_source=e2e`,
        );
      }
    });
  });
}
