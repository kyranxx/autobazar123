import { expect, test, type Page } from "@playwright/test";

async function expectLoginRedirect(
  page: Page,
  expectedRedirectPath: string,
): Promise<void> {
  await expect(page).toHaveURL(/\/auth\/login/);

  const currentUrl = new URL(page.url());
  expect(currentUrl.pathname).toBe("/auth/login");
  expect(currentUrl.searchParams.get("redirect")).toBe(expectedRedirectPath);

  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
}

test.describe("Journey-level core flows", () => {
  test("results search flow updates URL state for filter interactions", async ({
    page,
  }) => {
    await page.goto("/vysledky", { waitUntil: "domcontentloaded" });

    const resultsSearchInput = page.locator("input[type='search']").first();
    await expect(resultsSearchInput).toBeVisible();
    await resultsSearchInput.fill("octavia");
    await expect(resultsSearchInput).toHaveValue("octavia");

    const quickPrice10kButton = page
      .locator("aside button")
      .filter({ hasText: /10k/i })
      .first();
    await expect(quickPrice10kButton).toBeVisible();
    await quickPrice10kButton.click();

    await expect.poll(() => new URL(page.url()).searchParams.get("priceTo")).toBe(
      "10000",
    );

    const firstBrandCheckbox = page.locator("aside").getByRole("checkbox").first();
    await expect(firstBrandCheckbox).toBeVisible();
    await firstBrandCheckbox.click();

    await expect
      .poll(() => new URL(page.url()).searchParams.getAll("brand").length)
      .toBeGreaterThan(0);

    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe("/vysledky");
    expect(currentUrl.searchParams.get("priceTo")).toBe("10000");
  });

  test("credits checkout entry redirects guests to login with redirect target", async ({
    page,
  }) => {
    await page.goto("/kredity", { waitUntil: "domcontentloaded" });

    const buyButton = page
      .locator("main button")
      .filter({ hasText: /k.{0,3}pi/i })
      .first();
    await expect(buyButton).toBeVisible();
    await buyButton.click();

    await expectLoginRedirect(page, "/kredity");
  });

  test("publish route blocks guests and preserves redirect target", async ({ page }) => {
    await page.goto("/pridat-inzerat", { waitUntil: "domcontentloaded" });
    await expectLoginRedirect(page, "/pridat-inzerat");
  });

  test("edit route blocks guests and preserves redirect target", async ({ page }) => {
    await page.goto("/upravit-inzerat/e2e-smoke-id", {
      waitUntil: "domcontentloaded",
    });

    const currentUrl = new URL(page.url());
    if (currentUrl.pathname === "/auth/login") {
      await expectLoginRedirect(page, "/upravit-inzerat/e2e-smoke-id");
      return;
    }

    expect(currentUrl.pathname).toBe("/upravit-inzerat/e2e-smoke-id");
    await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible();
    await expect(page.locator('a[href="/auth/register"]').first()).toBeVisible();
  });

  test("dashboard ads route keeps key actions protected for guests", async ({ page }) => {
    await page.goto("/moj-ucet?tab=ads", { waitUntil: "domcontentloaded" });
    await expectLoginRedirect(page, "/moj-ucet");

    await expect(
      page.getByRole("button", { name: /mark as sold|oznacit ako predane/i }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /boost|topovat/i })).toHaveCount(0);
  });
});
