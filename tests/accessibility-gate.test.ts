import AxeBuilder from "@axe-core/playwright";
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

function summarizeViolations(
  violations: Array<{
    id: string;
    impact?: string | null;
    nodes: Array<{ target: string[]; failureSummary?: string }>;
  }>,
): string {
  return JSON.stringify(
    violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target.join(" ")).slice(0, 5),
      sampleFailure: violation.nodes[0]?.failureSummary ?? "",
    })),
    null,
    2,
  );
}

async function getAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return results.violations;
}

async function collectLandmarkSummary(page: Page) {
  const mainCount = await page.getByRole("main").count();
  const navigationCount = await page.getByRole("navigation").count();
  const mobileMenuTriggerCount = await page
    .locator('button[aria-controls="mobile-nav-dialog"]')
    .count();
  const levelOneHeadingCount = await page.getByRole("heading", { level: 1 }).count();
  return { mainCount, navigationCount, mobileMenuTriggerCount, levelOneHeadingCount };
}

test.describe("Accessibility gate", () => {
  for (const route of ROUTES) {
    test(`${route} has no serious/critical WCAG violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(700);

      const violations = await getAxeViolations(page);
      const seriousOrCritical = violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      );

      expect(
        seriousOrCritical,
        `Serious accessibility violations on ${route}:\n${summarizeViolations(seriousOrCritical)}`,
      ).toEqual([]);

      const contrastViolations = violations.filter((violation) => violation.id === "color-contrast");
      expect(
        contrastViolations,
        `Color contrast violations on ${route}:\n${summarizeViolations(contrastViolations)}`,
      ).toEqual([]);
    });

    test(`${route} exposes key semantic landmarks`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(700);

      const landmarks = await collectLandmarkSummary(page);

      expect(landmarks.mainCount, `Missing main landmark for ${route}`).toBeGreaterThan(0);
      expect(
        landmarks.navigationCount + landmarks.mobileMenuTriggerCount,
        `Missing navigation landmark or mobile menu trigger for ${route}`,
      ).toBeGreaterThan(0);
      expect(landmarks.levelOneHeadingCount, `Missing level-1 heading for ${route}`).toBeGreaterThan(0);
    });
  }
});
