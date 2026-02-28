import fs from "node:fs/promises";
import path from "node:path";
import {
  expect,
  test,
  type Browser,
  type ConsoleMessage,
  type Page,
  type Response,
} from "@playwright/test";

test.setTimeout(30 * 60 * 1000);

const BASE_URL =
  process.env.AUDIT_BASE_URL || process.env.TEST_URL || "http://localhost:3000";
const MAX_ROUTES = Number(process.env.AUDIT_MAX_ROUTES || 40);

const CORE_ROUTES = [
  "/",
  "/vysledky",
  "/kredity",
  "/kredity/uspech",
  "/moj-ucet",
  "/moje-inzeraty",
  "/nastavenia",
  "/admin",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/ceny",
  "/predajcovia",
  "/dealer",
  "/pridat-inzerat",
  "/kalkulacka-leasingu",
  "/kontakt",
  "/o-nas",
  "/cookies",
  "/obchodne-podmienky",
  "/ochrana-udajov",
  "/spravy",
  "/maintenance",
  "/ulozene",
] as const;

const VIEWPORTS = [
  {
    name: "desktop",
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: "mobile",
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
] as const;

const IGNORE_CONSOLE_PATTERNS = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/,
  /favicon\.ico/i,
  /A parser-blocking, cross site .* is invoked via document.write/i,
  /InstantSearchNext relies on experimental APIs/i,
];

const IGNORE_NETWORK_PATTERNS = [
  /accounts\.google\.com\/ExpireGapsSession/i,
  /nextjs_original-stack-frames/i,
  /_next\/image\?url=.*&w=/i,
];

const IGNORE_ISSUE_PATTERNS = [/CookieIssue/i];

interface ConsoleEntry {
  type: string;
  text: string;
  location?: string;
}

interface NetworkFailure {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  error?: string;
}

interface DevtoolsIssue {
  code: string;
  summary: string;
}

interface PerfSnapshot {
  domContentLoadedMs: number | null;
  loadEventMs: number | null;
  firstPaintMs: number | null;
  firstContentfulPaintMs: number | null;
  mainThreadWorkMs: number | null;
  transferSizeBytes: number | null;
  decodedBodySizeBytes: number | null;
  jsTransferSizeBytes: number;
  jsDecodedBodySizeBytes: number;
  resourceCount: number;
}

interface RouteAuditResult {
  route: string;
  viewport: string;
  requestedUrl: string;
  finalUrl: string;
  status: number | null;
  navDurationMs: number;
  title: string;
  consoleErrors: ConsoleEntry[];
  pageErrors: string[];
  networkFailures: NetworkFailure[];
  devtoolsIssues: DevtoolsIssue[];
  perf: PerfSnapshot;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isExecutionContextDestroyedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /Execution context was destroyed/i.test(message) ||
    /Cannot find context with specified id/i.test(message) ||
    /Frame was detached/i.test(message)
  );
}

const EMPTY_PERF_SNAPSHOT: PerfSnapshot = {
  domContentLoadedMs: null,
  loadEventMs: null,
  firstPaintMs: null,
  firstContentfulPaintMs: null,
  mainThreadWorkMs: null,
  transferSizeBytes: null,
  decodedBodySizeBytes: null,
  jsTransferSizeBytes: 0,
  jsDecodedBodySizeBytes: 0,
  resourceCount: 0,
};

