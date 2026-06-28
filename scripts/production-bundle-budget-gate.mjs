#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_POLICY_PATH = "config/production-bundle-budget-policy.json";
const require = createRequire(import.meta.url);

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  if (p <= 0) {
    return sorted[0];
  }
  if (p >= 100) {
    return sorted[sorted.length - 1];
  }

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return Math.round(sorted[lower]);
  }

  return Math.round(sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower));
}

export function summarizeRouteBundleStats(routeStats, { topRouteCount = 8 } = {}) {
  const routeRows = Array.isArray(routeStats) ? routeStats : [];
  const routeSummaries = routeRows
    .filter((row) => typeof row?.route === "string")
    .map((row) => ({
      route: row.route,
      firstLoadUncompressedJsBytes: isFiniteNumber(row.firstLoadUncompressedJsBytes)
        ? row.firstLoadUncompressedJsBytes
        : null,
      chunkCount: Array.isArray(row.firstLoadChunkPaths)
        ? row.firstLoadChunkPaths.length
        : 0,
    }))
    .filter((row) => isFiniteNumber(row.firstLoadUncompressedJsBytes));

  const values = routeSummaries.map((row) => row.firstLoadUncompressedJsBytes);
  const topRoutes = [...routeSummaries]
    .sort((a, b) => b.firstLoadUncompressedJsBytes - a.firstLoadUncompressedJsBytes)
    .slice(0, topRouteCount);

  return {
    routeCount: routeSummaries.length,
    maxFirstLoadUncompressedJsBytes: values.length > 0 ? Math.max(...values) : null,
    p95FirstLoadUncompressedJsBytes: percentile(values, 95),
    topRoutes,
  };
}

function collectStaticFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectStaticFiles(fullPath);
    }

    if (!entry.isFile() || !/\.(?:js|css)$/iu.test(entry.name)) {
      return [];
    }

    const stats = statSync(fullPath);
    return [{ path: fullPath, bytes: stats.size }];
  });
}

export function summarizeStaticAssets(staticRoot) {
  const files = collectStaticFiles(staticRoot);
  const totalStaticJsCssBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const largestFiles = [...files]
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8)
    .map((file) => ({
      path: file.path,
      bytes: file.bytes,
    }));

  return {
    fileCount: files.length,
    totalStaticJsCssBytes,
    largestFiles,
  };
}

function sumFileSizes(rootDir, relPaths, cache) {
  return relPaths.reduce((total, relPath) => {
    const cached = cache.get(relPath);
    if (cached !== undefined) {
      return total + cached;
    }

    try {
      const bytes = statSync(path.join(rootDir, relPath)).size;
      cache.set(relPath, bytes);
      return total + bytes;
    } catch {
      cache.set(relPath, 0);
      return total;
    }
  }, 0);
}

function toProjectRelativePaths(rootDir, distDir, relPaths) {
  return relPaths.map((relPath) => path.relative(rootDir, path.join(distDir, relPath)));
}

function normalizeAppRoute(appPath) {
  const withoutPage = appPath.replace(/\/page$/u, "");
  const segments = withoutPage
    .split("/")
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("(") && !segment.startsWith("@"));

  return segments.length > 0 ? `/${segments.join("/")}` : "/";
}

function readEntryJsFiles(distDir, pagePath, route) {
  const manifestPath = path.join(
    distDir,
    "server",
    "app",
    `${pagePath.replace(/^\/+/u, "")}_client-reference-manifest.js`,
  );

  if (!existsSync(manifestPath)) {
    return [];
  }

  const globalScope = globalThis;
  const previousManifest = globalScope.__RSC_MANIFEST;

  try {
    globalScope.__RSC_MANIFEST = undefined;
    delete require.cache[require.resolve(manifestPath)];
    require(manifestPath);
    const manifest = globalScope.__RSC_MANIFEST;
    const entry = manifest?.[pagePath] ?? manifest?.[route];
    return Object.values(entry?.entryJSFiles ?? {})
      .flatMap((files) => (Array.isArray(files) ? files : []))
      .filter((file) => typeof file === "string" && file.endsWith(".js"));
  } catch {
    return [];
  } finally {
    globalScope.__RSC_MANIFEST = previousManifest;
  }
}

export function collectRouteBundleStatsFromNextBuild({ rootDir = process.cwd() } = {}) {
  const distDir = path.join(rootDir, ".next");
  const buildManifestPath = path.join(distDir, "build-manifest.json");
  const appPathsManifestPath = path.join(distDir, "server", "app-paths-manifest.json");

  if (!existsSync(buildManifestPath) || !existsSync(appPathsManifestPath)) {
    return null;
  }

  const buildManifest = loadJson(buildManifestPath);
  const appPathsManifest = loadJson(appPathsManifestPath);
  const sharedJs = (buildManifest.rootMainFiles ?? []).filter((file) => file.endsWith(".js"));
  const cache = new Map();
  const rows = Object.keys(appPathsManifest)
    .filter((appPath) => appPath.endsWith("/page"))
    .map((pagePath) => {
      const route = normalizeAppRoute(pagePath);
      const entryJs = readEntryJsFiles(distDir, pagePath, route);
      const chunks = [...new Set([...entryJs, ...sharedJs])];

      return {
        route,
        firstLoadUncompressedJsBytes: sumFileSizes(distDir, chunks, cache),
        firstLoadChunkPaths: toProjectRelativePaths(rootDir, distDir, chunks),
      };
    })
    .filter((row) => row.firstLoadChunkPaths.length > 0);

  return rows.sort((a, b) => b.firstLoadUncompressedJsBytes - a.firstLoadUncompressedJsBytes);
}

