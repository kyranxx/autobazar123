import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  "/",
  "/vysledky",
  "/auth/login",
  "/auth/register",
  "/kredity",
  "/zmluva",
  "/kontakt",
] as const;

async function findReflowIssues(page: Page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const issues: Array<{ tag: string; className: string; width: number }> = [];

    const allElements = Array.from(document.querySelectorAll("*"));

    for (const element of allElements) {
      if (
        element.classList.contains("leaflet-tile") ||
        !!element.closest(".leaflet-container")
      ) {
        continue;
      }

      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") {
        continue;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }

      if (rect.width > viewportWidth + 2) {
        issues.push({
          tag: element.tagName.toLowerCase(),
          className: String(element.className || "").slice(0, 80),
          width: Math.round(rect.width),
        });
      }

      if (issues.length >= 10) {
        break;
      }
    }

    const hasHorizontalScroll =
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;

    return {
      viewportWidth,
      hasHorizontalScroll,
      issues,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}

test.describe("Reflow and zoom readiness", () => {
  for (const route of ROUTES) {
    test(`${route} reflows at 320px without horizontal scrolling`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(700);

      const details = await findReflowIssues(page);

      expect(
        details.hasHorizontalScroll,
        `${route} has horizontal scrolling at 320px (scrollWidth=${details.scrollWidth}, clientWidth=${details.clientWidth}). Issues: ${JSON.stringify(details.issues)}`,
      ).toBe(false);

      expect(
        details.issues,
        `${route} has elements wider than the viewport at 320px: ${JSON.stringify(details.issues)}`,
      ).toEqual([]);
    });
  }
});
