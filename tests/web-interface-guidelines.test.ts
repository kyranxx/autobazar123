import { expect, test } from "@playwright/test";
import {
  findImagesMissingAlt,
  findUnlabeledControls,
} from "./web-interface-test-helpers";

const ROUTES = ["/", "/vysledky", "/auth/login", "/auth/register", "/ceny"];

test.describe("Web interface guidelines", () => {
  for (const route of ROUTES) {
    test(`${route} keeps semantic and accessibility baseline`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      await expect
        .poll(async () => page.locator("main").count(), {
          timeout: 10_000,
        })
        .toBeGreaterThan(0);

      await expect
        .poll(async () => page.locator("h1").count(), {
          timeout: 10_000,
        })
        .toBeGreaterThan(0);

      const unlabeledControls = (await findUnlabeledControls(page)).slice(0, 10).map((entry) => ({
        tag: entry.tag,
        type: entry.type,
        id: entry.id,
        label: entry.label,
      }));

      expect(unlabeledControls, JSON.stringify(unlabeledControls, null, 2)).toEqual([]);

      const imagesMissingAlt = (await findImagesMissingAlt(page))
        .slice(0, 10)
        .map((img) => img.src);

      expect(imagesMissingAlt, JSON.stringify(imagesMissingAlt, null, 2)).toEqual([]);
    });
  }
});
