import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPerformanceSnapshot,
  evaluatePerformanceBudgetPolicy,
  parsePerformanceBudgetArgs,
  percentile,
} from "./performance-budget-gate.mjs";

test("parsePerformanceBudgetArgs parses cli flags", () => {
  const parsed = parsePerformanceBudgetArgs([
    "--policy",
    "config/custom.json",
    "--audit",
    "output/custom-audit.json",
    "--root",
    "/tmp/project",
  ]);

  assert.equal(parsed.policy, "config/custom.json");
  assert.equal(parsed.audit, "output/custom-audit.json");
  assert.equal(parsed.root, "/tmp/project");
});

test("percentile calculates interpolated values", () => {
  assert.equal(percentile([100, 200, 300, 400], 95), 385);
  assert.equal(percentile([], 95), null);
});

test("buildPerformanceSnapshot aggregates p95 metrics", () => {
  const snapshot = buildPerformanceSnapshot({
    results: [
      {
        route: "/",
        perf: {
          jsTransferSizeBytes: 100000,
          mainThreadWorkMs: 300,
          domContentLoadedMs: 120,
        },
      },
      {
        route: "/",
        perf: {
          jsTransferSizeBytes: 120000,
          mainThreadWorkMs: 330,
          domContentLoadedMs: 130,
        },
      },
      {
        route: "/vysledky",
        perf: {
          jsTransferSizeBytes: 300000,
          mainThreadWorkMs: 700,
          domContentLoadedMs: 650,
        },
      },
    ],
  });

  assert.equal(snapshot.sampleCount, 3);
  assert.equal(snapshot.p95JsTransferSizeBytes, 282000);
  assert.equal(snapshot.routeP95ByMetric.domContentLoadedMs["/"], 129.5);
});

test("evaluatePerformanceBudgetPolicy catches threshold and regression failures", () => {
  const snapshot = {
    sampleCount: 2,
    auditMode: "production",
    p95JsTransferSizeBytes: 400000,
    p95MainThreadWorkMs: 1000,
    p95DomContentLoadedMs: 900,
    routeP95ByMetric: {
      domContentLoadedMs: {
        "/": 350,
        "/vysledky": 950,
      },
    },
  };

  const policy = {
    metrics: {
      p95JsTransferSizeBytes: 450000,
      p95MainThreadWorkMs: 800,
      p95DomContentLoadedMs: 1000,
    },
    routeRegression: {
      metric: "domContentLoadedMs",
      allowedRegressionPct: 20,
      minHeadroomMs: 100,
      routes: {
        "/": 150,
      },
    },
  };

  const result = evaluatePerformanceBudgetPolicy(policy, snapshot);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /p95MainThreadWorkMs exceeded budget/);
  assert.match(result.errors[1], /route regression on \//);
});

test("evaluatePerformanceBudgetPolicy rejects unsupported audit modes", () => {
  const snapshot = {
    sampleCount: 1,
    auditMode: "development",
    p95JsTransferSizeBytes: 200000,
    p95MainThreadWorkMs: 200,
    p95DomContentLoadedMs: 800,
    routeP95ByMetric: {
      domContentLoadedMs: {},
      mainThreadWorkMs: {},
    },
  };

  const policy = {
    allowedAuditModes: ["production", "external"],
    metrics: {
      p95JsTransferSizeBytes: 450000,
      p95MainThreadWorkMs: 800,
      p95DomContentLoadedMs: 1000,
    },
  };

  const result = evaluatePerformanceBudgetPolicy(policy, snapshot);
  assert.deepEqual(result.errors, [
    "unsupported audit mode development (allowed: production, external)",
  ]);
});
