import fs from "node:fs/promises";
import path from "node:path";
import puppeteer, { ConsoleMessage, Page, HTTPResponse } from "puppeteer";

const BASE_URL = process.env.AUDIT_BASE_URL || process.env.TEST_URL || "http://localhost:3000";

const ROUTES = [
  "/",
  "/vysledky",
  "/kredity",
  "/moj-ucet",
  "/admin",
  "/auth/login",
  "/auth/register",
  "/ceny",
  "/predajcovia",
];

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
];

const IGNORE_NETWORK_PATTERNS = [
  /accounts\.google\.com\/ExpireGapsSession/i,
  /nextjs_original-stack-frames/i,
];

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

interface PerfSnapshot {
  domContentLoadedMs: number | null;
  loadEventMs: number | null;
  firstPaintMs: number | null;
  firstContentfulPaintMs: number | null;
  transferSizeBytes: number | null;
  decodedBodySizeBytes: number | null;
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
  perf: PerfSnapshot;
}

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

async function getPerfSnapshot(page: Page): Promise<PerfSnapshot> {
  return page.evaluate(() => {
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const paintEntries = performance.getEntriesByType("paint");
    const firstPaint = paintEntries.find((entry) => entry.name === "first-paint")?.startTime ?? null;
    const firstContentfulPaint =
      paintEntries.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? null;

    return {
      domContentLoadedMs: navEntry ? Math.round(navEntry.domContentLoadedEventEnd) : null,
      loadEventMs: navEntry ? Math.round(navEntry.loadEventEnd) : null,
      firstPaintMs: firstPaint !== null ? Math.round(firstPaint) : null,
      firstContentfulPaintMs:
        firstContentfulPaint !== null ? Math.round(firstContentfulPaint) : null,
      transferSizeBytes: navEntry?.transferSize ?? null,
      decodedBodySizeBytes: navEntry?.decodedBodySize ?? null,
      resourceCount: performance.getEntriesByType("resource").length,
    };
  });
}

async function auditRoute(page: Page, route: string, viewportName: string): Promise<RouteAuditResult> {
  const requestedUrl = `${BASE_URL}${route}`;
  const consoleErrors: ConsoleEntry[] = [];
  const pageErrors: string[] = [];
  const networkFailures: NetworkFailure[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error" && msg.type() !== "warn") {
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

  page.on("response", async (response: HTTPResponse) => {
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
  } catch (error) {
    pageErrors.push(
      error instanceof Error ? `Navigation failed: ${error.message}` : "Navigation failed",
    );
  }

  const navDurationMs = Date.now() - start;

  // Let any late console/network events settle.
  await new Promise((resolve) => setTimeout(resolve, 250));

  const title = await page.title();
  const perf = await getPerfSnapshot(page);

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
    perf,
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const results: RouteAuditResult[] = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const viewport of VIEWPORTS) {
      for (const route of ROUTES) {
        const page = await browser.newPage();
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: viewport.deviceScaleFactor,
          isMobile: viewport.isMobile,
          hasTouch: viewport.hasTouch,
        });

        const result = await auditRoute(page, route, viewport.name);
        results.push(result);

        const errorCount =
          result.consoleErrors.length +
          result.pageErrors.length +
          result.networkFailures.length;

        console.log(
          `${viewport.name.toUpperCase()} ${route} -> status=${result.status ?? "n/a"} nav=${result.navDurationMs}ms errors=${errorCount}`,
        );

        await page.close();
      }
    }
  } finally {
    await browser.close();
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
        result.networkFailures.length > 0
      );
    }).length,
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
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