function shouldIgnoreMessage(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeConsoleMessage(msg: ConsoleMessage): ConsoleEntry {
  const location = msg.location();
  return {
    type: msg.type(),
    text: msg.text(),
    location:
      location?.url && typeof location.lineNumber === "number"
        ? `${location.url}:${location.lineNumber}`
        : undefined,
  };
}

function normalizePath(input: string): string | null {
  try {
    const base = new URL(BASE_URL);
    const url = new URL(input, BASE_URL);
    if (url.origin !== base.origin) return null;

    const cleaned = `${url.pathname}${url.search}`;
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

async function getPerfSnapshot(page: Page): Promise<PerfSnapshot> {
  return page.evaluate(() => {
    const navEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const paintEntries = performance.getEntriesByType("paint");
    const firstPaint =
      paintEntries.find((entry) => entry.name === "first-paint")?.startTime ??
      null;
    const firstContentfulPaint =
      paintEntries.find((entry) => entry.name === "first-contentful-paint")
        ?.startTime ?? null;
    const resourceEntries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const scriptEntries = resourceEntries.filter((entry) => {
      if (entry.initiatorType === "script") return true;
      return /\.js(\?|$)/i.test(entry.name);
    });

    const jsTransferSizeBytes = scriptEntries.reduce(
      (sum, entry) => sum + (entry.transferSize || 0),
      0,
    );
    const jsDecodedBodySizeBytes = scriptEntries.reduce(
      (sum, entry) => sum + (entry.decodedBodySize || 0),
      0,
    );

    const mainThreadWorkMs =
      navEntry && Number.isFinite(navEntry.domInteractive) && Number.isFinite(navEntry.responseEnd)
        ? Math.max(0, Math.round(navEntry.domInteractive - navEntry.responseEnd))
        : null;

    return {
      domContentLoadedMs: navEntry
        ? Math.round(navEntry.domContentLoadedEventEnd)
        : null,
      loadEventMs: navEntry ? Math.round(navEntry.loadEventEnd) : null,
      firstPaintMs: firstPaint !== null ? Math.round(firstPaint) : null,
      firstContentfulPaintMs:
        firstContentfulPaint !== null ? Math.round(firstContentfulPaint) : null,
      mainThreadWorkMs,
      transferSizeBytes: navEntry?.transferSize ?? null,
      decodedBodySizeBytes: navEntry?.decodedBodySize ?? null,
      jsTransferSizeBytes,
      jsDecodedBodySizeBytes,
      resourceCount: resourceEntries.length,
    };
  });
}

async function waitForUrlStability(
  page: Page,
  stableForMs = 250,
  timeoutMs = 5_000,
) {
  const startedAt = Date.now();
  let lastUrl = page.url();
  let lastChangeAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const currentUrl = page.url();
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      lastChangeAt = Date.now();
    }

    if (Date.now() - lastChangeAt >= stableForMs) {
      return;
    }

    await delay(75);
  }
}

async function readPageTitleSafely(page: Page): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 2_000 });
      return await page.title();
    } catch (error) {
      if (!isExecutionContextDestroyedError(error)) {
        throw error;
      }
      await delay(150 * (attempt + 1));
    }
  }

  return "";
}

async function readPerfSnapshotSafely(page: Page): Promise<PerfSnapshot> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 2_000 });
      return await getPerfSnapshot(page);
    } catch (error) {
      if (!isExecutionContextDestroyedError(error)) {
        throw error;
      }
      await delay(150 * (attempt + 1));
    }
  }

  return EMPTY_PERF_SNAPSHOT;
}

async function runRouteInteractions(page: Page, route: string): Promise<void> {
  if (route.startsWith("/vysledky")) {
    const searchInput =
      (await page.$(
        'input[placeholder*="hlada" i], input[type="search"]',
      )) || (await page.$("input"));

    if (searchInput) {
      await searchInput.click({ clickCount: 3 });
      await searchInput.type("hon", { delay: 30 });
      await delay(700);
    }
  }

  await waitForUrlStability(page);
  try {
    await page.evaluate(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "instant" as ScrollBehavior,
      });
    });
  } catch (error) {
    if (!isExecutionContextDestroyedError(error)) {
      throw error;
    }
  }
  await delay(200);
}

