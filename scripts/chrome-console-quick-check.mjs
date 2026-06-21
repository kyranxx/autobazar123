import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { config as loadDotenv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

loadDotenv({ path: path.join(repoRoot, ".env.local"), override: false, quiet: true });
loadDotenv({ path: path.join(repoRoot, ".env"), override: false, quiet: true });

const DEFAULT_BASE_URL =
  process.env.CHROME_CONSOLE_CHECK_BASE_URL ||
  process.env.TEST_URL ||
  "http://localhost:3000";
const DEFAULT_WEB_SERVER_COMMAND =
  process.env.CHROME_CONSOLE_CHECK_WEB_SERVER_COMMAND ||
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ||
  "npm run dev:webpack";
const COOKIE_CONSENT_KEY = "autobazar123_cookie_consent";
const WAIT_AFTER_NAV_MS = 900;
const DEFAULT_TIMEOUT_MS = 45_000;

const IGNORE_CONSOLE_PATTERNS = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /favicon\.ico/i,
  /InstantSearchNext relies on experimental APIs/i,
  /A parser-blocking, cross site .* is invoked via document.write/i,
];

const IGNORE_NETWORK_PATTERNS = [
  /accounts\.google\.com\/ExpireGapsSession/i,
  /nextjs_original-stack-frames/i,
  /_next\/image\?url=.*&w=/i,
];

const IGNORE_DEVTOOLS_ISSUES = [/CookieIssue/i];
const CHROME_LOG_SOURCES_OF_INTEREST = new Set([
  "javascript",
  "network",
  "security",
  "violation",
  "deprecation",
  "intervention",
  "recommendation",
  "other",
]);

const E2E_AUTH_EMAIL = process.env.E2E_AUTH_EMAIL ?? "";
const E2E_AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD ?? "";
const HAS_E2E_AUTH_CREDS =
  E2E_AUTH_EMAIL.length > 0 && E2E_AUTH_PASSWORD.length > 0;
const E2E_AUTH_IS_ADMIN = process.env.E2E_AUTH_IS_ADMIN === "true";
const POST_LOGIN_CONTINUE_LABEL = /^(continue|pokracovat)$/i;

