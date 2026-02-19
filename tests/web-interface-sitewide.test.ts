import fs from "node:fs/promises";
import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";

const BASE_URL =
  process.env.AUDIT_BASE_URL || process.env.TEST_URL || "http://localhost:3000";
const MAX_ROUTES = Number(process.env.WEB_INTERFACE_MAX_ROUTES || 120);
const WAIT_AFTER_NAV_MS = Number(process.env.WEB_INTERFACE_WAIT_MS || 500);

const CORE_ROUTES = [
  "/",
  "/vysledky",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/kredity",
  "/kredity/uspech",
  "/predajcovia",
  "/pridat-inzerat",
  "/kalkulacka-leasingu",
  "/kontakt",
  "/o-nas",
  "/obchodne-podmienky",
  "/ochrana-udajov",
  "/cookies",
] as const;

interface RouteFailure {
  route: string;
  check: "main" | "h1" | "controls" | "images";
  details: unknown;
}

function normalizePath(input: string): string | null {
  try {
    const base = new URL(BASE_URL);
    const url = new URL(input, BASE_URL);

    if (url.origin !== base.origin) return null;

    const cleaned = `${url.pathname}${url.search}`;
    if (!cleaned.startsWith("/")) return null;
    if (cleaned.startsWith("/_next") || cleaned.startsWith("/api/")) return null;
    if (cleaned === "") return "/";

    return cleaned.endsWith("/") && cleaned !== "/"
      ? cleaned.slice(0, -1)
      : cleaned;
  } catch {
    return null;
  }
}

async function getRoutesFromSitemap(): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/sitemap.xml`);
    if (!response.ok) return [];

    const xml = await response.text();
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(
      (match) => match[1],
    );

    return matches
      .map((loc) => normalizePath(loc))
      .filter((route): route is string => !!route);
  } catch {
    return [];
  }
}

async function getRoutesFromHomepageLinks(browser: Browser): Promise<string[]> {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]"))
        .map((anchor) => anchor.getAttribute("href") || "")
        .filter(Boolean),
    );

    return links
      .map((href) => normalizePath(href))
      .filter((route): route is string => !!route);
  } catch {
    return [];
  } finally {
    await context.close();
  }
}

async function collectRoutes(browser: Browser): Promise<string[]> {
  const [sitemapRoutes, homepageRoutes] = await Promise.all([
    getRoutesFromSitemap(),
    getRoutesFromHomepageLinks(browser),
  ]);

  return [...new Set([...CORE_ROUTES, ...sitemapRoutes, ...homepageRoutes])]
    .filter((route) => route.startsWith("/"))
    .slice(0, MAX_ROUTES);
}

async function findUnlabeledControls(page: Page) {
  return page.locator("button, input, select, textarea").evaluateAll((elements) => {
    const getLabelText = (element: Element): string => {
      const ariaLabel = element.getAttribute("aria-label")?.trim() || "";
      if (ariaLabel) return ariaLabel;

      const labelledBy = element.getAttribute("aria-labelledby")?.trim() || "";
      if (labelledBy) {
        return labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() || "")
          .join(" ")
          .trim();
      }

      const id = element.getAttribute("id");
      if (id) {
        const directLabel = document.querySelector(`label[for="${id}"]`);
        if (directLabel?.textContent?.trim()) {
          return directLabel.textContent.trim();
        }
      }

      const wrappedLabel = element.closest("label");
      if (wrappedLabel?.textContent?.trim()) {
        return wrappedLabel.textContent.trim();
      }

      const placeholder = (element as HTMLInputElement).placeholder?.trim() || "";
      if (placeholder) return placeholder;

      return element.textContent?.trim() || "";
    };

    return elements
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.offsetParent === null) return false;
        if (element instanceof HTMLInputElement && element.type === "hidden") {
          return false;
        }
        return true;
      })
      .map((element) => {
        const label = getLabelText(element);
        return {
          tag: element.tagName.toLowerCase(),
          type: (element as HTMLInputElement).type || "",
          id: element.getAttribute("id") || "",
          className: element.getAttribute("class") || "",
          label,
        };
      })
      .filter((entry) => entry.label.length === 0)
      .slice(0, 20);
  });
}

async function findImagesMissingAlt(page: Page) {
  return page.locator("img").evaluateAll((images) =>
    images
      .filter((img) => {
        const alt = img.getAttribute("alt");
        return alt === null || alt.trim().length === 0;
      })
      .map((img) => ({
        src: img.getAttribute("src") || "unknown",
        className: img.getAttribute("class") || "",
      }))
      .slice(0, 20),
  );
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
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(WAIT_AFTER_NAV_MS);

    const mainCount = await waitForSelectorCount(page, "main", 1);
    if (mainCount === 0) {
      failures.push({
        route,
        check: "main",
        details: "Missing <main> landmark",
      });
    }

    const h1Count = await waitForSelectorCount(page, "h1", 1);
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
