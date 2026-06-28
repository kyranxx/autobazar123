import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildProductionBundleSnapshot,
  collectRouteBundleStatsFromNextBuild,
  evaluateProductionBundleBudget,
  formatProductionBundleBudgetReport,
  parseArgs,
  percentile,
  runProductionBundleBudgetGate,
  summarizeRouteBundleStats,
} from "./production-bundle-budget-gate.mjs";

const routeStatsFixture = [
  {
    route: "/",
    firstLoadUncompressedJsBytes: 1000000,
    firstLoadChunkPaths: ["a.js", "b.js"],
  },
  {
    route: "/vysledky",
    firstLoadUncompressedJsBytes: 1300000,
    firstLoadChunkPaths: ["a.js", "c.js"],
  },
  {
    route: "/moj-ucet",
    firstLoadUncompressedJsBytes: 1600000,
    firstLoadChunkPaths: ["a.js", "d.js", "e.js"],
  },
];

test("percentile calculates route bundle percentiles", () => {
  assert.equal(percentile([100, 200, 300, 400], 95), 385);
  assert.equal(percentile([], 95), null);
});

test("summarizeRouteBundleStats extracts p95, max, and top routes", () => {
  const summary = summarizeRouteBundleStats(routeStatsFixture, { topRouteCount: 2 });

  assert.equal(summary.routeCount, 3);
  assert.equal(summary.maxFirstLoadUncompressedJsBytes, 1600000);
  assert.equal(summary.p95FirstLoadUncompressedJsBytes, 1570000);
  assert.deepEqual(summary.topRoutes.map((route) => route.route), [
    "/moj-ucet",
    "/vysledky",
  ]);
});

test("buildProductionBundleSnapshot includes static JS/CSS totals", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "bundle-budget-"));
  const staticRoot = path.join(root, "static");
  mkdirSync(path.join(staticRoot, "chunks"), { recursive: true });
  writeFileSync(path.join(staticRoot, "chunks", "a.js"), "12345", "utf8");
  writeFileSync(path.join(staticRoot, "chunks", "b.css"), "123", "utf8");
  writeFileSync(path.join(staticRoot, "chunks", "ignored.txt"), "1234567890", "utf8");

  const snapshot = buildProductionBundleSnapshot({
    routeStats: routeStatsFixture,
    staticRoot,
    topRouteCount: 1,
  });

  assert.equal(snapshot.totalStaticJsCssBytes, 8);
  assert.equal(snapshot.fileCount, 2);
  assert.equal(snapshot.topRoutes.length, 1);
});

test("evaluateProductionBundleBudget flags oversized routes and assets", () => {
  const result = evaluateProductionBundleBudget(
    {
      budgets: {
        maxFirstLoadUncompressedJsBytes: 1500000,
        p95FirstLoadUncompressedJsBytes: 1500000,
        totalStaticJsCssBytes: 1000,
        minRouteCount: 5,
      },
    },
    {
      routeCount: 3,
      maxFirstLoadUncompressedJsBytes: 1600000,
      p95FirstLoadUncompressedJsBytes: 1570000,
      totalStaticJsCssBytes: 2000,
    },
  );

  assert.equal(result.errors.length, 4);
  assert.match(result.errors[0], /maxFirstLoadUncompressedJsBytes exceeded budget/u);
  assert.match(result.errors[3], /routeStats route count below expected minimum/u);
});

test("runProductionBundleBudgetGate reports missing diagnostics as build prerequisite", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "bundle-budget-missing-"));
  const policyPath = path.join(root, "policy.json");
  writeFileSync(
    policyPath,
    JSON.stringify({
      routeStatsPath: ".next/diagnostics/route-bundle-stats.json",
      staticRoot: ".next/static",
      budgets: {
        maxFirstLoadUncompressedJsBytes: 2000000,
        p95FirstLoadUncompressedJsBytes: 1800000,
        totalStaticJsCssBytes: 4000000,
        minRouteCount: 1,
      },
    }),
    "utf8",
  );

  const result = runProductionBundleBudgetGate({
    policyPath,
    rootDir: root,
  });

  assert.equal(result.ok, false);
  assert.match(result.errors[0], /run npm run build first/u);
});