export function evaluateProductionBundleBudget(policy, snapshot) {
  const budgets = policy?.budgets || {};
  const errors = [];
  const warnings = [];

  const checks = [
    "maxFirstLoadUncompressedJsBytes",
    "p95FirstLoadUncompressedJsBytes",
    "totalStaticJsCssBytes",
  ];

  for (const key of checks) {
    const limit = budgets[key];
    if (!isFiniteNumber(limit)) {
      warnings.push(`invalid or missing budget: ${key}`);
      continue;
    }

    const current = snapshot[key];
    if (!isFiniteNumber(current)) {
      errors.push(`missing production bundle metric: ${key}`);
      continue;
    }

    if (current > limit) {
      errors.push(`${key} exceeded budget (current=${current}, limit=${limit})`);
    }
  }

  if (isFiniteNumber(budgets.minRouteCount) && snapshot.routeCount < budgets.minRouteCount) {
    errors.push(
      `routeStats route count below expected minimum (current=${snapshot.routeCount}, min=${budgets.minRouteCount})`,
    );
  }

  return { errors, warnings };
}

export function buildProductionBundleSnapshot({
  routeStats,
  staticRoot,
  topRouteCount,
}) {
  const routeSummary = summarizeRouteBundleStats(routeStats, { topRouteCount });
  const staticSummary = summarizeStaticAssets(staticRoot);

  return {
    ...routeSummary,
    ...staticSummary,
  };
}

export function parseArgs(argv) {
  const args = {
    policy: DEFAULT_POLICY_PATH,
    root: process.cwd(),
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--policy" && argv[i + 1]) {
      args.policy = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--root" && argv[i + 1]) {
      args.root = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

export function runProductionBundleBudgetGate({
  policyPath = DEFAULT_POLICY_PATH,
  rootDir = process.cwd(),
} = {}) {
  const resolvedPolicyPath = path.resolve(rootDir, policyPath);
  if (!existsSync(resolvedPolicyPath)) {
    return {
      ok: false,
      exitCode: 1,
      errors: [`policy file missing (${policyPath})`],
      warnings: [],
      snapshot: null,
    };
  }

  const policy = loadJson(resolvedPolicyPath);
  const routeStatsPath = policy.routeStatsPath || ".next/diagnostics/route-bundle-stats.json";
  const staticRoot = policy.staticRoot || ".next/static";
  const resolvedRouteStatsPath = path.resolve(rootDir, routeStatsPath);
  const resolvedStaticRoot = path.resolve(rootDir, staticRoot);

  const warnings = [];
  let routeStats = null;

  if (existsSync(resolvedRouteStatsPath)) {
    routeStats = loadJson(resolvedRouteStatsPath);
  } else {
    routeStats = collectRouteBundleStatsFromNextBuild({ rootDir });
    if (routeStats?.length > 0) {
      warnings.push(
        `route stats file missing (${routeStatsPath}); derived stats from Next build manifests`,
      );
    }
  }

  if (!routeStats || routeStats.length === 0) {
    return {
      ok: false,
      exitCode: 1,
      errors: [
        `route bundle stats missing (${routeStatsPath}) and Next build manifests are unavailable; run npm run build first`,
      ],
      warnings: [],
      snapshot: null,
    };
  }

  const snapshot = buildProductionBundleSnapshot({
    routeStats,
    staticRoot: resolvedStaticRoot,
    topRouteCount: policy.topRouteCount,
  });
  const budgetResult = evaluateProductionBundleBudget(policy, snapshot);

  return {
    ok: budgetResult.errors.length === 0,
    exitCode: budgetResult.errors.length === 0 ? 0 : 1,
    errors: budgetResult.errors,
    warnings: [...warnings, ...budgetResult.warnings],
    snapshot,
  };
}

export function formatProductionBundleBudgetReport(result) {
  const lines = [`production-bundle-budget: ${result.ok ? "OK" : "BLOCKED"}`];

  if (result.snapshot) {
    lines.push(`- routes: ${result.snapshot.routeCount}`);
    lines.push(`- maxFirstLoadUncompressedJsBytes: ${result.snapshot.maxFirstLoadUncompressedJsBytes ?? "n/a"}`);
    lines.push(`- p95FirstLoadUncompressedJsBytes: ${result.snapshot.p95FirstLoadUncompressedJsBytes ?? "n/a"}`);
    lines.push(`- totalStaticJsCssBytes: ${result.snapshot.totalStaticJsCssBytes}`);
    lines.push(`- staticJsCssFiles: ${result.snapshot.fileCount}`);
    lines.push("- topRoutes:");
    for (const route of result.snapshot.topRoutes) {
      lines.push(
        `  ${route.route}: ${route.firstLoadUncompressedJsBytes} bytes (${route.chunkCount} chunks)`,
      );
    }
  }

  for (const warning of result.warnings) {
    lines.push(`PRODUCTION BUNDLE WARNING: ${warning}`);
  }
  for (const error of result.errors) {
    lines.push(`PRODUCTION BUNDLE FAILED: ${error}`);
  }

  if (result.ok) {
    lines.push("PRODUCTION BUNDLE BUDGET: OK");
  }

  return lines.join("\n");
}

function printUsage() {
  console.log(`Usage: npm run check:production-bundle-budget -- [--policy <path>] [--root <path>] [--json]

Checks production Next.js route bundle diagnostics from .next/diagnostics and
static JS/CSS asset totals from .next/static. Run npm run build first.
This is a production artifact diagnostic; it does not replace browser DCL/main
thread verification.
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const result = runProductionBundleBudgetGate({
    policyPath: args.policy,
    rootDir: args.root,
  });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatProductionBundleBudgetReport(result));
  }

  process.exitCode = result.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
