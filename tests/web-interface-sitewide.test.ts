import fs from "node:fs/promises";
import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  findImagesMissingAlt,
  findUnlabeledControls,
  getRoutesFromHomepageLinks,
  getRoutesFromSitemap,
} from "./web-interface-test-helpers";

const BASE_URL =
  process.env.AUDIT_BASE_URL || process.env.TEST_URL || "http://localhost:3000";
const MAX_ROUTES = Number(process.env.WEB_INTERFACE_MAX_ROUTES || 40);
const INCLUDE_DISCOVERED_ROUTES =
  process.env.WEB_INTERFACE_INCLUDE_DISCOVERED_ROUTES === "true";
const MAX_DISCOVERED_ROUTES = Number(
  process.env.WEB_INTERFACE_MAX_DISCOVERED_ROUTES || 20,
);
const WAIT_AFTER_NAV_MS = Number(process.env.WEB_INTERFACE_WAIT_MS || 500);
const NAVIGATION_TIMEOUT_MS = Number(
  process.env.WEB_INTERFACE_NAVIGATION_TIMEOUT_MS || 120_000,
);
const SEMANTIC_WAIT_MS = Number(
  process.env.WEB_INTERFACE_SEMANTIC_WAIT_MS || 30_000,
);

const CORE_ROUTES = [
  "/",
  "/vysledky",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/ceny",
  "/platba/uspech",
  "/predajcovia",
  "/pridat-inzerat",
  "/kalkulacka-leasingu",
  "/kontakt",
  "/o-nas",
  "/obchodne-podmienky",
  "/ochrana-udajov",
  "/cookies",
  "/zmluva",
] as const;

const SEARCH_VARIANT_ROUTES = [
  "/vysledky?bodyType=SUV&priceTo=35000",
  "/vysledky?transmission=automatic",
  "/vysledky?mileageTo=100000",
  "/vysledky?fuel=hybrid",
  "/vysledky?priceTo=12000",
  "/vysledky?drivetrain=4x4",
] as const;

interface RouteFailure {
  route: string;
  check: "main" | "h1" | "controls" | "images";
  details: unknown;
}

function shouldSkipDiscoveredRoute(route: string): boolean {
  if (route.startsWith("/auto/")) return true;

  // Skip deep dynamic paths by default (brand/model/city/dealer inventories can explode).
  const pathnameOnly = route.split("?")[0] || route;
  const segments = pathnameOnly.split("/").filter(Boolean);
  if (segments.length >= 3) return true;

  return false;
}

async function collectRoutes(browser: Browser): Promise<string[]> {
  const baseRoutes = [...CORE_ROUTES, ...SEARCH_VARIANT_ROUTES];

  if (!INCLUDE_DISCOVERED_ROUTES) {
    return [...new Set(baseRoutes)].slice(0, MAX_ROUTES);
  }

  const [sitemapRoutes, homepageRoutes] = await Promise.all([
    getRoutesFromSitemap(BASE_URL),
    getRoutesFromHomepageLinks(BASE_URL, browser),
  ]);

  const discoveredRoutes = [...new Set([...sitemapRoutes, ...homepageRoutes])]
    .filter((route) => route.startsWith("/"))
    .filter((route) => !shouldSkipDiscoveredRoute(route))
    .slice(0, MAX_DISCOVERED_ROUTES);

  return [...new Set([...baseRoutes, ...discoveredRoutes])]
    .filter((route) => route.startsWith("/"))
    .slice(0, MAX_ROUTES);
}

async function writeReport(routes: string[], failures: RouteFailure[]) {
  const outputDir = path.join(process.cwd(), "output", "playwright");
  const outputPath = path.join(outputDir, "web-interface-sitewide.json");
  await fs.mkdir(outputDir, { recursive: true });

  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        maxRoutes: MAX_ROUTES,
        routesChecked: routes.length,
        failuresCount: failures.length,
        failures,
      },
      null,
      2,
    ),
    "utf8",
  );

  return outputPath;
}

async function waitForSelectorCount(
  page: Page,
  selector: string,
  minCount: number,
  timeoutMs = 10_000,
): Promise<number> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const count = await page.locator(selector).count();
    if (count >= minCount) return count;
    await page.waitForTimeout(250);
  }

  return page.locator(selector).count();
}

test("site-wide web interface guidelines", async ({ browser, page }) => {
  test.setTimeout(30 * 60 * 1000);

  const routes = await collectRoutes(browser);
  const failures: RouteFailure[] = [];

  for (const route of routes) {
    await page.goto(route, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await page.waitForTimeout(WAIT_AFTER_NAV_MS);

    const mainCount = await waitForSelectorCount(page, "main", 1, SEMANTIC_WAIT_MS);
    if (mainCount === 0) {
      failures.push({
        route,
        check: "main",
        details: "Missing <main> landmark",
      });
    }

    const h1Count = await waitForSelectorCount(page, "h1", 1, SEMANTIC_WAIT_MS);
    if (h1Count === 0) {
      failures.push({
        route,
        check: "h1",
        details: "Missing <h1> heading",
      });
    }

    const unlabeledControls = await findUnlabeledControls(page);
    if (unlabeledControls.length > 0) {
      failures.push({
        route,
        check: "controls",
        details: unlabeledControls,
      });
    }

    const imagesMissingAlt = await findImagesMissingAlt(page);
    if (imagesMissingAlt.length > 0) {
      failures.push({
        route,
        check: "images",
        details: imagesMissingAlt,
      });
    }

    console.log(
      `[web-interface-sitewide] ${route} main=${mainCount} h1=${h1Count} unlabeledControls=${unlabeledControls.length} imagesMissingAlt=${imagesMissingAlt.length}`,
    );
  }

  const reportPath = await writeReport(routes, failures);
  console.log(`[web-interface-sitewide] report: ${reportPath}`);

  expect(routes.length).toBeGreaterThan(0);
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
});