test("collectRouteBundleStatsFromNextBuild derives route stats from Next manifests", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "bundle-budget-next-"));
  const nextRoot = path.join(root, ".next");
  const staticRoot = path.join(nextRoot, "static", "chunks");
  const serverAppRoot = path.join(nextRoot, "server", "app");
  mkdirSync(staticRoot, { recursive: true });
  mkdirSync(path.join(serverAppRoot, "(site)", "vysledky"), { recursive: true });

  writeFileSync(
    path.join(nextRoot, "build-manifest.json"),
    JSON.stringify({
      rootMainFiles: ["static/chunks/main-app.js"],
      pages: { "/_app": [] },
    }),
    "utf8",
  );
  writeFileSync(
    path.join(nextRoot, "server", "app-paths-manifest.json"),
    JSON.stringify({
      "/page": "server/app/page.js",
      "/(site)/vysledky/page": "server/app/(site)/vysledky/page.js",
    }),
    "utf8",
  );
  writeFileSync(path.join(staticRoot, "main-app.js"), "12345", "utf8");
  writeFileSync(path.join(staticRoot, "home.js"), "123", "utf8");
  writeFileSync(path.join(staticRoot, "search.js"), "1234567", "utf8");
  writeFileSync(
    path.join(serverAppRoot, "page_client-reference-manifest.js"),
    'globalThis.__RSC_MANIFEST={"/page":{entryJSFiles:{page:["static/chunks/home.js"]}}};',
    "utf8",
  );
  writeFileSync(
    path.join(serverAppRoot, "(site)", "vysledky", "page_client-reference-manifest.js"),
    'globalThis.__RSC_MANIFEST={"/(site)/vysledky/page":{entryJSFiles:{page:["static/chunks/search.js"]}}};',
    "utf8",
  );

  const stats = collectRouteBundleStatsFromNextBuild({ rootDir: root });

  assert.deepEqual(
    stats.map((row) => row.route).sort(),
    ["/", "/vysledky"],
  );
  assert.equal(
    stats.find((row) => row.route === "/vysledky").firstLoadUncompressedJsBytes,
    12,
  );
});

test("runProductionBundleBudgetGate passes fixture within policy", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "bundle-budget-pass-"));
  const diagnosticsRoot = path.join(root, ".next", "diagnostics");
  const staticRoot = path.join(root, ".next", "static", "chunks");
  mkdirSync(diagnosticsRoot, { recursive: true });
  mkdirSync(staticRoot, { recursive: true });
  writeFileSync(
    path.join(diagnosticsRoot, "route-bundle-stats.json"),
    JSON.stringify(routeStatsFixture),
    "utf8",
  );
  writeFileSync(path.join(staticRoot, "a.js"), "12345", "utf8");
  writeFileSync(
    path.join(root, "policy.json"),
    JSON.stringify({
      routeStatsPath: ".next/diagnostics/route-bundle-stats.json",
      staticRoot: ".next/static",
      topRouteCount: 2,
      budgets: {
        maxFirstLoadUncompressedJsBytes: 2000000,
        p95FirstLoadUncompressedJsBytes: 1800000,
        totalStaticJsCssBytes: 4000000,
        minRouteCount: 3,
      },
    }),
    "utf8",
  );

  const result = runProductionBundleBudgetGate({
    policyPath: "policy.json",
    rootDir: root,
  });
  const report = formatProductionBundleBudgetReport(result);

  assert.equal(result.ok, true);
  assert.match(report, /PRODUCTION BUNDLE BUDGET: OK/u);
  assert.match(report, /\/moj-ucet/u);
});

test("parseArgs supports policy, root, json, and help", () => {
  assert.deepEqual(parseArgs(["--policy", "p.json", "--root", "/repo", "--json"]), {
    policy: "p.json",
    root: "/repo",
    json: true,
    help: false,
  });
  assert.equal(parseArgs(["--help"]).help, true);
});
