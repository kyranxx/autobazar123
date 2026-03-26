import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/kontakt"] as const;

test.describe("Shared layout HTML", () => {
  test.describe.configure({ timeout: 120_000 });

  for (const route of ROUTES) {
    test(`${route} does not include Next.js CSR bailout markers in initial HTML`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.ok()).toBeTruthy();

      const html = await response!.text();

      expect(html).not.toContain("BAILOUT_TO_CLIENT_SIDE_RENDERING");
      expect(html).not.toContain("Bail out to client-side rendering: next/dynamic");
    });
  }
});
