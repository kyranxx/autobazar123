import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  "/",
  "/vysledky",
  "/auth/login",
  "/auth/register",
  "/ceny",
  "/zmluva",
  "/kontakt",
] as const;

const LANDMARK_RULES = new Set([
  "landmark-one-main",
  "landmark-no-duplicate-banner",
  "landmark-no-duplicate-contentinfo",
  "region",
]);

const NAMING_RULES = new Set([
  "button-name",
  "link-name",
  "input-button-name",
  "select-name",
  "label",
  "form-field-multiple-labels",
  "aria-input-field-name",
  "aria-toggle-field-name",
]);

type AxeViolation = {
  id: string;
  impact?: string | null;
  nodes: Array<{ target: string[]; failureSummary?: string }>;
};

function summarizeViolations(violations: AxeViolation[]): string {
  return JSON.stringify(
    violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? null,
      targets: violation.nodes.map((node) => node.target.join(" ")).slice(0, 5),
      sampleFailure: violation.nodes[0]?.failureSummary ?? "",
    })),
    null,
    2,
  );
}

async function runAxe(page: Page): Promise<AxeViolation[]> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return results.violations as AxeViolation[];
}

test.describe("Screen-reader proxy baseline", () => {
  for (const route of ROUTES) {
    test(`${route} keeps landmark semantics screen-reader friendly`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(700);

      const violations = await runAxe(page);
      const landmarkViolations = violations.filter((violation) => LANDMARK_RULES.has(violation.id));

      expect(
        landmarkViolations,
        `Landmark SR-proxy violations on ${route}:\n${summarizeViolations(landmarkViolations)}`,
      ).toEqual([]);
    });

    test(`${route} keeps control naming screen-reader friendly`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(700);

      const violations = await runAxe(page);
      const namingViolations = violations.filter((violation) => NAMING_RULES.has(violation.id));

      expect(
        namingViolations,
        `Control-naming SR-proxy violations on ${route}:\n${summarizeViolations(namingViolations)}`,
      ).toEqual([]);
    });
  }
});