async function auditRoute(
  page: Page,
  route: string,
  viewportName: string,
): Promise<RouteAuditResult> {
  const requestedUrl = `${BASE_URL}${route}`;
  const consoleErrors: ConsoleEntry[] = [];
  const pageErrors: string[] = [];
  const networkFailures: NetworkFailure[] = [];
  const devtoolsIssues: DevtoolsIssue[] = [];
  const seenIssues = new Set<string>();

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Audits.enable");

  cdp.on("Audits.issueAdded", (event: { issue?: { code?: string; details?: unknown } }) => {
    const code = event.issue?.code || "UnknownIssue";
    const details = event.issue?.details;
    const summary = details ? JSON.stringify(details).slice(0, 300) : "";
    const key = `${code}:${summary}`;

    if (seenIssues.has(key)) return;
    seenIssues.add(key);

    if (shouldIgnoreMessage(code, IGNORE_ISSUE_PATTERNS)) return;
    if (summary && shouldIgnoreMessage(summary, IGNORE_ISSUE_PATTERNS)) return;

    devtoolsIssues.push({ code, summary });
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error" && msg.type() !== "warning") {
      return;
    }

    const entry = normalizeConsoleMessage(msg);
    if (!shouldIgnoreMessage(entry.text, IGNORE_CONSOLE_PATTERNS)) {
      consoleErrors.push(entry);
    }
  });

  page.on("pageerror", (err) => {
    const message = err instanceof Error ? err.message : String(err);
    if (!shouldIgnoreMessage(message, IGNORE_CONSOLE_PATTERNS)) {
      pageErrors.push(message);
    }
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    if (shouldIgnoreMessage(url, IGNORE_NETWORK_PATTERNS)) return;

    const failureText = request.failure()?.errorText;
    if (failureText === "net::ERR_ABORTED") return;

    networkFailures.push({
      url,
      method: request.method(),
      error: failureText,
    });
  });

  page.on("response", async (response: Response) => {
    const status = response.status();
    if (status < 400) return;

    const url = response.url();
    if (shouldIgnoreMessage(url, IGNORE_NETWORK_PATTERNS)) return;

    networkFailures.push({
      url,
      method: response.request().method(),
      status,
      statusText: response.statusText(),
    });
  });

  const start = Date.now();
  let status: number | null = null;

  try {
    const response = await page.goto(requestedUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    status = response?.status() ?? null;
    await runRouteInteractions(page, route);
  } catch (error) {
    pageErrors.push(
      error instanceof Error ? `Navigation failed: ${error.message}` : "Navigation failed",
    );
  }

  const navDurationMs = Date.now() - start;
  await delay(350);

  const title = await readPageTitleSafely(page);
  const perf = await readPerfSnapshotSafely(page);

  return {
    route,
    viewport: viewportName,
    requestedUrl,
    finalUrl: page.url(),
    status,
    navDurationMs,
    title,
    consoleErrors,
    pageErrors,
    networkFailures,
    devtoolsIssues,
    perf,
  };
}

async function runAudit(browser: Browser) {
  const startedAt = new Date().toISOString();
  const results: RouteAuditResult[] = [];
  const routes = await collectRoutes(browser);

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
    });

    try {
      for (const route of routes) {
        const page = await context.newPage();

        const result = await auditRoute(page, route, viewport.name);
        results.push(result);

        const issueCount =
          result.consoleErrors.length +
          result.pageErrors.length +
          result.networkFailures.length +
          result.devtoolsIssues.length;

        console.log(
          `${viewport.name.toUpperCase()} ${route} -> status=${result.status ?? "n/a"} nav=${result.navDurationMs}ms issues=${issueCount}`,
        );

        await page.close();
      }
    } finally {
      await context.close();
    }
  }

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routeCount: results.length,
    failingRoutes: results.filter((result) => {
      const hasStatusError = typeof result.status === "number" && result.status >= 400;
      return (
        hasStatusError ||
        result.consoleErrors.length > 0 ||
        result.pageErrors.length > 0 ||
        result.networkFailures.length > 0 ||
        result.devtoolsIssues.length > 0
      );
    }).length,
    totalConsoleWarningsAndErrors: results.reduce(
      (sum, result) => sum + result.consoleErrors.length,
      0,
    ),
    totalNetworkFailures: results.reduce(
      (sum, result) => sum + result.networkFailures.length,
      0,
    ),
    totalDevtoolsIssues: results.reduce(
      (sum, result) => sum + result.devtoolsIssues.length,
      0,
    ),
    avgNavDurationMs:
      Math.round(
        results.reduce((sum, result) => sum + result.navDurationMs, 0) /
          Math.max(results.length, 1),
      ) || 0,
  };

  const outputDir = path.join(process.cwd(), "output", "playwright");
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "webapp-audit.json");
  await fs.writeFile(outputPath, JSON.stringify({ summary, results }, null, 2), "utf8");

  console.log(`\nAudit report written to ${outputPath}`);
  console.log(`Failing routes: ${summary.failingRoutes}/${summary.routeCount}`);
  console.log(`Total DevTools issues: ${summary.totalDevtoolsIssues}`);

  return { summary, results, outputPath };
}

test("webapp audit", async ({ browser }) => {
  test.setTimeout(30 * 60 * 1000);

  const { results, outputPath } = await runAudit(browser);

  expect(results.length).toBeGreaterThan(0);
  await expect(async () => fs.access(outputPath)).not.toThrow();
});
