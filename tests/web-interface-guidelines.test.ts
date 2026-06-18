import { expect, test } from "@playwright/test";
import {
  findImagesMissingAlt,
  findUnlabeledControls,
} from "./web-interface-test-helpers";

const ROUTES = ["/", "/vysledky", "/auth/login", "/auth/register", "/ceny"];
const NAVIGATION_TIMEOUT_MS = Number(
  process.env.WEB_INTERFACE_NAVIGATION_TIMEOUT_MS || 120_000,
);
const SEMANTIC_WAIT_MS = Number(
  process.env.WEB_INTERFACE_SEMANTIC_WAIT_MS || 30_000,
);

test.describe("Web interface guidelines", () => {
  for (const route of ROUTES) {
    test(`${route} keeps semantic and accessibility baseline`, async ({ page }) => {
      test.setTimeout(NAVIGATION_TIMEOUT_MS + SEMANTIC_WAIT_MS + 15_000);
      await page.goto(route, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      await page.waitForTimeout(600);

      await expect
        .poll(async () => page.locator("main").count(), {
          timeout: SEMANTIC_WAIT_MS,
        })
        .toBeGreaterThan(0);

      await expect
        .poll(async () => page.locator("h1").count(), {
          timeout: SEMANTIC_WAIT_MS,
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
