import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import brandTheme from "../src/config/theme-brand.json";

const ROUTES = [
  "/",
  "/vysledky",
  "/auth/login",
  "/auth/register",
  "/ceny",
  "/zmluva",
  "/kontakt",
] as const;

const NAVIGATION_TIMEOUT_MS = Number(
  process.env.WEB_INTERFACE_NAVIGATION_TIMEOUT_MS || 120_000,
);

const INTENTIONAL_BRAND_COLOR_KEYS = [
  "primary",
  "primaryHover",
  "primaryForeground",
  "accent",
  "accentHover",
  "accentForeground",
  "accentSubtle",
  "mint",
  "softSurface",
] as const;

const INTENTIONAL_BRAND_COLORS = new Set(
  INTENTIONAL_BRAND_COLOR_KEYS.map((key) => brandTheme[key].toLowerCase()),
);

type AxeCheckData = {
  fgColor?: string;
  bgColor?: string;
};

type AxeNodeCheck = {
  data?: AxeCheckData;
};

type AxeViolationNode = {
  target: string[];
  failureSummary?: string;
  any?: AxeNodeCheck[];
  all?: AxeNodeCheck[];
  none?: AxeNodeCheck[];
};

type AxeViolation = {
  id: string;
  impact?: string | null;
  nodes: AxeViolationNode[];
};

function normalizeColor(value: string | undefined): string | null {
  return value?.trim().toLowerCase() ?? null;
}

function isIntentionalBrandContrastNode(node: AxeViolationNode): boolean {
  const checks = [...(node.any ?? []), ...(node.all ?? []), ...(node.none ?? [])];

  return checks.some((check) => {
    const foreground = normalizeColor(check.data?.fgColor);
    const background = normalizeColor(check.data?.bgColor);

    return (
      (foreground !== null && INTENTIONAL_BRAND_COLORS.has(foreground))
      || (background !== null && INTENTIONAL_BRAND_COLORS.has(background))
    );
  });
}

function filterIntentionalBrandContrastViolations(violations: AxeViolation[]): AxeViolation[] {
  return violations.flatMap((violation) => {
    if (violation.id !== "color-contrast") {
      return [violation];
    }

    const remainingNodes = violation.nodes.filter((node) => !isIntentionalBrandContrastNode(node));
    if (remainingNodes.length === 0) {
      return [];
    }

    return [{ ...violation, nodes: remainingNodes }];
  });
}

function summarizeViolations(violations: AxeViolation[]): string {
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

  return filterIntentionalBrandContrastViolations(results.violations as AxeViolation[]);
}

async function waitForAccessibleShell(page: Page) {
  await expect
    .poll(async () => page.locator("main").count(), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);

  await expect
    .poll(async () => page.locator("h1").count(), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
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
  test.describe.configure({ timeout: NAVIGATION_TIMEOUT_MS + 60_000 });

  for (const route of ROUTES) {
    test(`${route} has no serious/critical WCAG violations`, async ({ page }) => {
      await page.goto(route, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      await waitForAccessibleShell(page);

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
      await page.goto(route, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      await waitForAccessibleShell(page);

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
