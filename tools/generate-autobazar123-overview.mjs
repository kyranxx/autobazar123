import fs from "node:fs/promises";
import path from "node:path";

import {
  CHANGE_IMPACT,
  CHANGE_GUIDES,
  COMMAND_ORDER,
  DATA_ATLAS,
  DB_RELATIONSHIPS,
  EXTERNAL_SETUP_ATLAS,
  FEATURE_ATLAS,
  FRAGILITY_AREAS,
  GLOSSARY,
  JOURNEYS,
  KNOWN_UNKNOWNS,
  PRODUCT_SUMMARY,
  READING_ORDER,
  REPO_SECTIONS,
  ROLES,
  SECURITY_CONTROLS,
  SERVICE_ATLAS,
  STATE_LIFECYCLES,
  TEST_GAPS,
  TROUBLESHOOTING,
} from "./autobazar123-overview-data.mjs";

const repoRoot = process.cwd();
const outputPath = path.join(repoRoot, "docs", "autobazar123-project-overview.html");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function appRouteFromFile(relativePath) {
  const normalized = relativePath.replace(/^src\/app\//, "");
  const parts = normalized.split("/");
  const fileName = parts.pop();
  const filteredParts = parts.filter((part) => !(part.startsWith("(") && part.endsWith(")")));

  if (fileName === "page.tsx" || fileName === "route.ts") {
    return `/${filteredParts.join("/")}`.replace(/\/+/g, "/") || "/";
  }

  return null;
}

function routeArea(routePath) {
  if (routePath.startsWith("/api/")) return "API";
  if (routePath.startsWith("/auth")) return "Auth";
  if (routePath.startsWith("/admin") || routePath.startsWith("/nastavenia")) return "Admin";
  if (routePath.startsWith("/kredity")) return "Payments";
  if (routePath.startsWith("/vysledky") || routePath === "/" || routePath.startsWith("/[brand]")) {
    return "Search & discovery";
  }
  if (
    routePath.startsWith("/pridat-inzerat") ||
    routePath.startsWith("/upravit-inzerat") ||
    routePath.startsWith("/moje-inzeraty")
  ) {
    return "Seller operations";
  }
  if (routePath.startsWith("/spravy") || routePath.startsWith("/ulozene")) return "Messaging & saved items";
  if (routePath.startsWith("/dealer") || routePath.startsWith("/predajca") || routePath.startsWith("/predajcovia")) {
    return "Dealer";
  }
  if (routePath.startsWith("/auto")) return "Listing detail";
  return "Site";
}

function summarizeRoute(routePath, relativePath) {
  const route = routePath.toLowerCase();
  if (route === "/") return "Homepage and top entry point into search.";
  if (route.startsWith("/vysledky")) return "Main results page driven by search state.";
  if (route.startsWith("/auto/")) return "Vehicle detail page with photos, seller info, and inquiry actions.";
  if (route.startsWith("/auth/login")) return "Password and Google login entry.";
  if (route.startsWith("/auth/register")) return "Account registration entry.";
  if (route.startsWith("/auth/reset-password")) return "Password reset UX.";
  if (route.startsWith("/auth/callback")) return "OAuth and auth callback handler.";
  if (route.startsWith("/kredity/uspech")) return "Credits success confirmation and tracking surface.";
  if (route.startsWith("/kredity")) return "Credit purchase page.";
  if (route.startsWith("/spravy")) return "Messaging and conversation view.";
  if (route.startsWith("/ulozene")) return "Saved items and alert-related view.";
  if (route.startsWith("/pridat-inzerat")) return "Listing creation wizard.";
  if (route.startsWith("/upravit-inzerat")) return "Listing editing surface.";
  if (route.startsWith("/dealer")) return "Dealer dashboard.";
  if (route.startsWith("/predajca")) return "Public dealer profile.";
  if (route.startsWith("/predajcovia")) return "Dealer directory.";
  if (route.startsWith("/moj-ucet")) return "User dashboard and account center.";
  if (route.startsWith("/admin")) return "Admin operations console.";
  if (route.startsWith("/api/stripe/checkout")) return "Creates Stripe Checkout sessions.";
  if (route.startsWith("/api/stripe/webhook")) return "Handles Stripe webhook events and credit side effects.";
  if (route.startsWith("/api/algolia/sync")) return "Syncs Supabase ads into Algolia.";
  if (route.startsWith("/api/search/catalog")) return "Fallback or API-backed listing catalog search.";
  if (route.startsWith("/api/search/count")) return "Search count helper route.";
  if (route.startsWith("/api/cron/send-alerts")) return "Cron route for marketplace alerts.";
  if (route.startsWith("/api/cron/process-email-jobs")) return "Cron route for email job queue processing.";
  if (route.startsWith("/api/cron/expire-ads")) return "Cron route to expire stale ads and tidy related search state.";
  if (route.startsWith("/api/cron/cleanup-sold")) return "Cron route to clean up sold-listing state.";
  if (route.startsWith("/api/images/upload-url")) return "Creates direct-upload information for Cloudflare Images.";
  if (route.startsWith("/api/inquiries")) return "Buyer-seller inquiry endpoint.";
  if (route.startsWith("/api/account/")) return "Authenticated account operation endpoint.";
  if (route.startsWith("/api/auth/")) return "Auth-related server endpoint.";
  if (route.startsWith("/api/monitoring/") || route.startsWith("/api/admin/quality-gates")) {
    return "Operational monitoring or quality-gate endpoint.";
  }
  if (relativePath.endsWith("sitemap.ts")) return "Sitemap generator.";
  if (relativePath.endsWith("robots.ts")) return "Robots rules generator.";
  return "See source file for route-specific behavior.";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function featureEntity(id) {
  return `feature:${id}`;
}

function guideEntity(id) {
  return `guide:${id}`;
}

function routeEntity(routePath) {
  return `route:${routePath}`;
}

function canonicalServiceName(serviceName) {
  if (serviceName === "Resend") return "Resend + React Email";
  if (serviceName === "Vercel Cron") return "Vercel Cron + deployment";
  return serviceName;
}

function serviceEntity(serviceName) {
  return `service:${canonicalServiceName(serviceName)}`;
}

function tableEntity(tableName) {
  return `table:${tableName}`;
}

function testEntity(testPath) {
  return `test:${testPath}`;
}

function countValues(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function extractMethods(content) {
  return unique(
    [...content.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map(
      (match) => match[1],
    ),
  ).sort();
}

function extractTouchedTables(content) {
  return unique(
    [...content.matchAll(/\.from\(\s*["'`]([a-zA-Z0-9_]+)["'`]\s*\)/g)].map((match) => match[1]),
  ).sort();
}

function extractTouchedRpcs(content) {
  return unique(
    [...content.matchAll(/\.rpc\(\s*["'`]([a-zA-Z0-9_]+)["'`]/g)].map((match) => match[1]),
  ).sort();
}

function extractWriteTables(content) {
  return unique(
    [...content.matchAll(/\.from\(\s*["'`]([a-zA-Z0-9_]+)["'`]\s*\)(?:(?!\.from\().){0,1200}?\.(insert|update|upsert|delete)\s*\(/gs)].map(
      (match) => match[1],
    ),
  ).sort();
}

function inferServicesFromContent(routePath, content) {
  const haystack = `${routePath}\n${content}`.toLowerCase();
  const services = [];

  if (/supabase|createadminclient|getanonclient|getserverclient|createcronadminclient/.test(haystack)) {
    services.push("Supabase");
  }
  if (/algolia/.test(haystack)) {
    services.push("Algolia");
  }
  if (/stripe/.test(haystack)) {
    services.push("Stripe");
  }
  if (/resend|react-email|@\/lib\/email\/|sendsavedadalertemail|sendsavedsearchalertemail/.test(haystack)) {
    services.push("Resend + React Email");
  }
  if (
    routePath === "/api/images/upload-url" ||
    /cloudflare|image-optimizer|@\/utils\/upload|photo upload|direct upload/.test(haystack)
  ) {
    services.push("Cloudflare Images");
  }
  if (/ratelimit|upstash/.test(haystack)) {
    services.push("Upstash Redis");
  }
  if (/analytics|posthog|ga4|web-vitals/.test(haystack)) {
    services.push("Analytics transports");
  }
  if (/cron|rejectwheninvalidcronrequest|createcronadminclient/.test(haystack)) {
    services.push("Vercel Cron + deployment");
  }
  if (/google|one tap/.test(haystack)) {
    services.push("Google Identity Services");
  }
  if (routePath === "/api/vin/decode" || /vincario|@\/lib\/vin\/|vin decode/.test(haystack)) {
    services.push("VINCARIO");
  }

  return unique(services).sort();
}

function inferAuthBoundary(routePath, content) {
  const explicit = new Map([
    ["/api/algolia/sync", "Service bearer secret"],
    ["/api/analytics/events", "Public ingest with rate limit"],
    ["/api/admin/quality-gates", "Site admin"],
    ["/api/contact", "Public with CSRF and rate limit"],
    ["/api/flags", "Session-aware optional auth"],
    ["/api/health", "Public summary / admin detail"],
    ["/api/listing-reports", "Public with captcha and rate limit"],
    ["/api/maintenance/unlock", "Password-protected public"],
    ["/api/monitoring/quality-gates", "GitHub Actions OIDC / secret"],
    ["/api/monitoring/web-vitals", "Public ingest with rate limit"],
    ["/api/search/catalog", "Public read"],
    ["/api/search/count", "Public read"],
    ["/api/stripe/webhook", "Stripe webhook signature"],
    ["/api/vehicle-taxonomy", "Public read"],
  ]);

  if (explicit.has(routePath)) return explicit.get(routePath);
  if (routePath.startsWith("/api/cron/")) return "Cron secret";
  if (
    routePath.startsWith("/api/account/") ||
    routePath === "/api/images/upload-url" ||
    routePath === "/api/inquiries" ||
    routePath === "/api/stripe/checkout" ||
    routePath === "/api/vin/decode"
  ) {
    return "Authenticated user";
  }
  if (routePath.startsWith("/api/auth/")) return "Public with CSRF and rate limit";

  const haystack = content.toLowerCase();
  if (/iscurrentusersiteadmin|site-admin/.test(haystack)) return "Site admin";
  if (/rejectwheninvalidcronrequest/.test(haystack)) return "Cron secret";
  if (/authorization/.test(haystack) && /quality_gate|oidc/.test(haystack)) {
    return "GitHub Actions OIDC / secret";
  }
  if (/authorization/.test(haystack)) return "Service bearer secret";
  if (/maintenance_bypass|maintenance unlock/.test(haystack)) return "Password-protected public";
  if (/verifyturnstiletoken/.test(haystack)) return "Public with captcha and rate limit";
  if (/supabase\.auth\.getuser|requireauthenticateduser/.test(haystack)) {
    return "Authenticated or session-aware";
  }
  if (/rejectinvalidcsrfrequest|rejectwheninvalidcsrftoken|rejectwheninvalidcsrf/.test(haystack)) {
    return "Public with CSRF and rate limit";
  }
  return "Public or service route";
}

function extractTitles(content) {
  const titles = [];
  const regex =
    /\b(?:test\.describe|test|it|describe)\s*\(\s*(?:`([^`]+)`|"([^"]+)"|'([^']+)')/g;

  for (const match of content.matchAll(regex)) {
    const title = match[1] ?? match[2] ?? match[3];
    if (title && !titles.includes(title)) titles.push(title);
  }

  return titles;
}

function inferTestLayer(relativePath) {
  if (relativePath.startsWith("tests/")) return "Browser / scenario";
  if (relativePath.startsWith("src/")) return "Unit / integration";
  if (relativePath.startsWith("scripts/")) return "Tooling / policy";
  if (relativePath.startsWith("supabase/")) return "Database / SQL posture";
  return "Other";
}

function inferArea(relativePath) {
  const value = relativePath.toLowerCase();
  if (/stripe|credit|payment|revenue/.test(value)) return "Payments";
  if (/auth|password|oauth|mfa|phone|recovery|callback/.test(value)) return "Auth";
  if (/algolia|search|seo|sitemap|taxonomy|llms/.test(value)) return "Search & SEO";
  if (/security|csrf|csp|turnstile|ratelimit|request-origin|maintenance|oidc|fallback/.test(value)) {
    return "Security & reliability";
  }
  if (/inquir|contact|saved|dealer|listing-report|moderation|account|admin/.test(value)) {
    return "Accounts, messaging & admin";
  }
  if (
    /ui|component|navbar|filtersidebar|loadingspinner|authmodal|formfield|trust|button|modal|input|web-interface|accessibility|keyboard|screen-reader|reflow|mobile|audit|e2e/.test(
      value,
    )
  ) {
    return "UI, accessibility & journeys";
  }
  if (/analytics|performance/.test(value)) return "Analytics & performance";
  if (/brand|theme|i18n|diacritics|locale/.test(value)) return "Localization & brand";
  return "Platform & utilities";
}

function summarizeTestFile(relativePath, titles) {
  if (titles.length) return titles.slice(0, 3).join(" | ");
  return `Validates ${relativePath} behavior.`;
}

function commandForTest(relativePath) {
  const browserMap = new Map([
    ["tests/e2e.test.ts", "npm run test:e2e"],
    ["tests/release-gauntlet.test.ts", "npm run test:release-gauntlet"],
    ["tests/accessibility-gate.test.ts", "npm run test:a11y"],
    ["tests/reflow-zoom.test.ts", "npm run test:a11y"],
    ["tests/keyboard-navigation.test.ts", "npm run test:keyboard"],
    ["tests/web-interface-guidelines.test.ts", "npm run test:web-interface"],
    ["tests/web-interface-sitewide.test.ts", "npm run test:web-interface"],
    ["tests/screen-reader-proxy.test.ts", "npm run test:sr-proxy"],
    ["tests/link-and-mobile-test.ts", "npm run test:links"],
    ["tests/smoke-test.ts", "npm run test:smoke"],
    ["tests/webapp-audit.ts", "npm run audit:webapp"],
  ]);

  if (browserMap.has(relativePath)) return browserMap.get(relativePath);
  if (relativePath.startsWith("tests/")) return "npx playwright test";
  if (relativePath.startsWith("src/")) return "npm run test:unit";
  if (relativePath.startsWith("supabase/tests/")) return "npm run test:db:rls";
  if (relativePath.startsWith("scripts/")) return `node --test ${relativePath}`;
  return "See package scripts";
}

function classifyScript(fileName) {
  const value = fileName.toLowerCase();
  if (/gate|check|guard|posture|audit|verify|workflow|contract|graph|quality/.test(value)) {
    return "Checks and release gates";
  }
  if (/seed|create-test-ad|backfill|recover|migrate|setup-algolia|sync/.test(value)) {
    return "Data operations";
  }
  if (/ingest|import|capture|report|taxonomy|vendor/.test(value)) return "Imports and ingestion";
  if (/dev|reset|server|hooks/.test(value)) return "Developer workflow";
  if (/benchmark|model|codex|agent|skill/.test(value)) return "Agent and tooling";
  if (/manual|debug|test-homepage|test-all|refactor/.test(value)) return "Manual helpers and experiments";
  return "Utility";
}

function scriptPurpose(fileName) {
  const value = fileName.toLowerCase();
  if (value === "supabase-db-tests.mjs") return "Runs SQL policy posture tests against the database.";
  if (value === "chrome-console-quick-check.mjs") return "Quick browser-console audit helper.";
  if (value === "security-release-gate.mjs") return "Enforces release security policy checks.";
  if (value === "performance-budget-gate.mjs") return "Evaluates performance budgets and regressions.";
  if (value === "ui-quality-gate.mjs") return "Aggregates UI quality and route-level checks.";
  if (value === "check-prod-rate-limit-env.mjs") return "Fails production-target builds when strict rate-limit env vars are missing.";
  if (value === "links-ingest.mjs") return "Imports and snapshots link research input.";
  if (value === "import-jato-taxonomy.ts") return "Imports vehicle taxonomy data.";
  if (value === "setup-algolia.ts") return "Configures or seeds Algolia index-related state.";
  if (value === "vendor-docs-sync.mjs") return "Refreshes vendored documentation snapshots.";
  return "See file name and source for exact behavior.";
}

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) {
    const bucket = item[key];
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

async function collectRoutes() {
  const appFiles = await walkFiles(path.join(repoRoot, "src", "app"));
  const pageRoutes = [];
  const handlerRoutes = [];
  const specialFiles = [];

  for (const file of appFiles) {
    const relativePath = rel(file);

    if (relativePath.endsWith("/page.tsx")) {
      const routePath = appRouteFromFile(relativePath);
      pageRoutes.push({
        routePath,
        relativePath,
        area: routeArea(routePath),
        summary: summarizeRoute(routePath, relativePath),
      });
      continue;
    }

    if (relativePath.endsWith("/route.ts")) {
      const routePath = appRouteFromFile(relativePath);
      handlerRoutes.push({
        routePath,
        relativePath,
        area: routeArea(routePath),
        summary: summarizeRoute(routePath, relativePath),
      });
      continue;
    }

    if (
      /\/(?:layout|loading|error|not-found)\.tsx$/.test(relativePath) ||
      /\/(?:robots|sitemap|icon)\.(?:ts|tsx|svg)$/.test(relativePath)
    ) {
      specialFiles.push({ relativePath, kind: path.basename(relativePath) });
    }
  }

  pageRoutes.sort((left, right) => left.routePath.localeCompare(right.routePath));
  handlerRoutes.sort((left, right) => left.routePath.localeCompare(right.routePath));
  specialFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  return { pageRoutes, handlerRoutes, specialFiles };
}

async function collectTests() {
  const browserFiles = (await walkFiles(path.join(repoRoot, "tests")))
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) => !file.endsWith("web-interface-test-helpers.ts"));
  const srcFiles = (await walkFiles(path.join(repoRoot, "src"))).filter((file) =>
    /\.test\.(ts|tsx)$/.test(file),
  );
  const scriptFiles = (await walkFiles(path.join(repoRoot, "scripts"))).filter((file) =>
    /\.test\.mjs$/.test(file),
  );
  const supabaseFiles = (await walkFiles(path.join(repoRoot, "supabase", "tests"))).filter((file) =>
    /\.test\.sql$/.test(file),
  );

  const files = [...browserFiles, ...srcFiles, ...scriptFiles, ...supabaseFiles];
  const tests = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const relativePath = rel(file);
    const titles = extractTitles(content);
    tests.push({
      contentLower: content.toLowerCase(),
      relativePath,
      titles,
      layer: inferTestLayer(relativePath),
      area: inferArea(relativePath),
      summary: summarizeTestFile(relativePath, titles),
      command: commandForTest(relativePath),
    });
  }

  tests.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return tests;
}

async function collectScripts() {
  const files = (await fs.readdir(path.join(repoRoot, "scripts"))).sort();
  return files
    .filter((fileName) => !fileName.startsWith("."))
    .map((fileName) => ({
      fileName,
      category: classifyScript(fileName),
      purpose: scriptPurpose(fileName),
    }));
}

async function collectDatabaseInventory() {
  const files = (await walkFiles(path.join(repoRoot, "supabase", "migrations")))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => rel(left).localeCompare(rel(right)));

  const tables = new Map();
  const functions = new Map();
  let policyCount = 0;

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const tableRegex = /CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
    const functionRegex = /CREATE OR REPLACE FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
    const policyRegex = /CREATE POLICY\s+"([^"]+)"/gi;

    for (const match of content.matchAll(tableRegex)) {
      const tableName = match[1];
      if (!tables.has(tableName)) {
        tables.set(tableName, { tableName, source: rel(file) });
      }
    }

    for (const match of content.matchAll(functionRegex)) {
      const functionName = match[1];
      if (!functions.has(functionName)) {
        functions.set(functionName, { functionName, source: rel(file) });
      }
    }

    policyCount += [...content.matchAll(policyRegex)].length;
  }

  return {
    migrations: files.map((file) => rel(file)),
    tables: [...tables.values()].sort((left, right) => left.tableName.localeCompare(right.tableName)),
    functions: [...functions.values()].sort((left, right) =>
      left.functionName.localeCompare(right.functionName),
    ),
    policyCount,
  };
}

async function collectFallbackCount() {
  const content = await fs.readFile(path.join(repoRoot, "src", "lib", "fallbacks", "registry.ts"), "utf8");
  return (content.match(/createPolicy\(/g) ?? []).length;
}

function findTestsForRoute(route, tests) {
  const routeBase = route.relativePath.replace(/\.ts$/, "");
  const matched = tests.filter((test) => test.relativePath.startsWith(routeBase));

  return unique(matched.map((test) => test.relativePath)).sort();
}

async function collectApiDetails(handlerRoutes, tests) {
  const apiRoutes = handlerRoutes.filter((route) => route.routePath.startsWith("/api/"));
  const details = [];

  for (const route of apiRoutes) {
    const filePath = path.join(repoRoot, route.relativePath);
    const content = await fs.readFile(filePath, "utf8");
    details.push({
      ...route,
      methods: extractMethods(content),
      boundary: inferAuthBoundary(route.routePath, content),
      services: inferServicesFromContent(route.routePath, content),
      touchedTables: extractTouchedTables(content),
      writeTables: extractWriteTables(content),
      touchedRpcs: extractTouchedRpcs(content),
      linkedTests: findTestsForRoute(route, tests),
    });
  }

  return details.sort((left, right) => left.routePath.localeCompare(right.routePath));
}

function collectTableUsage(database, apiDetails) {
  return database.tables.map((table) => {
    const readers = [];
    const writers = [];
    const rpcs = [];

    for (const detail of apiDetails) {
      if (detail.touchedTables.includes(table.tableName)) {
        if (detail.writeTables.includes(table.tableName)) {
          writers.push(detail.routePath);
        } else {
          readers.push(detail.routePath);
        }
      }

      if (detail.writeTables.includes(table.tableName) && !writers.includes(detail.routePath)) {
        writers.push(detail.routePath);
      }

      if (detail.touchedRpcs.length && detail.touchedTables.includes(table.tableName)) {
        rpcs.push(...detail.touchedRpcs);
      }
    }

    const features = FEATURE_ATLAS.filter((feature) => feature.data.includes(table.tableName)).map(
      (feature) => feature.title,
    );
    const relationship = DB_RELATIONSHIPS.find((item) => item.table === table.tableName);

    return {
      tableName: table.tableName,
      source: table.source,
      meaning: DATA_ATLAS[table.tableName] ?? "Supporting table. Inspect source migration and feature references for exact usage.",
      related: relationship?.related ?? [],
      features,
      readers: unique(readers).sort(),
      writers: unique(writers).sort(),
      rpcs: unique(rpcs).sort(),
    };
  });
}

function buildLinkModel(data) {
  const featureTagMap = new Map();
  const guideTagMap = new Map();
  const serviceTagMap = new Map();
  const routeTagMap = new Map();
  const tableTagMap = new Map();
  const testTagMap = new Map();

  for (const feature of FEATURE_ATLAS) {
    const featureId = feature.id ?? slugify(feature.title);
    featureTagMap.set(
      featureId,
      unique([
        featureEntity(featureId),
        ...feature.routes.map(routeEntity),
        ...feature.services.map(serviceEntity),
        ...feature.data.map(tableEntity),
        ...feature.tests.map(testEntity),
      ]),
    );
  }

  for (const guide of CHANGE_GUIDES) {
    guideTagMap.set(
      guide.id,
      unique([
        guideEntity(guide.id),
        ...guide.featureIds.map(featureEntity),
        ...guide.routes.map(routeEntity),
        ...guide.services.map(serviceEntity),
        ...guide.tables.map(tableEntity),
        ...guide.tests.map(testEntity),
      ]),
    );
  }

  for (const service of SERVICE_ATLAS) {
    const featureIds = FEATURE_ATLAS.filter((feature) =>
      feature.services.some((value) => canonicalServiceName(value) === service.name),
    ).map(
      (feature) => feature.id ?? slugify(feature.title),
    );
    const guideIds = CHANGE_GUIDES.filter((guide) =>
      guide.services.some((value) => canonicalServiceName(value) === service.name),
    ).map(
      (guide) => guide.id,
    );
    const routes = unique([
      ...FEATURE_ATLAS.filter((feature) =>
        feature.services.some((value) => canonicalServiceName(value) === service.name),
      ).flatMap(
        (feature) => feature.routes,
      ),
      ...data.apiDetails.filter((detail) => detail.services.includes(service.name)).map((detail) => detail.routePath),
      ...CHANGE_GUIDES.filter((guide) =>
        guide.services.some((value) => canonicalServiceName(value) === service.name),
      ).flatMap((guide) => guide.routes),
    ]);
    const tables = unique([
      ...FEATURE_ATLAS.filter((feature) =>
        feature.services.some((value) => canonicalServiceName(value) === service.name),
      ).flatMap(
        (feature) => feature.data,
      ),
      ...data.tableUsage
        .filter((table) =>
          table.readers.some((routePath) =>
            data.apiDetails.some(
              (detail) => detail.routePath === routePath && detail.services.includes(service.name),
            ),
          ) ||
          table.writers.some((routePath) =>
            data.apiDetails.some(
              (detail) => detail.routePath === routePath && detail.services.includes(service.name),
            ),
          ),
        )
        .map((table) => table.tableName),
      ...CHANGE_GUIDES.filter((guide) =>
        guide.services.some((value) => canonicalServiceName(value) === service.name),
      ).flatMap((guide) => guide.tables),
    ]);
    const tests = unique([
      ...FEATURE_ATLAS.filter((feature) =>
        feature.services.some((value) => canonicalServiceName(value) === service.name),
      ).flatMap(
        (feature) => feature.tests,
      ),
      ...CHANGE_GUIDES.filter((guide) =>
        guide.services.some((value) => canonicalServiceName(value) === service.name),
      ).flatMap((guide) => guide.tests),
      ...data.apiDetails.filter((detail) => detail.services.includes(service.name)).flatMap((detail) => detail.linkedTests),
    ]);

    serviceTagMap.set(
      service.name,
      unique([
        serviceEntity(service.name),
        ...featureIds.map(featureEntity),
        ...guideIds.map(guideEntity),
        ...routes.map(routeEntity),
        ...tables.map(tableEntity),
        ...tests.map(testEntity),
      ]),
    );
  }

  const allRoutes = [...data.routes.pageRoutes, ...data.routes.handlerRoutes];
  for (const route of allRoutes) {
    const relatedFeatures = FEATURE_ATLAS.filter((feature) => feature.routes.includes(route.routePath)).map(
      (feature) => feature.id ?? slugify(feature.title),
    );
    const relatedGuides = CHANGE_GUIDES.filter((guide) => guide.routes.includes(route.routePath)).map(
      (guide) => guide.id,
    );
    const apiDetail = data.apiDetails.find((detail) => detail.routePath === route.routePath);
    const services = unique([
      ...FEATURE_ATLAS.filter((feature) => feature.routes.includes(route.routePath)).flatMap(
        (feature) => feature.services.map(canonicalServiceName),
      ),
      ...(apiDetail?.services ?? []),
      ...CHANGE_GUIDES.filter((guide) => guide.routes.includes(route.routePath)).flatMap((guide) =>
        guide.services.map(canonicalServiceName),
      ),
    ]);
    const tables = unique([
      ...FEATURE_ATLAS.filter((feature) => feature.routes.includes(route.routePath)).flatMap((feature) => feature.data),
      ...(apiDetail?.touchedTables ?? []),
      ...CHANGE_GUIDES.filter((guide) => guide.routes.includes(route.routePath)).flatMap((guide) => guide.tables),
    ]);
    const tests = unique([
      ...FEATURE_ATLAS.filter((feature) => feature.routes.includes(route.routePath)).flatMap(
        (feature) => feature.tests,
      ),
      ...(apiDetail?.linkedTests ?? []),
      ...CHANGE_GUIDES.filter((guide) => guide.routes.includes(route.routePath)).flatMap((guide) => guide.tests),
    ]);

    routeTagMap.set(
      route.routePath,
      unique([
        routeEntity(route.routePath),
        ...relatedFeatures.map(featureEntity),
        ...relatedGuides.map(guideEntity),
        ...services.map(serviceEntity),
        ...tables.map(tableEntity),
        ...tests.map(testEntity),
      ]),
    );
  }

  for (const table of data.tableUsage) {
    const relatedGuideIds = CHANGE_GUIDES.filter((guide) => guide.tables.includes(table.tableName)).map(
      (guide) => guide.id,
    );
    const services = unique(
      data.apiDetails
        .filter(
          (detail) =>
            detail.touchedTables.includes(table.tableName) || detail.writeTables.includes(table.tableName),
        )
        .flatMap((detail) => detail.services),
    );
    const tests = unique([
      ...FEATURE_ATLAS.filter((feature) => feature.data.includes(table.tableName)).flatMap((feature) => feature.tests),
      ...CHANGE_GUIDES.filter((guide) => guide.tables.includes(table.tableName)).flatMap((guide) => guide.tests),
    ]);

    tableTagMap.set(
      table.tableName,
      unique([
        tableEntity(table.tableName),
        ...table.features.map((featureTitle) =>
          featureEntity(
            FEATURE_ATLAS.find((feature) => feature.title === featureTitle)?.id ?? slugify(featureTitle),
          ),
        ),
        ...relatedGuideIds.map(guideEntity),
        ...table.readers.map(routeEntity),
        ...table.writers.map(routeEntity),
        ...services.map(serviceEntity),
        ...tests.map(testEntity),
      ]),
    );
  }

  for (const test of data.tests) {
    const relatedFeatures = FEATURE_ATLAS.filter((feature) => feature.tests.includes(test.relativePath)).map(
      (feature) => feature.id ?? slugify(feature.title),
    );
    const relatedGuides = CHANGE_GUIDES.filter((guide) => guide.tests.includes(test.relativePath)).map(
      (guide) => guide.id,
    );
    const relatedRoutes = data.apiDetails
      .filter((detail) => detail.linkedTests.includes(test.relativePath))
      .map((detail) => detail.routePath);
    const services = unique([
      ...FEATURE_ATLAS.filter((feature) => feature.tests.includes(test.relativePath)).flatMap(
        (feature) => feature.services.map(canonicalServiceName),
      ),
      ...CHANGE_GUIDES.filter((guide) => guide.tests.includes(test.relativePath)).flatMap((guide) =>
        guide.services.map(canonicalServiceName),
      ),
      ...data.apiDetails
        .filter((detail) => detail.linkedTests.includes(test.relativePath))
        .flatMap((detail) => detail.services),
    ]);
    const tables = unique([
      ...FEATURE_ATLAS.filter((feature) => feature.tests.includes(test.relativePath)).flatMap((feature) => feature.data),
      ...CHANGE_GUIDES.filter((guide) => guide.tests.includes(test.relativePath)).flatMap((guide) => guide.tables),
    ]);

    testTagMap.set(
      test.relativePath,
      unique([
        testEntity(test.relativePath),
        ...relatedFeatures.map(featureEntity),
        ...relatedGuides.map(guideEntity),
        ...relatedRoutes.map(routeEntity),
        ...services.map(serviceEntity),
        ...tables.map(tableEntity),
      ]),
    );
  }

  return {
    featureTagMap,
    guideTagMap,
    serviceTagMap,
    routeTagMap,
    tableTagMap,
    testTagMap,
  };
}

function renderBadges(values, className = "badge") {
  return values.map((value) => `<span class="${className}">${escapeHtml(value)}</span>`).join("");
}

function renderList(values) {
  return `<ul class="flat-list">${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function renderInlineCodeList(values) {
  return values.map((value) => `<code>${escapeHtml(value)}</code>`).join(" ");
}

function renderBadgesOrDash(values, className = "badge") {
  if (!values.length) return `<span class="dash">None detected</span>`;
  return renderBadges(values, className);
}

function renderInlineCodeListOrDash(values) {
  if (!values.length) return `<span class="dash">None detected</span>`;
  return renderInlineCodeList(values);
}

function renderLinkAttrs(tags) {
  const values = unique(tags);
  if (!values.length) return "";
  return ` data-link-tags="${escapeHtml(values.join("|"))}"`;
}

function renderAtlasLink(label, tags, className = "atlas-link") {
  const values = unique(tags);
  if (!values.length) return escapeHtml(label);
  return `<button type="button" class="${className}" data-link-activate="${escapeHtml(values.join("|"))}" data-link-label="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
}

function renderLinkedCodeList(values, tagBuilder) {
  if (!values.length) return `<span class="dash">None detected</span>`;
  return values
    .map((value) => renderAtlasLink(value, tagBuilder(value), "atlas-link code-link"))
    .join(" ");
}

function renderLinkedBadges(values, tagBuilder, className = "atlas-link badge-link") {
  if (!values.length) return `<span class="dash">None detected</span>`;
  return values
    .map((value) => renderAtlasLink(value, tagBuilder(value), className))
    .join("");
}

function renderMeterRows(rows) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);
  return rows
    .map(
      (row) => `
        <div class="meter-row">
          <div class="meter-label">${escapeHtml(row.label)}</div>
          <div class="meter"><span style="width:${(row.count / maxCount) * 100}%"></span></div>
          <div class="meter-count">${row.count}</div>
        </div>
      `,
    )
    .join("");
}

function renderTruthyBadge(value) {
  if (value === "Confirmed from code and docs") return `<span class="truth code-docs">${escapeHtml(value)}</span>`;
  if (value === "Confirmed from code") return `<span class="truth code">${escapeHtml(value)}</span>`;
  if (value.startsWith("Observed")) return `<span class="truth observed">${escapeHtml(value)}</span>`;
  return `<span class="truth inferred">${escapeHtml(value)}</span>`;
}

const SECTION_LINKS = [
  ["start-here", "Start Here"],
  ["glossary", "Glossary"],
  ["architecture", "Architecture"],
  ["journeys", "Journeys"],
  ["features", "Feature Atlas"],
  ["coverage-matrix", "Coverage Matrix"],
  ["change-guides", "Change Guides"],
  ["routes", "Routes"],
  ["api-map", "API Map"],
  ["services", "Services"],
  ["database-flows", "DB Flows"],
  ["data-model", "Data Model"],
  ["security", "Security"],
  ["external-systems", "External Systems"],
  ["lifecycles", "State Lifecycles"],
  ["cron-jobs", "Cron & Jobs"],
  ["tests", "Tests"],
  ["fragility", "Fragility & Gaps"],
  ["repo-map", "Repo Map"],
  ["env", "Env & Deploy"],
  ["troubleshooting", "Troubleshooting"],
  ["change-impact", "Change Impact"],
  ["known-unknowns", "Known Unknowns"],
];

const LEGEND_ITEMS = [
  ["Feature", "legend-feature"],
  ["Route", "legend-route"],
  ["Service", "legend-service"],
  ["Table", "legend-table"],
  ["Test", "legend-test"],
  ["Guide", "legend-guide"],
];

const PAGE_STYLE = `
  :root{--bg:#f3eee3;--surface:#fffaf2;--surface-alt:#f7f1e7;--ink:#153936;--ink-soft:#43635e;--teal:#1f6a5b;--rust:#a14d2d;--amber:#edc26a;--line:rgba(21,57,54,.14);--shadow:0 18px 42px rgba(20,33,29,.08);--radius:22px}
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;color:var(--ink);font:16px/1.55 "IBM Plex Sans","Segoe UI","Trebuchet MS",sans-serif;background:radial-gradient(circle at top left,rgba(237,194,106,.22),transparent 30%),radial-gradient(circle at top right,rgba(31,106,91,.16),transparent 28%),linear-gradient(180deg,#f8f3ea,#f0e8da)}
  .layout{display:grid;grid-template-columns:300px 1fr;min-height:100vh}
  .sidebar{position:sticky;top:0;height:100vh;overflow:auto;padding:28px 22px;background:rgba(244,239,228,.88);border-right:1px solid var(--line);backdrop-filter:blur(12px)}
  .sidebar h1,section h2,.hero h2{margin:0 0 10px;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;letter-spacing:-.02em}
  .sidebar h1{font-size:2rem}
  .sidebar p,.sidebar small,.card p,.hero p,section>p,.section-header p{color:var(--ink-soft)}
  .sidebar nav{margin-top:24px;display:grid;gap:10px}
  .sidebar nav a{text-decoration:none;color:inherit;padding:11px 14px;border-radius:14px;background:rgba(255,252,246,.72);display:flex;justify-content:space-between}
  main{padding:34px 40px 80px}
  section,.hero{margin-top:26px;padding:28px;border-radius:var(--radius);background:rgba(255,250,242,.92);border:1px solid rgba(21,57,54,.08);box-shadow:var(--shadow)}
  .hero{margin-top:0;background:radial-gradient(circle at 18% 10%,rgba(237,194,106,.4),transparent 32%),linear-gradient(135deg,rgba(213,239,230,.96),rgba(255,249,238,.94))}
  .hero h2,section h2{font-size:2rem}
  .toolbar{margin-top:20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
  .toolbar input{flex:1 1 280px;padding:13px 15px;border-radius:14px;border:1px solid var(--line);background:rgba(255,253,249,.86);font:inherit}
  .toolbar button{padding:11px 14px;border-radius:999px;border:1px solid var(--line);background:rgba(255,252,246,.86);cursor:pointer;font:inherit}
  .toolbar button.active{background:var(--teal);color:#f7fbf8;border-color:var(--teal)}
  .hero-legend{margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .hero-legend-label{color:var(--ink-soft);font-size:.9rem}
  .legend-item{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;border:1px solid rgba(21,57,54,.12);font-size:.76rem;text-transform:uppercase;letter-spacing:.03em}
  .legend-feature{background:rgba(31,106,91,.08);color:var(--teal)}
  .legend-route{background:rgba(21,57,54,.06);color:var(--ink)}
  .legend-service{background:rgba(161,77,45,.08);color:#8b4126}
  .legend-table{background:rgba(67,99,94,.09);color:#355c55}
  .legend-test{background:rgba(237,194,106,.15);color:#865b1e}
  .legend-guide{background:rgba(103,72,140,.09);color:#5d427f}
  .show-only-toggle{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:999px;border:1px solid rgba(21,57,54,.12);background:rgba(255,252,246,.9);color:var(--ink-soft)}
  .show-only-toggle input{margin:0}
  .show-only-toggle.disabled{opacity:.55}
  .active-filter{display:none;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 12px;border-radius:18px;background:rgba(21,57,54,.08);border:1px solid rgba(21,57,54,.12);color:var(--ink-soft)}
  .active-filter.visible{display:inline-flex}
  .active-filter button{padding:6px 10px;border-radius:999px;border:1px solid rgba(21,57,54,.14);background:rgba(255,252,246,.9);cursor:pointer}
  .active-filter-links{display:flex;flex-wrap:wrap;gap:8px}
  .active-filter-links:empty{display:none}
  .active-filter-link{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;border:1px solid rgba(31,106,91,.16);background:rgba(31,106,91,.08);color:var(--teal);text-decoration:none;font-size:.86rem}
  .stats,.card-grid{display:grid;gap:14px}
  .stats{margin-top:22px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
  .card-grid{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
  .stat,.card,.panel{padding:18px;border-radius:18px;background:rgba(255,252,246,.84);border:1px solid rgba(21,57,54,.08)}
  .stat strong{display:block;font-size:1.8rem;line-height:1}
  .section-header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;margin-bottom:18px}
  .truth,.badge{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:.76rem;text-transform:uppercase;letter-spacing:.03em;border:1px solid rgba(31,106,91,.16);background:rgba(31,106,91,.08);color:var(--teal)}
  .truth.code{background:rgba(161,77,45,.08);color:#8b4126;border-color:rgba(161,77,45,.14)}
  .truth.observed{background:rgba(67,99,94,.09);color:#355c55;border-color:rgba(67,99,94,.16)}
  .truth.inferred,.badge.warm{background:rgba(237,194,106,.15);color:#865b1e;border-color:rgba(237,194,106,.22)}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .atlas-link{appearance:none;border:none;background:none;padding:0;margin:0;color:inherit;font:inherit;cursor:pointer;text-align:left}
  .atlas-link.code-link{padding:2px 6px;border-radius:8px;background:rgba(21,57,54,.06);border:1px solid transparent;font:500 .86rem "IBM Plex Mono","Consolas",monospace}
  .atlas-link.badge-link,.atlas-link.title-link{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;border:1px solid rgba(31,106,91,.16);background:rgba(31,106,91,.08);color:var(--teal)}
  .atlas-link.title-link{padding:0;border:none;background:none;color:var(--ink);font:700 1.05rem/1.3 "IBM Plex Sans","Segoe UI",sans-serif}
  .atlas-link:hover{filter:brightness(.96)}
  .flat-list{margin:12px 0 0;padding-left:18px}
  .flat-list li+li{margin-top:6px}
  .sequence{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px}
  .sequence .step-pill{padding:10px 12px;border-radius:14px;background:rgba(255,252,246,.92);border:1px solid rgba(21,57,54,.08);font-weight:600}
  .sequence .arrow{color:var(--ink-soft);font-weight:700}
  .step-list{display:grid;gap:12px;margin-top:16px;counter-reset:atlas-step}
  .step-item{position:relative;padding:15px 16px 15px 56px;border-radius:18px;background:rgba(255,252,246,.84);border:1px solid rgba(21,57,54,.08)}
  .step-item::before{counter-increment:atlas-step;content:counter(atlas-step);position:absolute;left:16px;top:14px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--teal);color:#fff;font-weight:700}
  details{border:1px solid rgba(21,57,54,.08);border-radius:18px;background:rgba(255,252,246,.84)}
  details+details{margin-top:14px}
  summary{list-style:none;cursor:pointer;padding:16px 18px;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
  summary::-webkit-details-marker{display:none}
  .details-body{padding:0 18px 18px}
  .table-wrap{overflow:auto;border-radius:18px;border:1px solid rgba(21,57,54,.08);background:rgba(255,252,246,.88)}
  table{width:100%;border-collapse:collapse;min-width:760px}
  th,td{padding:12px 14px;text-align:left;vertical-align:top;border-bottom:1px solid rgba(21,57,54,.08)}
  th{background:rgba(246,243,235,.98);font-size:.8rem;text-transform:uppercase;letter-spacing:.03em;color:var(--ink-soft)}
  code{padding:2px 6px;border-radius:8px;background:rgba(21,57,54,.06);font:500 .86rem "IBM Plex Mono","Consolas",monospace}
  .meter-row{display:grid;grid-template-columns:220px 1fr 42px;gap:12px;align-items:center}
  .meter{height:12px;border-radius:999px;background:rgba(21,57,54,.08);overflow:hidden}
  .meter span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#2a7767,#edc26a)}
  .meter-count{text-align:right;color:var(--ink-soft)}
  .two-col{display:grid;grid-template-columns:1.2fr .8fr;gap:18px}
  .eyebrow{margin:0 0 10px;color:var(--rust);text-transform:uppercase;letter-spacing:.08em;font-size:.78rem;font-weight:700}
  .note{padding:14px 16px;border-radius:16px;background:rgba(237,194,106,.15);border:1px solid rgba(237,194,106,.26);color:#75501a}
  .dash{color:var(--ink-soft);font-style:italic}
  .mini-grid{display:grid;gap:10px;margin-top:12px}
  .mini-grid.two{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
  [data-link-tags].link-match{outline:2px solid rgba(31,106,91,.28);outline-offset:2px;background:rgba(214,239,231,.5)!important}
  [data-link-tags].link-dim{opacity:.45;transition:opacity .15s ease}
  .atlas-link.link-match{box-shadow:0 0 0 2px rgba(31,106,91,.22)}
  html[data-highlight-mode="only"] [data-link-tags].link-dim{display:none!important}
  .search-hidden{display:none!important}
  html[data-mode="simple"] .only-technical,html[data-mode="simple"] .only-debug{display:none!important}
  html[data-mode="technical"] .only-debug{display:none!important}
  svg{width:100%;height:auto;display:block}
  .diagram-title{fill:#153936;font:700 24px "IBM Plex Sans","Segoe UI",sans-serif}
  .diagram-copy{fill:#43635e;font:15px "IBM Plex Sans","Segoe UI",sans-serif}
  @media (max-width:1180px){.layout{grid-template-columns:1fr}.sidebar{position:relative;height:auto;border-right:none;border-bottom:1px solid var(--line)}.two-col{grid-template-columns:1fr}}
  @media (max-width:720px){main{padding:20px 16px 46px}.hero,section{padding:22px 18px}.meter-row{grid-template-columns:1fr}}
`;

const PAGE_SCRIPT = `
  const root = document.documentElement;
  const modeButtons = [...document.querySelectorAll(".mode-button")];
  const searchable = [...document.querySelectorAll("[data-searchable='true']")];
  const highlightable = [...document.querySelectorAll("[data-link-tags]")];
  const activators = [...document.querySelectorAll("[data-link-activate]")];
  const searchInput = document.getElementById("atlas-search");
  const activeFilter = document.getElementById("atlas-active-filter");
  const activeLabel = document.getElementById("atlas-active-label");
  const activeLinks = document.getElementById("atlas-active-links");
  const clearFilterButton = document.getElementById("atlas-clear-filter");
  const highlightOnlyToggle = document.getElementById("atlas-highlight-only");
  const highlightOnlyWrap = document.getElementById("atlas-highlight-only-wrap");

  let activeTags = [];
  let activeText = "";
  let activePrimaryTag = "";

  function parseTags(value) {
    return (value || "").split("|").map((item) => item.trim()).filter(Boolean);
  }

  function sameTags(left, right) {
    if (left.length !== right.length) return false;
    return left.every((value, index) => value === right[index]);
  }

  function setMode(mode) {
    root.dataset.mode = mode;
    modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.modeTarget === mode);
    });
  }

  function sectionLinksForTag(tag) {
    if (!tag) return [];
    if (tag.startsWith("feature:")) return [{ id: "features", label: "Features" }, { id: "coverage-matrix", label: "Coverage" }];
    if (tag.startsWith("guide:")) return [{ id: "change-guides", label: "Change Guides" }];
    if (tag.startsWith("route:")) {
      const routeValue = tag.slice("route:".length);
      if (routeValue.startsWith("/api/cron/")) return [{ id: "routes", label: "Routes" }, { id: "cron-jobs", label: "Cron & Jobs" }];
      if (routeValue.startsWith("/api/")) return [{ id: "routes", label: "Routes" }, { id: "api-map", label: "API Map" }];
      return [{ id: "routes", label: "Routes" }];
    }
    if (tag.startsWith("service:")) return [{ id: "services", label: "Services" }];
    if (tag.startsWith("table:")) return [{ id: "database-flows", label: "DB Flows" }, { id: "data-model", label: "Data Model" }];
    if (tag.startsWith("test:")) return [{ id: "tests", label: "Tests" }];
    return [];
  }

  function updateJumpLinks() {
    if (!activeLinks) return;
    const links = sectionLinksForTag(activePrimaryTag);
    activeLinks.innerHTML = links
      .map((link) => '<a class="active-filter-link" href="#' + link.id + '">' + link.label + '</a>')
      .join("");
  }

  function updateHighlightState() {
    const hasActive = activeTags.length > 0;
    root.dataset.highlightMode = hasActive && highlightOnlyToggle?.checked ? "only" : "dim";

    highlightable.forEach((node) => {
      const tags = parseTags(node.dataset.linkTags);
      const isMatch = hasActive && tags.some((tag) => activeTags.includes(tag));
      node.classList.toggle("link-match", isMatch);
      node.classList.toggle("link-dim", hasActive && !isMatch);
    });

    activators.forEach((button) => {
      const tags = parseTags(button.dataset.linkActivate);
      button.classList.toggle("link-match", hasActive && sameTags(tags, activeTags));
    });

    if (activeFilter && activeLabel) {
      activeFilter.classList.toggle("visible", hasActive);
      activeLabel.textContent = hasActive ? activeText : "None";
    }

    if (highlightOnlyWrap && highlightOnlyToggle) {
      highlightOnlyWrap.classList.toggle("disabled", !hasActive);
      highlightOnlyToggle.disabled = !hasActive;
      if (!hasActive) highlightOnlyToggle.checked = false;
    }

    updateJumpLinks();
  }

  function clearHighlight() {
    activeTags = [];
    activeText = "";
    activePrimaryTag = "";
    updateHighlightState();
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.modeTarget));
  });

  activators.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const nextTags = parseTags(button.dataset.linkActivate);
      if (sameTags(nextTags, activeTags)) {
        clearHighlight();
        return;
      }
      activeTags = nextTags;
      activeText = button.dataset.linkLabel || button.textContent || "selection";
      activePrimaryTag = nextTags[0] || "";
      updateHighlightState();
    });
  });

  clearFilterButton?.addEventListener("click", clearHighlight);
  highlightOnlyToggle?.addEventListener("change", updateHighlightState);

  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    searchable.forEach((node) => {
      const haystack = (node.getAttribute("data-search") || node.textContent || "").toLowerCase();
      node.classList.toggle("search-hidden", !!query && !haystack.includes(query));
    });
  });
`;

function renderArchitectureSvg() {
  return `
    <svg viewBox="0 0 1000 520" role="img" aria-label="Autobazar123 architecture overview diagram">
      <defs>
        <linearGradient id="card-fill" x1="0" x2="1"><stop offset="0%" stop-color="#f6fbf9" /><stop offset="100%" stop-color="#eef6f3" /></linearGradient>
        <linearGradient id="accent-fill" x1="0" x2="1"><stop offset="0%" stop-color="#c4efe3" /><stop offset="100%" stop-color="#9adfc8" /></linearGradient>
      </defs>
      <rect x="40" y="40" width="180" height="80" rx="18" fill="url(#accent-fill)" stroke="#2f6d5f" stroke-width="2"/>
      <text x="130" y="78" text-anchor="middle" class="diagram-title">Browser</text>
      <text x="130" y="102" text-anchor="middle" class="diagram-copy">guest, user, dealer, admin</text>
      <rect x="290" y="40" width="230" height="96" rx="18" fill="url(#card-fill)" stroke="#2f6d5f" stroke-width="2"/>
      <text x="405" y="74" text-anchor="middle" class="diagram-title">Next.js App</text>
      <text x="405" y="98" text-anchor="middle" class="diagram-copy">pages, layouts, React UI</text>
      <text x="405" y="118" text-anchor="middle" class="diagram-copy">route handlers, proxy, metadata</text>
      <rect x="590" y="40" width="180" height="80" rx="18" fill="url(#card-fill)" stroke="#2f6d5f" stroke-width="2"/>
      <text x="680" y="78" text-anchor="middle" class="diagram-title">API routes</text>
      <text x="680" y="102" text-anchor="middle" class="diagram-copy">payments, auth, search, cron</text>
      <rect x="810" y="40" width="150" height="80" rx="18" fill="url(#card-fill)" stroke="#2f6d5f" stroke-width="2"/>
      <text x="885" y="78" text-anchor="middle" class="diagram-title">Vercel</text>
      <text x="885" y="102" text-anchor="middle" class="diagram-copy">hosting + cron</text>
      <rect x="120" y="210" width="180" height="88" rx="18" fill="url(#card-fill)" stroke="#7a4d21" stroke-width="2"/>
      <text x="210" y="246" text-anchor="middle" class="diagram-title">Supabase</text>
      <text x="210" y="270" text-anchor="middle" class="diagram-copy">auth, DB, RLS, RPCs</text>
      <rect x="330" y="210" width="160" height="88" rx="18" fill="url(#card-fill)" stroke="#7a4d21" stroke-width="2"/>
      <text x="410" y="246" text-anchor="middle" class="diagram-title">Algolia</text>
      <text x="410" y="270" text-anchor="middle" class="diagram-copy">search index</text>
      <rect x="520" y="210" width="160" height="88" rx="18" fill="url(#card-fill)" stroke="#7a4d21" stroke-width="2"/>
      <text x="600" y="246" text-anchor="middle" class="diagram-title">Stripe</text>
      <text x="600" y="270" text-anchor="middle" class="diagram-copy">checkout + webhook</text>
      <rect x="710" y="210" width="160" height="88" rx="18" fill="url(#card-fill)" stroke="#7a4d21" stroke-width="2"/>
      <text x="790" y="246" text-anchor="middle" class="diagram-title">Resend</text>
      <text x="790" y="270" text-anchor="middle" class="diagram-copy">transactional email</text>
      <rect x="210" y="360" width="170" height="88" rx="18" fill="url(#card-fill)" stroke="#7a4d21" stroke-width="2"/>
      <text x="295" y="396" text-anchor="middle" class="diagram-title">Cloudflare Images</text>
      <text x="295" y="420" text-anchor="middle" class="diagram-copy">photo upload + delivery</text>
      <rect x="430" y="360" width="170" height="88" rx="18" fill="url(#card-fill)" stroke="#7a4d21" stroke-width="2"/>
      <text x="515" y="396" text-anchor="middle" class="diagram-title">Upstash Redis</text>
      <text x="515" y="420" text-anchor="middle" class="diagram-copy">rate limiting</text>
      <rect x="650" y="360" width="170" height="88" rx="18" fill="url(#card-fill)" stroke="#7a4d21" stroke-width="2"/>
      <text x="735" y="396" text-anchor="middle" class="diagram-title">GA4 / PostHog</text>
      <text x="735" y="420" text-anchor="middle" class="diagram-copy">optional analytics</text>
      <g stroke="#3c5b56" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M220 80 H290" /><path d="M520 84 H590" /><path d="M770 80 H810" />
        <path d="M405 136 V180 H210 V210" /><path d="M405 136 V180 H410 V210" />
        <path d="M405 136 V180 H600 V210" /><path d="M680 120 V170 H790 V210" />
        <path d="M405 136 V180 H295 V360" /><path d="M680 120 V170 H515 V360" />
        <path d="M405 136 V180 H735 V360" />
      </g>
    </svg>
  `;
}

function renderHero(data, generatedAt) {
  return `
    <section class="hero" id="start-here">
      <p class="eyebrow">Autobazar123</p>
      <h2>Complete Autobazar123 Project Overview</h2>
      <p>${escapeHtml(PRODUCT_SUMMARY)}</p>
      <div class="toolbar">
        <input id="atlas-search" type="search" placeholder="Search routes, files, tests, services, tables..." aria-label="Search atlas" />
        <div class="mode-group" role="group" aria-label="Reading mode">
          <button type="button" class="mode-button active" data-mode-target="simple">Simple</button>
          <button type="button" class="mode-button" data-mode-target="technical">Technical</button>
          <button type="button" class="mode-button" data-mode-target="debug">Debug</button>
        </div>
        <label id="atlas-highlight-only-wrap" class="show-only-toggle disabled">
          <input id="atlas-highlight-only" type="checkbox" disabled />
          <span>Show only highlighted</span>
        </label>
        <div id="atlas-active-filter" class="active-filter" aria-live="polite">
          <span>Highlighting <strong id="atlas-active-label">None</strong></span>
          <div id="atlas-active-links" class="active-filter-links"></div>
          <button type="button" id="atlas-clear-filter">Clear</button>
        </div>
      </div>
      <div class="hero-legend" aria-label="Atlas item legend">
        <span class="hero-legend-label">Highlight types:</span>
        ${LEGEND_ITEMS.map(([label, className]) => `<span class="legend-item ${className}">${escapeHtml(label)}</span>`).join("")}
      </div>
      <div class="stats">
        <div class="stat"><strong>${data.stats.pageRoutes}</strong><span>Page routes</span></div>
        <div class="stat"><strong>${data.stats.handlerRoutes}</strong><span>Route handlers / API endpoints</span></div>
        <div class="stat"><strong>${data.stats.tests}</strong><span>Test files and suites</span></div>
        <div class="stat"><strong>${data.stats.tables}</strong><span>Database tables</span></div>
        <div class="stat"><strong>${data.stats.migrations}</strong><span>Migrations</span></div>
        <div class="stat"><strong>${data.stats.fallbacks}</strong><span>Tracked fallbacks</span></div>
      </div>
      <p style="margin-top:18px;color:var(--ink-soft)">Generated from the repo on ${escapeHtml(generatedAt)}</p>
    </section>
  `;
}

function renderReadingSection() {
  return `
    <section data-searchable="true" data-search="reading order product overview">
      <div class="section-header">
        <div>
          <h2>How To Read This</h2>
          <p>The atlas is layered so you can start simple and drill into code, services, and tests only when needed.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">
        ${READING_ORDER.map(
          (item, index) => `
            <article class="card">
              <h3>${index + 1}. ${escapeHtml(item.split(" if ")[0])}</h3>
              <p>${escapeHtml(item)}</p>
            </article>
          `,
        ).join("")}
      </div>
      <div class="note only-debug" style="margin-top:16px">Search filters the atlas items themselves. Use Debug mode when you want the full test, failure, and change-impact detail.</div>
    </section>
  `;
}

function renderRolesSection() {
  return `
    <section data-searchable="true" data-search="roles users guest dealer admin">
      <div class="section-header">
        <div>
          <h2>Product And Roles</h2>
          <p>The easiest mental model is to understand who uses the app and what each role can actually do.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">
        ${ROLES.map(
          (role) => `
            <article class="card" data-searchable="true" data-search="${escapeHtml(
              `${role.title} ${role.summary} ${role.routes.join(" ")}`,
            )}">
              <h3>${escapeHtml(role.title)}</h3>
              <p>${escapeHtml(role.summary)}</p>
              <div class="chips">${renderBadges(role.routes)}</div>
            </article>
          `,
        ).join("")}
      </div>
    </section>
  `;
}

function renderGlossarySection() {
  return `
    <section id="glossary">
      <div class="section-header">
        <div>
          <h2>Glossary</h2>
          <p>Short definitions for the terms that keep appearing in the codebase and docs.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">
        ${GLOSSARY.map(
          ([term, description]) => `
            <article class="card" data-searchable="true" data-search="${escapeHtml(`${term} ${description}`)}">
              <h3>${escapeHtml(term)}</h3>
              <p>${escapeHtml(description)}</p>
            </article>
          `,
        ).join("")}
      </div>
    </section>
  `;
}

function renderArchitectureSection() {
  return `
    <section id="architecture">
      <div class="section-header">
        <div>
          <h2>Architecture</h2>
          <p>The app is a Next.js front end and server layer sitting in front of several specialized services. Supabase is the core system of record. Algolia, Stripe, Resend, Cloudflare Images, Upstash, and optional analytics branch off from there.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="panel">${renderArchitectureSvg()}</div>
      <div class="card-grid" style="margin-top:18px">
        <article class="card"><h3>Simple view</h3><p>The browser talks to the Next.js app. The app renders pages, serves API routes, and coordinates with Supabase for data and auth. Search, payments, emails, media, rate limiting, and analytics are delegated to separate services.</p></article>
        <article class="card only-technical"><h3>Technical view</h3><p>Most business logic sits under <code>src/lib</code>, while page shells and route handlers live in <code>src/app</code>. Cron jobs are just protected route handlers triggered by Vercel.</p></article>
        <article class="card only-debug"><h3>Debug view</h3><p>When something breaks, the fastest split is: rendering issue, service issue, database or RLS issue, or background job issue.</p></article>
      </div>
    </section>
  `;
}

function renderJourneysSection() {
  return `
    <section id="journeys">
      <div class="section-header">
        <div>
          <h2>Journey Maps</h2>
          <p>These are the main user stories. Each one shows how a real action crosses routes, services, and tests.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      ${JOURNEYS.map(
        (journey) => `
          <details open data-searchable="true" data-search="${escapeHtml(
            `${journey.title} ${journey.audience} ${journey.steps.join(" ")} ${journey.routes.join(" ")} ${journey.services.join(" ")} ${journey.tests.join(" ")}`,
          )}">
            <summary>
              <h3>${escapeHtml(journey.title)}</h3>
              <span class="badge">${escapeHtml(journey.audience)}</span>
              ${renderTruthyBadge(journey.confidence)}
            </summary>
            <div class="details-body">
              <div class="step-list">${journey.steps.map((step) => `<div class="step-item">${escapeHtml(step)}</div>`).join("")}</div>
              <div class="two-col only-technical" style="margin-top:18px">
                <div class="card"><h3>Routes and handlers</h3><div>${renderInlineCodeList(journey.routes)}</div></div>
                <div class="card"><h3>Services and tests</h3><p><strong>Services:</strong> ${escapeHtml(journey.services.join(", "))}</p>${renderList(journey.tests)}</div>
              </div>
            </div>
          </details>
        `,
      ).join("")}
    </section>
  `;
}

function renderFeaturesSection(data) {
  return `
    <section id="features">
      <div class="section-header">
        <div>
          <h2>Feature Atlas</h2>
          <p>Each feature block ties together user purpose, UI files, server files, data, services, and the tests that protect it.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      ${FEATURE_ATLAS.map(
        (feature) => {
          const featureTags = data.linkModel.featureTagMap.get(feature.id) ?? [];
          return `
          <details${renderLinkAttrs(featureTags)} data-searchable="true" data-search="${escapeHtml(
            `${feature.title} ${feature.summary} ${feature.routes.join(" ")} ${feature.components.join(" ")} ${feature.server.join(" ")} ${feature.data.join(" ")} ${feature.services.join(" ")} ${feature.tests.join(" ")} ${feature.risk}`,
          )}">
            <summary><h3>${escapeHtml(feature.title)}</h3>${renderTruthyBadge(feature.confidence)}</summary>
            <div class="details-body">
              <p>${escapeHtml(feature.summary)}</p>
              <div class="card-grid" style="margin-top:14px">
                <article class="card"><h3>Routes</h3><div>${renderLinkedCodeList(feature.routes, (value) => data.linkModel.routeTagMap.get(value) ?? [routeEntity(value)])}</div></article>
                <article class="card only-technical"><h3>UI files</h3>${renderList(feature.components)}</article>
                <article class="card only-technical"><h3>Server and domain files</h3>${renderList(feature.server)}</article>
                <article class="card"><h3>Services and data</h3><div class="chips">${renderLinkedBadges(feature.services, (value) => data.linkModel.serviceTagMap.get(value) ?? [serviceEntity(value)])}</div><div style="margin-top:12px">${renderLinkedCodeList(feature.data, (value) => data.linkModel.tableTagMap.get(value) ?? [tableEntity(value)])}</div></article>
                <article class="card only-debug"><h3>Tests</h3><div>${renderLinkedCodeList(feature.tests, (value) => data.linkModel.testTagMap.get(value) ?? [testEntity(value)])}</div></article>
                <article class="card only-debug"><h3>Risk</h3><p>${escapeHtml(feature.risk)}</p></article>
              </div>
            </div>
          </details>
        `;
        },
      ).join("")}
    </section>
  `;
}

function renderCoverageSection(data) {
  return `
    <section id="coverage-matrix">
      <div class="section-header">
        <div>
          <h2>Coverage Matrix</h2>
          <p>One row per major feature, showing its main system surfaces and the current curated coverage gap level.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      <div class="table-wrap"><table><thead><tr><th>Feature</th><th>Main routes</th><th>Services</th><th>Core tables</th><th class="only-debug">Direct tests</th><th>Gap level</th><th>Gap note</th></tr></thead><tbody>
        ${FEATURE_ATLAS.map((feature) => {
          const featureTags = data.linkModel.featureTagMap.get(feature.id) ?? [];
          return `
            <tr${renderLinkAttrs(featureTags)} data-searchable="true" data-search="${escapeHtml(`${feature.title} ${feature.routes.join(" ")} ${feature.services.join(" ")} ${feature.data.join(" ")} ${feature.tests.join(" ")} ${feature.gapLevel} ${feature.gapNote}`)}">
              <td>${renderAtlasLink(feature.title, featureTags, "atlas-link title-link")}</td>
              <td>${renderLinkedCodeList(feature.routes, (value) => data.linkModel.routeTagMap.get(value) ?? [routeEntity(value)])}</td>
              <td><div class="chips">${renderLinkedBadges(feature.services, (value) => data.linkModel.serviceTagMap.get(value) ?? [serviceEntity(value)])}</div></td>
              <td>${renderLinkedCodeList(feature.data, (value) => data.linkModel.tableTagMap.get(value) ?? [tableEntity(value)])}</td>
              <td class="only-debug">${renderLinkedCodeList(feature.tests, (value) => data.linkModel.testTagMap.get(value) ?? [testEntity(value)])}</td>
              <td><span class="badge warm">${escapeHtml(feature.gapLevel)}</span></td>
              <td>${escapeHtml(feature.gapNote)}</td>
            </tr>
          `;
        }).join("")}
      </tbody></table></div>
    </section>
  `;
}

function renderChangeGuidesSection(data) {
  return `
    <section id="change-guides">
      <div class="section-header">
        <div>
          <h2>Change Guides</h2>
          <p>Fast starting points for the main work areas that tend to span multiple files, services, and tests.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">
        ${CHANGE_GUIDES.map((guide) => {
          const guideTags = data.linkModel.guideTagMap.get(guide.id) ?? [];
          return `
            <article class="card"${renderLinkAttrs(guideTags)} data-searchable="true" data-search="${escapeHtml(`${guide.title} ${guide.whatChanges} ${guide.startHere.join(" ")} ${guide.routes.join(" ")} ${guide.services.join(" ")} ${guide.tables.join(" ")} ${guide.tests.join(" ")} ${guide.risk}`)}">
              <h3>${renderAtlasLink(guide.title, guideTags, "atlas-link title-link")}</h3>
              <p>${escapeHtml(guide.whatChanges)}</p>
              <div class="mini-grid">
                <div><strong>Start here:</strong>${renderList(guide.startHere)}</div>
                <div><strong>Main routes:</strong><div>${renderLinkedCodeList(guide.routes, (value) => data.linkModel.routeTagMap.get(value) ?? [routeEntity(value)])}</div></div>
                <div><strong>Services:</strong><div class="chips">${renderLinkedBadges(guide.services, (value) => data.linkModel.serviceTagMap.get(value) ?? [serviceEntity(value)])}</div></div>
                <div><strong>Tests to run first:</strong><div>${renderLinkedCodeList(guide.tests, (value) => data.linkModel.testTagMap.get(value) ?? [testEntity(value)])}</div></div>
                <div class="only-technical"><strong>Core tables:</strong><div>${renderLinkedCodeList(guide.tables, (value) => data.linkModel.tableTagMap.get(value) ?? [tableEntity(value)])}</div></div>
                <div><strong>Common risk:</strong> ${escapeHtml(guide.risk)}</div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderRoutesSection(data) {
  return `
    <section id="routes">
      <div class="section-header">
        <div>
          <h2>Route Map</h2>
          <p>Every page route and route handler discovered in <code>src/app</code>.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      <div class="card-grid only-debug" style="margin-bottom:18px">
        <div class="panel"><h3>Page routes by area</h3>${renderMeterRows(data.pageRouteCounts)}</div>
        <div class="panel"><h3>Handlers by area</h3>${renderMeterRows(data.handlerRouteCounts)}</div>
      </div>
      <div class="panel">
        <h3>Page Routes</h3>
        <div class="table-wrap"><table><thead><tr><th>Route</th><th>Area</th><th>Purpose</th><th class="only-technical">Source</th></tr></thead><tbody>
          ${data.routes.pageRoutes
            .map(
              (route) => `
                <tr${renderLinkAttrs(data.linkModel.routeTagMap.get(route.routePath) ?? [routeEntity(route.routePath)])} data-searchable="true" data-search="${escapeHtml(`${route.routePath} ${route.area} ${route.summary} ${route.relativePath}`)}">
                  <td>${renderAtlasLink(route.routePath, data.linkModel.routeTagMap.get(route.routePath) ?? [routeEntity(route.routePath)], "atlas-link code-link")}</td><td>${escapeHtml(route.area)}</td><td>${escapeHtml(route.summary)}</td><td class="only-technical"><code>${escapeHtml(route.relativePath)}</code></td>
                </tr>`,
            )
            .join("")}
        </tbody></table></div>
      </div>
      <div class="panel" style="margin-top:18px">
        <h3>Route Handlers And API Endpoints</h3>
        <div class="table-wrap"><table><thead><tr><th>Route</th><th>Area</th><th>Purpose</th><th class="only-technical">Source</th></tr></thead><tbody>
          ${data.routes.handlerRoutes
            .map(
              (route) => `
                <tr${renderLinkAttrs(data.linkModel.routeTagMap.get(route.routePath) ?? [routeEntity(route.routePath)])} data-searchable="true" data-search="${escapeHtml(`${route.routePath} ${route.area} ${route.summary} ${route.relativePath}`)}">
                  <td>${renderAtlasLink(route.routePath, data.linkModel.routeTagMap.get(route.routePath) ?? [routeEntity(route.routePath)], "atlas-link code-link")}</td><td>${escapeHtml(route.area)}</td><td>${escapeHtml(route.summary)}</td><td class="only-technical"><code>${escapeHtml(route.relativePath)}</code></td>
                </tr>`,
            )
            .join("")}
        </tbody></table></div>
      </div>
    </section>
  `;
}

function renderDatabaseSvg() {
  return `
    <svg viewBox="0 0 920 470" role="img" aria-label="Autobazar123 database relationships overview">
      <defs>
        <linearGradient id="db-fill" x1="0" x2="1"><stop offset="0%" stop-color="#f7fbf9" /><stop offset="100%" stop-color="#eef6f2" /></linearGradient>
      </defs>
      <g fill="url(#db-fill)" stroke="#2f6d5f" stroke-width="2">
        <rect x="40" y="40" width="200" height="72" rx="18" />
        <rect x="320" y="40" width="200" height="72" rx="18" />
        <rect x="600" y="40" width="220" height="72" rx="18" />
        <rect x="40" y="190" width="200" height="72" rx="18" />
        <rect x="320" y="190" width="200" height="72" rx="18" />
        <rect x="600" y="190" width="220" height="72" rx="18" />
        <rect x="40" y="340" width="200" height="72" rx="18" />
        <rect x="320" y="340" width="200" height="72" rx="18" />
        <rect x="600" y="340" width="220" height="72" rx="18" />
      </g>
      <g class="diagram-title" text-anchor="middle">
        <text x="140" y="82">profiles</text>
        <text x="420" y="82">dealers</text>
        <text x="710" y="82">ads</text>
        <text x="140" y="232">inquiries</text>
        <text x="420" y="232">saved_searches</text>
        <text x="710" y="232">credit_transactions</text>
        <text x="140" y="382">listing_reports</text>
        <text x="420" y="382">email_jobs</text>
        <text x="710" y="382">stripe_webhook_logs</text>
      </g>
      <g class="diagram-copy" text-anchor="middle">
        <text x="140" y="102">account anchor</text>
        <text x="420" y="102">seller identity</text>
        <text x="710" y="102">marketplace core</text>
        <text x="140" y="252">buyer-seller messages</text>
        <text x="420" y="252">alert intent</text>
        <text x="710" y="252">credit history</text>
        <text x="140" y="402">moderation input</text>
        <text x="420" y="402">queued email work</text>
        <text x="710" y="402">payment audit trail</text>
      </g>
      <g stroke="#4a665f" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M240 76 H320" />
        <path d="M520 76 H600" />
        <path d="M140 112 V190" />
        <path d="M710 112 V190" />
        <path d="M240 226 H320" />
        <path d="M520 226 H600" />
        <path d="M140 262 V340" />
        <path d="M420 262 V340" />
        <path d="M710 262 V340" />
        <path d="M240 76 C280 76 280 226 320 226" />
        <path d="M520 76 C560 76 560 226 600 226" />
        <path d="M240 226 C280 226 280 382 320 382" />
      </g>
    </svg>
  `;
}

function renderApiMapSection(data) {
  return `
    <section id="api-map">
      <div class="section-header">
        <div>
          <h2>API Map</h2>
          <p>This is the server action map for <code>/api/*</code>: methods, auth boundary, service usage, touched tables, and any direct route-adjacent tests.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      <div class="card-grid only-debug" style="margin-bottom:18px">
        <div class="panel"><h3>Endpoints by boundary</h3>${renderMeterRows(data.apiBoundaryCounts)}</div>
        <div class="panel"><h3>Services touched by API routes</h3>${renderMeterRows(data.apiServiceCounts)}</div>
      </div>
      <div class="note">This section is derived from the actual route files under <code>src/app/api</code>, not manually listed.</div>
      <div class="panel" style="margin-top:18px">
        <div class="table-wrap"><table><thead><tr><th>Route</th><th>Methods</th><th>Boundary</th><th>Purpose</th><th class="only-technical">Tables / RPCs</th><th class="only-technical">Writes</th><th>Services</th><th class="only-debug">Direct tests</th></tr></thead><tbody>
          ${data.apiDetails
            .map(
              (detail) => `
                <tr${renderLinkAttrs(data.linkModel.routeTagMap.get(detail.routePath) ?? [routeEntity(detail.routePath)])} data-searchable="true" data-search="${escapeHtml(`${detail.routePath} ${detail.summary} ${detail.boundary} ${detail.methods.join(" ")} ${detail.services.join(" ")} ${detail.touchedTables.join(" ")} ${detail.writeTables.join(" ")} ${detail.touchedRpcs.join(" ")} ${detail.linkedTests.join(" ")} ${detail.relativePath}`)}">
                  <td>${renderAtlasLink(detail.routePath, data.linkModel.routeTagMap.get(detail.routePath) ?? [routeEntity(detail.routePath)], "atlas-link code-link")}<div class="only-technical" style="margin-top:8px;color:var(--ink-soft)"><code>${escapeHtml(detail.relativePath)}</code></div></td>
                  <td>${renderBadgesOrDash(detail.methods, "badge warm")}</td>
                  <td>${escapeHtml(detail.boundary)}</td>
                  <td>${escapeHtml(detail.summary)}</td>
                  <td class="only-technical"><div>${renderLinkedCodeList(detail.touchedTables, (value) => data.linkModel.tableTagMap.get(value) ?? [tableEntity(value)])}</div><div style="margin-top:8px">${renderInlineCodeListOrDash(detail.touchedRpcs)}</div></td>
                  <td class="only-technical">${renderLinkedCodeList(detail.writeTables, (value) => data.linkModel.tableTagMap.get(value) ?? [tableEntity(value)])}</td>
                  <td><div class="chips">${renderLinkedBadges(detail.services, (value) => data.linkModel.serviceTagMap.get(value) ?? [serviceEntity(value)])}</div></td>
                  <td class="only-debug">${renderLinkedCodeList(detail.linkedTests.slice(0, 6), (value) => data.linkModel.testTagMap.get(value) ?? [testEntity(value)])}</td>
                </tr>`,
            )
            .join("")}
        </tbody></table></div>
      </div>
    </section>
  `;
}

function renderDatabaseFlowsSection(data) {
  const primaryUsage = data.tableUsage.filter((item) =>
    DB_RELATIONSHIPS.some((relationship) => relationship.table === item.tableName),
  );

  return `
    <section id="database-flows">
      <div class="section-header">
        <div>
          <h2>Database Relationships And Write Map</h2>
          <p>This is the business-level data graph: which tables are central, how they relate, and which API routes read or write them.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      <div class="panel">${renderDatabaseSvg()}</div>
      <div class="card-grid" style="margin-top:18px">
        ${DB_RELATIONSHIPS.map(
          (item) => `
            <article class="card"${renderLinkAttrs(data.linkModel.tableTagMap.get(item.table) ?? [tableEntity(item.table)])} data-searchable="true" data-search="${escapeHtml(`${item.table} ${item.related.join(" ")} ${item.story}`)}">
              <div class="chips">${renderTruthyBadge(item.truth)}</div>
              <h3 style="margin-top:12px">${renderAtlasLink(item.table, data.linkModel.tableTagMap.get(item.table) ?? [tableEntity(item.table)], "atlas-link code-link")}</h3>
              <p>${escapeHtml(item.story)}</p>
              <div class="chips only-technical">${renderLinkedBadges(item.related, (value) => data.linkModel.tableTagMap.get(value) ?? [tableEntity(value)])}</div>
            </article>`,
        ).join("")}
      </div>
      <div class="panel only-debug" style="margin-top:18px">
        <h3>API read and write map for core tables</h3>
        <div class="table-wrap"><table><thead><tr><th>Table</th><th>Feature areas</th><th>Related tables</th><th>Written by API routes</th><th>Read by API routes</th></tr></thead><tbody>
          ${primaryUsage
            .map(
              (item) => `
                <tr${renderLinkAttrs(data.linkModel.tableTagMap.get(item.tableName) ?? [tableEntity(item.tableName)])} data-searchable="true" data-search="${escapeHtml(`${item.tableName} ${item.features.join(" ")} ${item.related.join(" ")} ${item.writers.join(" ")} ${item.readers.join(" ")} ${item.rpcs.join(" ")}`)}">
                  <td>${renderAtlasLink(item.tableName, data.linkModel.tableTagMap.get(item.tableName) ?? [tableEntity(item.tableName)], "atlas-link code-link")}</td>
                  <td>${renderLinkedBadges(item.features, (value) => {
                    const featureId = FEATURE_ATLAS.find((feature) => feature.title === value)?.id ?? slugify(value);
                    return data.linkModel.featureTagMap.get(featureId) ?? [featureEntity(featureId)];
                  }, "atlas-link badge-link")}</td>
                  <td>${renderLinkedCodeList(item.related, (value) => data.linkModel.tableTagMap.get(value) ?? [tableEntity(value)])}</td>
                  <td>${renderLinkedCodeList(item.writers, (value) => data.linkModel.routeTagMap.get(value) ?? [routeEntity(value)])}</td>
                  <td>${renderLinkedCodeList(item.readers, (value) => data.linkModel.routeTagMap.get(value) ?? [routeEntity(value)])}</td>
                </tr>`,
            )
            .join("")}
        </tbody></table></div>
      </div>
    </section>
  `;
}

function renderExternalSetupSection() {
  return `
    <section id="external-systems">
      <div class="section-header">
        <div>
          <h2>External Systems And Out-Of-Repo Setup</h2>
          <p>This is where Git stops being the whole truth. These systems are required at runtime, but part of their setup lives in dashboards, DNS, or provider consoles.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">
        ${EXTERNAL_SETUP_ATLAS.map(
          (item) => `
            <article class="card" data-searchable="true" data-search="${escapeHtml(`${item.name} ${item.livesIn} ${item.neededFor} ${item.outsideRepo.join(" ")} ${item.env.join(" ")}`)}">
              <div class="chips"><span class="badge warm">${escapeHtml(item.livesIn)}</span>${renderTruthyBadge(item.truth)}</div>
              <h3 style="margin-top:12px">${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.neededFor)}</p>
              <div class="only-technical mini-grid">
                <div><strong>Outside repo:</strong>${renderList(item.outsideRepo)}</div>
                <div><strong>Env vars:</strong><div class="chips">${renderBadgesOrDash(item.env, "badge")}</div></div>
              </div>
            </article>`,
        ).join("")}
      </div>
    </section>
  `;
}

function renderLifecycleSection(data) {
  return `
    <section id="lifecycles">
      <div class="section-header">
        <div>
          <h2>State Lifecycles</h2>
          <p>These mini-maps show how important things move through the system over time, not just where the code lives.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      ${STATE_LIFECYCLES.map((flow) => {
        const flowTags = unique([
          ...flow.routes.map((value) => data.linkModel.routeTagMap.get(value)?.join("|") ?? routeEntity(value)),
          ...flow.tables.map((value) => data.linkModel.tableTagMap.get(value)?.join("|") ?? tableEntity(value)),
          ...flow.tests.map((value) => data.linkModel.testTagMap.get(value)?.join("|") ?? testEntity(value)),
        ])
          .flatMap((value) => String(value).split("|"))
          .filter(Boolean);
        return `
          <details${renderLinkAttrs(flowTags)} data-searchable="true" data-search="${escapeHtml(`${flow.title} ${flow.summary} ${flow.stages.join(" ")} ${flow.routes.join(" ")} ${flow.tables.join(" ")} ${flow.tests.join(" ")}`)}">
            <summary><h3>${escapeHtml(flow.title)}</h3>${renderTruthyBadge(flow.truth)}</summary>
            <div class="details-body">
              <p>${escapeHtml(flow.summary)}</p>
              <div class="sequence">
                ${flow.stages
                  .map(
                    (stage, index) => `
                      <span class="step-pill">${escapeHtml(stage)}</span>${index < flow.stages.length - 1 ? '<span class="arrow">→</span>' : ""}`,
                  )
                  .join("")}
              </div>
              <div class="card-grid only-technical" style="margin-top:16px">
                <article class="card"><h3>Routes</h3><div>${renderLinkedCodeList(flow.routes, (value) => data.linkModel.routeTagMap.get(value) ?? [routeEntity(value)])}</div></article>
                <article class="card"><h3>Tables</h3><div>${renderLinkedCodeList(flow.tables, (value) => data.linkModel.tableTagMap.get(value) ?? [tableEntity(value)])}</div></article>
                <article class="card only-debug"><h3>Tests</h3><div>${renderLinkedCodeList(flow.tests, (value) => data.linkModel.testTagMap.get(value) ?? [testEntity(value)])}</div></article>
              </div>
            </div>
          </details>`;
      }).join("")}
    </section>
  `;
}

function renderFragilitySection() {
  return `
    <section id="fragility">
      <div class="section-header">
        <div>
          <h2>Fragility And Test Gaps</h2>
          <p>This section separates two things: what already looks brittle, and what still looks under-proven.</p>
        </div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">
        ${FRAGILITY_AREAS.map(
          (item) => `
            <article class="card" data-searchable="true" data-search="${escapeHtml(`${item.title} ${item.summary} ${item.evidence} ${item.tests.join(" ")}`)}">
              <div class="chips">${renderTruthyBadge(item.truth)}</div>
              <h3 style="margin-top:12px">${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.summary)}</p>
              <p class="only-debug" style="margin-top:10px"><strong>Evidence:</strong> ${escapeHtml(item.evidence)}</p>
              <div class="only-debug"><strong>Tests:</strong>${renderList(item.tests)}</div>
            </article>`,
        ).join("")}
      </div>
      <div class="card-grid" style="margin-top:18px">
        ${TEST_GAPS.map(
          (item) => `
            <article class="card" data-searchable="true" data-search="${escapeHtml(`${item.area} ${item.summary} ${item.whyItMatters}`)}">
              <div class="chips">${renderTruthyBadge(item.truth)}</div>
              <h3 style="margin-top:12px">${escapeHtml(item.area)}</h3>
              <p>${escapeHtml(item.summary)}</p>
              <p style="margin-top:10px"><strong>Why it matters:</strong> ${escapeHtml(item.whyItMatters)}</p>
            </article>`,
        ).join("")}
      </div>
    </section>
  `;
}

function renderServicesSection(data) {
  return `
    <section id="services">
      <div class="section-header">
        <div><h2>Service Atlas</h2><p>This is the dependency map: why each service exists, where it is used, and what would hurt if it failed.</p></div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">
        ${SERVICE_ATLAS.map(
          (service) => `
            <article class="card"${renderLinkAttrs(data.linkModel.serviceTagMap.get(service.name) ?? [serviceEntity(service.name)])} data-searchable="true" data-search="${escapeHtml(`${service.name} ${service.category} ${service.why} ${service.usedBy} ${service.env.join(" ")} ${service.files.join(" ")} ${service.tests.join(" ")} ${service.risk}`)}">
              <div class="chips"><span class="badge">${escapeHtml(service.category)}</span>${renderTruthyBadge(service.truth)}</div>
              <h3 style="margin-top:12px">${renderAtlasLink(service.name, data.linkModel.serviceTagMap.get(service.name) ?? [serviceEntity(service.name)], "atlas-link title-link")}</h3>
              <p>${escapeHtml(service.why)}</p>
              <p style="margin-top:10px"><strong>Used by:</strong> ${escapeHtml(service.usedBy)}</p>
              <div class="only-technical"><p style="margin-top:10px"><strong>Env vars:</strong> ${escapeHtml(service.env.join(", "))}</p>${renderList(service.files)}</div>
              <div class="only-debug"><p style="margin-top:10px"><strong>Tests:</strong></p><div>${renderLinkedCodeList(service.tests, (value) => data.linkModel.testTagMap.get(value) ?? [testEntity(value)])}</div><p style="margin-top:10px"><strong>Failure impact:</strong> ${escapeHtml(service.risk)}</p></div>
            </article>`,
        ).join("")}
      </div>
    </section>
  `;
}

function renderDataSection(data) {
  return `
    <section id="data-model">
      <div class="section-header">
        <div><h2>Data Model</h2><p>These are the tables that form the main business vocabulary of the app.</p></div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      <div class="card-grid only-debug" style="margin-bottom:18px">
        <div class="panel"><h3>Database objects</h3><div class="meter-row"><div class="meter-label">Tables</div><div class="meter"><span style="width:100%"></span></div><div class="meter-count">${data.stats.tables}</div></div><div class="meter-row"><div class="meter-label">Functions / RPCs</div><div class="meter"><span style="width:${Math.max(20, (data.stats.functions / Math.max(data.stats.tables, 1)) * 100)}%"></span></div><div class="meter-count">${data.stats.functions}</div></div><div class="meter-row"><div class="meter-label">Policies</div><div class="meter"><span style="width:${Math.max(22, (data.stats.policies / Math.max(data.stats.tables, 1)) * 12)}%"></span></div><div class="meter-count">${data.stats.policies}</div></div></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Table</th><th>Meaning</th><th class="only-technical">First migration</th></tr></thead><tbody>
        ${data.database.tables
          .map(
            (table) => `
              <tr${renderLinkAttrs(data.linkModel.tableTagMap.get(table.tableName) ?? [tableEntity(table.tableName)])} data-searchable="true" data-search="${escapeHtml(`${table.tableName} ${DATA_ATLAS[table.tableName] ?? "supporting table"} ${table.source}`)}">
                <td>${renderAtlasLink(table.tableName, data.linkModel.tableTagMap.get(table.tableName) ?? [tableEntity(table.tableName)], "atlas-link code-link")}</td><td>${escapeHtml(DATA_ATLAS[table.tableName] ?? "Supporting table. Inspect source migration and feature references for exact usage.")}</td><td class="only-technical"><code>${escapeHtml(table.source)}</code></td>
              </tr>`,
          )
          .join("")}
      </tbody></table></div>
    </section>
  `;
}

function renderSecuritySection(data) {
  return `
    <section id="security">
      <div class="section-header">
        <div><h2>Security And Reliability</h2><p>The product is built around trust: correct auth, correct payments, correct listing visibility, and visible degraded-operation handling.</p></div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">${SECURITY_CONTROLS.map((control) => `<article class="card" data-searchable="true" data-search="${escapeHtml(`${control.title} ${control.text} ${control.files.join(" ")}`)}"><div class="chips">${renderTruthyBadge(control.truth)}</div><h3 style="margin-top:12px">${escapeHtml(control.title)}</h3><p>${escapeHtml(control.text)}</p><div class="only-technical">${renderList(control.files)}</div></article>`).join("")}</div>
      <div class="note only-debug" style="margin-top:18px">This atlas detected ${data.stats.fallbacks} registered fallback policies in <code>src/lib/fallbacks/registry.ts</code>.</div>
    </section>
  `;
}

function renderCronSection(data) {
  return `
    <section id="cron-jobs">
      <div class="section-header">
        <div><h2>Cron And Background Jobs</h2><p>Background work is implemented as protected API routes. Vercel Cron or internal ops triggers these routes with a shared secret.</p></div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      <div class="card-grid">
        ${data.cronRoutes.map((relativePath) => {
          const routePath = appRouteFromFile(relativePath);
          return `<article class="card"${renderLinkAttrs(data.linkModel.routeTagMap.get(routePath) ?? [routeEntity(routePath)])} data-searchable="true" data-search="${escapeHtml(`${routePath} ${relativePath}`)}"><h3>${renderAtlasLink(routePath, data.linkModel.routeTagMap.get(routePath) ?? [routeEntity(routePath)], "atlas-link code-link")}</h3><p>${escapeHtml(summarizeRoute(routePath, relativePath))}</p><p class="only-technical" style="margin-top:10px"><strong>Source:</strong> <code>${escapeHtml(relativePath)}</code></p></article>`;
        }).join("")}
      </div>
    </section>
  `;
}

function renderTestsSection(data) {
  return `
    <section id="tests">
      <div class="section-header">
        <div><h2>Test Atlas</h2><p>All discovered test suites, grouped by what layer they protect.</p></div>
        ${renderTruthyBadge("Confirmed from code")}
      </div>
      <div class="card-grid"><div class="panel"><h3>Tests by layer</h3>${renderMeterRows(data.testLayerCounts)}</div><div class="panel"><h3>Tests by feature area</h3>${renderMeterRows(data.testAreaCounts)}</div></div>
      <div class="panel" style="margin-top:18px">
        <h3>Every Test File And What It Protects</h3>
        <div class="table-wrap"><table><thead><tr><th>Test file</th><th>Layer</th><th>Area</th><th>What it does</th><th class="only-technical">Run with</th><th class="only-debug">Sample titles</th></tr></thead><tbody>
          ${data.tests
            .map(
              (test) => `
                <tr${renderLinkAttrs(data.linkModel.testTagMap.get(test.relativePath) ?? [testEntity(test.relativePath)])} data-searchable="true" data-search="${escapeHtml(`${test.relativePath} ${test.layer} ${test.area} ${test.summary} ${test.command} ${test.titles.join(" ")}`)}">
                  <td>${renderAtlasLink(test.relativePath, data.linkModel.testTagMap.get(test.relativePath) ?? [testEntity(test.relativePath)], "atlas-link code-link")}</td><td>${escapeHtml(test.layer)}</td><td>${escapeHtml(test.area)}</td><td>${escapeHtml(test.summary)}</td><td class="only-technical"><code>${escapeHtml(test.command)}</code></td><td class="only-debug">${escapeHtml(test.titles.slice(0, 6).join(" | ") || "See source")}</td>
                </tr>`,
            )
            .join("")}
        </tbody></table></div>
      </div>
    </section>
  `;
}

function renderRepoSections(data) {
  const importantCommands = COMMAND_ORDER.filter((command) => data.packageScripts[command]).map((command) => ({
    command,
    body: data.packageScripts[command],
  }));

  return `
    <section id="repo-map">
      <div class="section-header">
        <div><h2>Repo Map And Commands</h2><p>This is the codebase shape. The commands listed here are the most useful entry points for development and verification.</p></div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="two-col">
        <div class="card-grid">${REPO_SECTIONS.map(([folder, description]) => `<article class="card" data-searchable="true" data-search="${escapeHtml(`${folder} ${description}`)}"><h3><code>${escapeHtml(folder)}</code></h3><p>${escapeHtml(description)}</p></article>`).join("")}</div>
        <div class="card only-technical"><h3>Useful commands</h3><ul class="flat-list">${importantCommands.map(({ command, body }) => `<li><code>npm run ${escapeHtml(command)}</code> <span style="color:var(--ink-soft)">→ ${escapeHtml(body)}</span></li>`).join("")}</ul></div>
      </div>
      <div class="panel only-debug" style="margin-top:18px"><h3>Scripts Inventory</h3><div class="table-wrap"><table><thead><tr><th>Script</th><th>Category</th><th>Purpose</th></tr></thead><tbody>${data.scripts.map((script) => `<tr data-searchable="true" data-search="${escapeHtml(`${script.fileName} ${script.category} ${script.purpose}`)}"><td><code>${escapeHtml(script.fileName)}</code></td><td>${escapeHtml(script.category)}</td><td>${escapeHtml(script.purpose)}</td></tr>`).join("")}</tbody></table></div></div>
    </section>
  `;
}

function renderEnvSection() {
  return `
    <section id="env">
      <div class="section-header">
        <div><h2>Env And Deployment</h2><p>Env vars explain a lot of the invisible wiring. This view shows which services depend on external configuration and what part of the app they power.</p></div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">${SERVICE_ATLAS.filter((service) => service.env.length > 0).map((service) => `<article class="card" data-searchable="true" data-search="${escapeHtml(`${service.name} ${service.env.join(" ")} ${service.usedBy}`)}"><h3>${escapeHtml(service.name)}</h3><p>${escapeHtml(service.usedBy)}</p><div class="chips">${renderBadges(service.env, "badge warm")}</div></article>`).join("")}</div>
      <div class="note only-debug" style="margin-top:18px">Production deployment posture also depends on external systems that are not fully visible in Git: Vercel settings, Stripe dashboard setup, Supabase console config, and Resend domain verification.</div>
    </section>
  `;
}

function renderTroubleshootingSection() {
  return `
    <section id="troubleshooting">
      <div class="section-header">
        <div><h2>Troubleshooting Atlas</h2><p>If something breaks, use this as the fast map from symptom to likely subsystem, file area, and tests to run first.</p></div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">${TROUBLESHOOTING.map((item) => `<article class="card" data-searchable="true" data-search="${escapeHtml(`${item.title} ${item.check.join(" ")}`)}"><h3>${escapeHtml(item.title)}</h3>${renderList(item.check)}</article>`).join("")}</div>
    </section>
  `;
}

function renderChangeImpactSection() {
  return `
    <section id="change-impact">
      <div class="section-header">
        <div><h2>Change Impact Map</h2><p>This section shows how broad a change usually becomes once you touch a high-value part of the app.</p></div>
        ${renderTruthyBadge("Confirmed from code and docs")}
      </div>
      <div class="card-grid">${CHANGE_IMPACT.map((item) => `<article class="card" data-searchable="true" data-search="${escapeHtml(`${item.area} ${item.impact}`)}"><h3>${escapeHtml(item.area)}</h3><p>${escapeHtml(item.impact)}</p></article>`).join("")}</div>
    </section>
  `;
}

function renderKnownUnknownsSection() {
  return `
    <section id="known-unknowns">
      <div class="section-header">
        <div><h2>Known Unknowns</h2><p>This atlas is repo-backed, but not every production truth lives in Git.</p></div>
        ${renderTruthyBadge("Inferred / needs external verification")}
      </div>
      <div class="card-grid">${KNOWN_UNKNOWNS.map((item) => `<article class="card" data-searchable="true" data-search="${escapeHtml(item)}"><h3>External verification note</h3><p>${escapeHtml(item)}</p></article>`).join("")}</div>
    </section>
  `;
}

function buildHtml(data) {
  const generatedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Bratislava",
  }).format(new Date());

  return `<!doctype html><html lang="en" data-mode="simple"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Autobazar123 Project Overview</title><style>${PAGE_STYLE}</style></head><body><div class="layout"><aside class="sidebar"><h1>Autobazar123 Overview</h1><p>One long map of the Autobazar123 app, services, data, protections, tests, and operational surfaces.</p><small>Generated from repo on ${escapeHtml(generatedAt)}</small><nav>${SECTION_LINKS.map(([id, label]) => `<a href="#${id}"><span>${escapeHtml(label)}</span><span aria-hidden="true">→</span></a>`).join("")}</nav><small>Reading modes hide or reveal technical and debug-heavy blocks without changing the structure.</small></aside><main>${renderHero(data, generatedAt)}${renderReadingSection()}${renderRolesSection()}${renderGlossarySection()}${renderArchitectureSection()}${renderJourneysSection()}${renderFeaturesSection(data)}${renderCoverageSection(data)}${renderChangeGuidesSection(data)}${renderRoutesSection(data)}${renderApiMapSection(data)}${renderServicesSection(data)}${renderDatabaseFlowsSection(data)}${renderDataSection(data)}${renderSecuritySection(data)}${renderExternalSetupSection()}${renderLifecycleSection(data)}${renderCronSection(data)}${renderTestsSection(data)}${renderFragilitySection()}${renderRepoSections(data)}${renderEnvSection()}${renderTroubleshootingSection()}${renderChangeImpactSection()}${renderKnownUnknownsSection()}</main></div><script>${PAGE_SCRIPT}</script></body></html>`;
}

async function main() {
  const [routes, tests, scripts, database, fallbackCount] = await Promise.all([
    collectRoutes(),
    collectTests(),
    collectScripts(),
    collectDatabaseInventory(),
    collectFallbackCount(),
  ]);
  const apiDetails = await collectApiDetails(routes.handlerRoutes, tests);
  const tableUsage = collectTableUsage(database, apiDetails);
  const packageJson = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));
  const cronRoutes = routes.handlerRoutes
    .map((item) => item.relativePath)
    .filter((relativePath) => relativePath.startsWith("src/app/api/cron/"));
  const linkModel = buildLinkModel({
    routes,
    tests,
    apiDetails,
    tableUsage,
  });
  const data = {
    apiDetails,
    apiBoundaryCounts: countBy(apiDetails, "boundary"),
    apiServiceCounts: countValues(apiDetails.flatMap((detail) => detail.services)),
    linkModel,
    routes,
    tests,
    scripts,
    database,
    tableUsage,
    cronRoutes,
    packageScripts: packageJson.scripts ?? {},
    pageRouteCounts: countBy(routes.pageRoutes, "area"),
    handlerRouteCounts: countBy(routes.handlerRoutes, "area"),
    testLayerCounts: countBy(tests, "layer"),
    testAreaCounts: countBy(tests, "area"),
    stats: {
      pageRoutes: routes.pageRoutes.length,
      handlerRoutes: routes.handlerRoutes.length,
      tests: tests.length,
      tables: database.tables.length,
      functions: database.functions.length,
      migrations: database.migrations.length,
      policies: database.policyCount,
      fallbacks: fallbackCount,
    },
  };
  await fs.writeFile(outputPath, buildHtml(data), "utf8");
  process.stdout.write(`Generated ${rel(outputPath)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