function truncate(text, max = 360) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeIssueText(value) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function shouldIgnore(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeLocalPathname(value, baseUrl = DEFAULT_BASE_URL) {
  if (!value) return null;

  try {
    const url = new URL(value, baseUrl);
    const base = new URL(baseUrl);
    if (url.origin !== base.origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function parseArgs(argv = []) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    headed: false,
    failOnIssues: false,
  };

  for (const arg of argv) {
    if (arg === "--headed") {
      options.headed = true;
      continue;
    }

    if (arg === "--fail-on-issues") {
      options.failOnIssues = true;
      continue;
    }

    if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length) || DEFAULT_BASE_URL;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function shouldKeepChromeLogEntry(entry) {
  const text = normalizeIssueText(entry?.text);
  const source = normalizeText(entry?.source).toLowerCase();
  const level = normalizeText(entry?.level).toLowerCase();

  if (!text) return false;
  if (shouldIgnore(text, IGNORE_CONSOLE_PATTERNS)) return false;

  if (level === "error" || level === "warning") {
    return true;
  }

  return CHROME_LOG_SOURCES_OF_INTEREST.has(source);
}

export function countIssues(result) {
  return (
    result.consoleMessages.length +
    result.pageErrors.length +
    result.networkFailures.length +
    result.devtoolsIssues.length +
    result.chromeLogs.length
  );
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function formatLocation(url, lineNumber) {
  const safeUrl = normalizeText(url);
  if (!safeUrl) return undefined;
  if (typeof lineNumber === "number" && Number.isFinite(lineNumber)) {
    return `${safeUrl}:${lineNumber}`;
  }
  return safeUrl;
}

function noteSummary(notes) {
  return notes.length > 0 ? notes.join(" | ") : "none";
}

function shouldManageLocalServer(baseUrl) {
  if (process.env.TEST_URL) return false;

  try {
    const url = new URL(baseUrl);
    return url.origin === "http://localhost:3000";
  } catch {
    return false;
  }
}

async function isUrlReachable(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(5_000),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isUrlReachable(url)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  return false;
}

function startManagedServer() {
  const shell = process.platform === "win32";
  const child = spawn(DEFAULT_WEB_SERVER_COMMAND, {
    cwd: repoRoot,
    env: process.env,
    shell,
    stdio: "pipe",
  });

  child.stdout?.on("data", () => {});
  child.stderr?.on("data", () => {});

  return child;
}

async function stopManagedServer(child) {
  if (!child || child.killed) return;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }

  child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  if (!child.killed) {
    child.kill("SIGKILL");
  }
}

async function ensureBaseUrlReady(baseUrl) {
  if (!shouldManageLocalServer(baseUrl)) {
    return { managedServer: null, managedServerStarted: false };
  }

  if (await isUrlReachable(baseUrl)) {
    return { managedServer: null, managedServerStarted: false };
  }

  const managedServer = startManagedServer();
  const ready = await waitForUrl(baseUrl);

  if (!ready) {
    await stopManagedServer(managedServer);
    throw new Error(
      `Local dev server did not become ready at ${baseUrl} using '${DEFAULT_WEB_SERVER_COMMAND}'.`,
    );
  }

  return { managedServer, managedServerStarted: true };
}

async function ensureOutputDir() {
  const outputDir = path.join(repoRoot, "output", "chrome-console-quick-check");
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

async function seedCookieConsent(context) {
  const value = JSON.stringify({
    necessary: true,
    analytics: true,
    marketing: true,
    timestamp: Date.now(),
  });

  await context.addInitScript(
    ({ key, consent }) => {
      window.localStorage.setItem(key, consent);
    },
    { key: COOKIE_CONSENT_KEY, consent: value },
  );
}

async function createContext(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await seedCookieConsent(context);
  return context;
}

async function gotoAndSettle(page, url) {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: DEFAULT_TIMEOUT_MS,
  });
  await page.waitForTimeout(WAIT_AFTER_NAV_MS);
  return response;
}

async function loginWithPassword(page, baseUrl, redirectPath = "/") {
  await gotoAndSettle(
    page,
    new URL(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`, baseUrl).toString(),
  );

  const emailField = page.locator("#auth-login-email");
  if (!(await emailField.isVisible().catch(() => false))) {
    const continueButton = page
      .getByRole("button", { name: POST_LOGIN_CONTINUE_LABEL })
      .first();

    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      await page.waitForTimeout(WAIT_AFTER_NAV_MS);
      return;
    }
  }

  await emailField.waitFor({ timeout: 15_000 });
  await emailField.fill(E2E_AUTH_EMAIL);
  const passwordField = page.locator("#auth-login-password");
  await passwordField.fill(E2E_AUTH_PASSWORD);
  await passwordField.press("Enter");
  await page.waitForTimeout(1_500);
}

async function discoverListingPath(browser, baseUrl) {
  const context = await createContext(browser);
  const page = await context.newPage();

  try {
    await gotoAndSettle(page, `${baseUrl}/vysledky`);

    const links = page.locator("a[href^='/auto/']");
    const count = await links.count();
    if (count === 0) {
      return null;
    }

    const href = await links.first().getAttribute("href");
    return normalizeLocalPathname(href, baseUrl);
  } catch {
    return null;
  } finally {
    await context.close();
  }
}

function createEmptyResult(target) {
  return {
    id: target.id,
    label: target.label,
    requestedUrl: "",
    finalUrl: "",
    status: "ok",
    navigationStatus: null,
    notes: [],
    consoleMessages: [],
    pageErrors: [],
    networkFailures: [],
    devtoolsIssues: [],
    chromeLogs: [],
  };
}

async function attachCollectors(page) {
  const consoleMessages = [];
  const pageErrors = [];
  const networkFailures = [];
  const devtoolsIssues = [];
  const chromeLogs = [];

  const seenKeys = {
    console: new Set(),
    pageError: new Set(),
    network: new Set(),
    devtools: new Set(),
    chromeLog: new Set(),
  };

  const pushUnique = (bucket, setName, value, key) => {
    if (seenKeys[setName].has(key)) return;
    seenKeys[setName].add(key);
    bucket.push(value);
  };

  const onConsole = (msg) => {
    const type = msg.type();
    if (type !== "error" && type !== "warning") return;

    const text = normalizeIssueText(msg.text());
    if (!text || shouldIgnore(text, IGNORE_CONSOLE_PATTERNS)) return;

    const location = msg.location();
    const entry = {
      type,
      text,
      location: formatLocation(location?.url, location?.lineNumber),
    };

    pushUnique(
      consoleMessages,
      "console",
      entry,
      `${entry.type}|${entry.location ?? ""}|${entry.text}`,
    );
  };

  const onPageError = (error) => {
    const text = normalizeIssueText(error instanceof Error ? error.message : String(error));
    if (!text || shouldIgnore(text, IGNORE_CONSOLE_PATTERNS)) return;
    pushUnique(pageErrors, "pageError", text, text);
  };

  const onRequestFailed = (request) => {
    const url = request.url();
    if (shouldIgnore(url, IGNORE_NETWORK_PATTERNS)) return;

    const error = request.failure()?.errorText ?? "requestfailed";
    if (error === "net::ERR_ABORTED") return;

    const entry = {
      method: request.method(),
      url,
      status: null,
      statusText: "",
      error,
    };

    pushUnique(
      networkFailures,
      "network",
      entry,
      `${entry.method}|${entry.url}|${entry.error}`,
    );
  };

  const onResponse = (response) => {
    const status = response.status();
    if (status < 400) return;

    const url = response.url();
    if (shouldIgnore(url, IGNORE_NETWORK_PATTERNS)) return;

    const entry = {
      method: response.request().method(),
      url,
      status,
      statusText: response.statusText(),
      error: "",
    };

    pushUnique(
      networkFailures,
      "network",
      entry,
      `${entry.method}|${entry.url}|${entry.status}|${entry.statusText}`,
    );
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Log.enable");
  await cdp.send("Audits.enable");

  cdp.on("Log.entryAdded", ({ entry }) => {
    if (!shouldKeepChromeLogEntry(entry)) return;

    const normalized = {
      source: normalizeText(entry.source),
      level: normalizeText(entry.level),
      text: normalizeIssueText(entry.text),
      location: formatLocation(entry.url, entry.lineNumber),
    };

    pushUnique(
      chromeLogs,
      "chromeLog",
      normalized,
      `${normalized.source}|${normalized.level}|${normalized.location ?? ""}|${normalized.text}`,
    );
  });

  cdp.on("Audits.issueAdded", ({ issue }) => {
    const code = normalizeText(issue?.code) || "UnknownIssue";
    const summary = normalizeIssueText(JSON.stringify(issue?.details ?? {}));

    if (shouldIgnore(code, IGNORE_DEVTOOLS_ISSUES)) return;
    if (summary && shouldIgnore(summary, IGNORE_DEVTOOLS_ISSUES)) return;

    const entry = {
      code,
      summary: truncate(summary),
    };

    pushUnique(
      devtoolsIssues,
      "devtools",
      entry,
      `${entry.code}|${entry.summary}`,
    );
  });

  return {
    snapshot() {
      return {
        consoleMessages,
        pageErrors,
        networkFailures,
        devtoolsIssues,
        chromeLogs,
      };
    },
    async cleanup() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("requestfailed", onRequestFailed);
      page.off("response", onResponse);
      await cdp.detach().catch(() => undefined);
    },
  };
}

async function auditTarget(browser, baseUrl, target, listingPath) {
  const context = await createContext(browser);
  const page = await context.newPage();
  const result = createEmptyResult(target);
  const collectors = await attachCollectors(page);

  try {
    if (target.requiresAuth && !HAS_E2E_AUTH_CREDS) {
      result.notes.push("Missing E2E_AUTH_EMAIL / E2E_AUTH_PASSWORD. Capturing guest redirect coverage only.");
    }

    if (target.id === "random-ad" && !listingPath) {
      result.status = "skipped";
      result.notes.push("Could not discover a listing detail URL from /vysledky.");
      return { ...result, ...collectors.snapshot() };
    }

    if (target.requiresAuth && HAS_E2E_AUTH_CREDS) {
      await loginWithPassword(page, baseUrl, target.path ?? "/");
      result.notes.push("Authenticated coverage enabled with E2E auth credentials.");
    }

    if (target.id === "admin" && HAS_E2E_AUTH_CREDS && !E2E_AUTH_IS_ADMIN) {
      result.notes.push("E2E_AUTH_IS_ADMIN is not true, so /admin may redirect by design.");
    }

    const pathOrUrl = target.id === "random-ad" ? listingPath : target.path;
    const url = pathOrUrl ? new URL(pathOrUrl, baseUrl).toString() : baseUrl;
    result.requestedUrl = url;

    const response = await gotoAndSettle(page, url);
    result.navigationStatus = response?.status() ?? null;

    if (typeof target.interact === "function") {
      await target.interact(page);
      await page.waitForTimeout(WAIT_AFTER_NAV_MS);
    }

    result.finalUrl = page.url();
  } catch (error) {
    result.status = "failed";
    result.notes.push(
      `Audit action failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    const snapshot = collectors.snapshot();
    Object.assign(result, snapshot);
    await collectors.cleanup();
    await context.close();
  }

  if (result.status === "ok" && countIssues(result) > 0) {
    result.status = "issues";
  }

  return result;
}

async function openLoginModal(page) {
  const loginButton = page
    .getByRole("button", { name: /log in|login|prihl/i })
    .first();
  await loginButton.waitFor({ timeout: 15_000 });
  await loginButton.click();
  await page.locator("#auth-login-email").waitFor({ timeout: 15_000 });
}

async function openRegisterModal(page) {
  await openLoginModal(page);
  const modalRoot = page.locator(".fixed.inset-0").last();
  const registerButton = modalRoot
    .locator("button")
    .filter({ hasText: /register|registrov|registr/i })
    .last();
  await registerButton.waitFor({ timeout: 15_000 });
  await registerButton.click();
  await page.locator("#auth-register-email").waitFor({ timeout: 15_000 });
}

function createTargets() {
  return [
    {
      id: "frontpage",
      label: "Frontpage",
      path: "/",
    },
    {
      id: "results",
      label: "/vysledky",
      path: "/vysledky",
      interact: async (page) => {
        const input = page.locator("input[type='search']").first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill("octavia");
          await page.waitForTimeout(800);
        }
      },
    },
    {
      id: "random-ad",
      label: "Random ad detail",
      path: null,
    },
    {
      id: "login-dialog",
      label: "Login dialog",
      path: "/",
      interact: openLoginModal,
    },
    {
      id: "register-dialog",
      label: "Register dialog",
      path: "/",
      interact: openRegisterModal,
    },
    {
      id: "dashboard",
      label: "User dashboard",
      path: "/moj-ucet",
      requiresAuth: true,
    },
    {
      id: "admin",
      label: "Admin page",
      path: "/admin",
      requiresAuth: true,
    },
  ];
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Chrome Console Quick Check");
  lines.push("");
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Base URL: ${report.baseUrl}`);
  lines.push(`- Browser: ${report.browserName}`);
  lines.push(`- Listing detail source: ${report.listingPath ?? "not found"}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Target | Status | Issues | Final URL | Notes |");
  lines.push("| --- | --- | ---: | --- | --- |");

  for (const result of report.results) {
    lines.push(
      `| ${result.label} | ${result.status} | ${countIssues(result)} | ${result.finalUrl || result.requestedUrl || "n/a"} | ${noteSummary(result.notes)} |`,
    );
  }

  for (const result of report.results) {
    lines.push("");
    lines.push(`## ${result.label}`);
    lines.push("");
    lines.push(`- Status: ${result.status}`);
    lines.push(`- Requested: ${result.requestedUrl || "n/a"}`);
    lines.push(`- Final: ${result.finalUrl || "n/a"}`);
    lines.push(`- Navigation status: ${result.navigationStatus ?? "n/a"}`);
    lines.push(`- Notes: ${noteSummary(result.notes)}`);
    lines.push(
      `- Counts: console=${result.consoleMessages.length}, pageErrors=${result.pageErrors.length}, network=${result.networkFailures.length}, devtoolsIssues=${result.devtoolsIssues.length}, chromeLogs=${result.chromeLogs.length}`,
    );

    if (result.consoleMessages.length > 0) {
      lines.push("");
      lines.push("### Console warnings/errors");
      for (const entry of result.consoleMessages) {
        lines.push(`- [${entry.type}] ${truncate(entry.text)}${entry.location ? ` (${entry.location})` : ""}`);
      }
    }

    if (result.pageErrors.length > 0) {
      lines.push("");
      lines.push("### Page exceptions");
      for (const entry of result.pageErrors) {
        lines.push(`- ${truncate(entry)}`);
      }
    }

    if (result.networkFailures.length > 0) {
      lines.push("");
      lines.push("### Network failures");
      for (const entry of result.networkFailures) {
        const statusText = entry.status ? ` ${entry.status} ${entry.statusText}` : "";
        const errorText = entry.error ? ` ${entry.error}` : "";
        lines.push(`- [${entry.method}] ${entry.url}${statusText}${errorText}`);
      }
    }

    if (result.devtoolsIssues.length > 0) {
      lines.push("");
      lines.push("### DevTools issues");
      for (const entry of result.devtoolsIssues) {
        lines.push(`- [${entry.code}] ${truncate(entry.summary)}`);
      }
    }

    if (result.chromeLogs.length > 0) {
      lines.push("");
      lines.push("### Chrome log recommendations/issues");
      for (const entry of result.chromeLogs) {
        lines.push(
          `- [${entry.level || "log"}:${entry.source || "unknown"}] ${truncate(entry.text)}${entry.location ? ` (${entry.location})` : ""}`,
        );
      }
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function writeReport(report) {
  const outputDir = await ensureOutputDir();
  const stamp = nowStamp();
  const jsonPath = path.join(outputDir, `chrome-console-quick-check-${stamp}.json`);
  const mdPath = path.join(outputDir, `chrome-console-quick-check-${stamp}.md`);
  const latestJsonPath = path.join(outputDir, "latest.json");
  const latestMdPath = path.join(outputDir, "latest.md");
  const markdown = renderMarkdown(report);

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(mdPath, markdown, "utf8");
  await fs.writeFile(latestJsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(latestMdPath, markdown, "utf8");

  return { jsonPath, mdPath, latestJsonPath, latestMdPath };
}

async function launchBrowser(headed) {
  try {
    const browser = await chromium.launch({ channel: "chrome", headless: !headed });
    return { browser, browserName: "chrome" };
  } catch {
    const browser = await chromium.launch({ headless: !headed });
    return { browser, browserName: "chromium" };
  }
}

async function runQuickCheck(options = parseArgs(process.argv.slice(2))) {
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  const { managedServer, managedServerStarted } = await ensureBaseUrlReady(baseUrl);
  const { browser, browserName } = await launchBrowser(options.headed);

  try {
    const listingPath = await discoverListingPath(browser, baseUrl);
    const results = [];

    for (const target of createTargets()) {
      const result = await auditTarget(browser, baseUrl, target, listingPath);
      results.push(result);
      console.log(
        `${target.label}: status=${result.status} issues=${countIssues(result)} final=${result.finalUrl || "n/a"}`,
      );
    }

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      browserName,
      managedServerStarted,
      listingPath,
      results,
      summary: {
        totalTargets: results.length,
        withIssues: results.filter((entry) => entry.status === "issues").length,
        failed: results.filter((entry) => entry.status === "failed").length,
        skipped: results.filter((entry) => entry.status === "skipped").length,
        totalIssues: results.reduce((sum, entry) => sum + countIssues(entry), 0),
      },
    };

    const outputPaths = await writeReport(report);

    console.log("");
    console.log(`Report written: ${outputPaths.latestMdPath}`);
    console.log(`JSON written:   ${outputPaths.latestJsonPath}`);
    console.log(
      `Summary: targets=${report.summary.totalTargets}, issues=${report.summary.totalIssues}, withIssues=${report.summary.withIssues}, failed=${report.summary.failed}, skipped=${report.summary.skipped}`,
    );

    if (
      options.failOnIssues &&
      (report.summary.totalIssues > 0 || report.summary.failed > 0)
    ) {
      process.exitCode = 1;
    }

    return { report, outputPaths };
  } finally {
    await browser.close();
    await stopManagedServer(managedServer);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runQuickCheck().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`CHROME CONSOLE QUICK CHECK FAILED: ${message}`);
    process.exit(1);
  });
}

export { runQuickCheck, renderMarkdown };
export { POST_LOGIN_CONTINUE_LABEL };
