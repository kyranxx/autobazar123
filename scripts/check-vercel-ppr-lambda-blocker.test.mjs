import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  analyzeVercelPprLambdaBlocker,
  formatResult,
  parseArgs,
} from "./check-vercel-ppr-lambda-blocker.mjs";

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, value);
}

function createBuild({
  pprHeaders = { "next-resume": "1" },
  renderingMode = "PARTIALLY_STATIC",
  extraRoutes = {},
} = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "vercel-ppr-blocker-"));
  const nextDir = path.join(root, ".next");

  writeJson(path.join(nextDir, "prerender-manifest.json"), {
    routes: {
      "/audi/a1": {
        renderingMode,
        srcRoute: "/[brand]/[model]",
        dataRoute: "/_next/data/build-id/audi/a1.json",
      },
      ...extraRoutes,
    },
  });
  writeJson(path.join(nextDir, "routes-manifest.json"), {
    ppr: {
      chain: {
        headers: pprHeaders,
      },
    },
  });
  writeJson(path.join(nextDir, "app-path-routes-manifest.json"), {
    "/[brand]/[model]/page": "/[brand]/[model]",
  });
  writeText(path.join(nextDir, "server", "app", "audi", "a1.html"), "<html></html>");
  writeText(path.join(nextDir, "server", "app", "audi", "a1.meta"), "{}");
  writeText(
    path.join(nextDir, "server", "app", "[brand]", "[model]", "page.js"),
    "export {};\n",
  );

  return root;
}

test("detects the Vercel static-PPR lambda blocker signature", () => {
  const root = createBuild();

  const result = analyzeVercelPprLambdaBlocker({ root, route: "/audi/a1" });

  assert.equal(result.blocked, true);
  assert.equal(result.ok, false);
  assert.equal(result.partiallyStaticRouteCount, 1);
  assert.equal(result.sample?.sourcePageJsExists, true);
  assert.match(formatResult(result, root), /static-PPR lambda lookup blocker/u);
});

test("passes when next-resume PPR chain headers are absent", () => {
  const root = createBuild({ pprHeaders: {} });

  const result = analyzeVercelPprLambdaBlocker({ root, route: "/audi/a1" });

  assert.equal(result.blocked, false);
  assert.equal(result.ok, true);
});

test("passes when the sampled route is not partially static", () => {
  const root = createBuild({ renderingMode: "STATIC" });

  const result = analyzeVercelPprLambdaBlocker({ root, route: "/audi/a1" });

  assert.equal(result.blocked, false);
  assert.equal(result.ok, true);
});

test("blocks when any route is partially static with next-resume even if the sampled route is static", () => {
  const root = createBuild({
    renderingMode: "STATIC",
    extraRoutes: {
      "/bmw/x5": {
        renderingMode: "PARTIALLY_STATIC",
        srcRoute: "/[brand]/[model]",
        dataRoute: "/_next/data/build-id/bmw/x5.json",
      },
    },
  });

  const result = analyzeVercelPprLambdaBlocker({ root, route: "/audi/a1" });

  assert.equal(result.blocked, true);
  assert.equal(result.ok, false);
  assert.equal(result.partiallyStaticRouteCount, 1);
});

test("reports missing build artifacts", () => {
  const root = mkdtempSync(path.join(tmpdir(), "vercel-ppr-blocker-missing-"));

  const result = analyzeVercelPprLambdaBlocker({ root, route: "/audi/a1" });

  assert.equal(result.blocked, false);
  assert.equal(result.ok, false);
  assert.equal(result.missingFiles.length, 3);
  assert.match(formatResult(result, root), /MISSING_BUILD/u);
});

test("parses root, route, and expected blocked mode", () => {
  const options = parseArgs([
    "--root",
    "C:/tmp/example",
    "--route=/skoda/octavia",
    "--expect-blocked",
  ]);

  assert.equal(options.root, path.resolve("C:/tmp/example"));
  assert.equal(options.route, "/skoda/octavia");
  assert.equal(options.expectBlocked, true);
});
