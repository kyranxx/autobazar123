#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_POLICY_PATH = "config/performance-budget-policy.json";
const DEFAULT_AUDIT_PATH = "output/playwright/webapp-audit.json";

export function parsePerformanceBudgetArgs(argv) {
  const args = {
    policy: DEFAULT_POLICY_PATH,
    audit: DEFAULT_AUDIT_PATH,
    root: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--policy" && argv[i + 1]) {
      args.policy = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--audit" && argv[i + 1]) {
      args.audit = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--root" && argv[i + 1]) {
      args.root = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (p <= 0) return sorted[0];
  if (p >= 100) return sorted[sorted.length - 1];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return Number(sorted[lower].toFixed(2));

  const interpolated =
    sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  return Number(interpolated.toFixed(2));
}

function pickPerfValue(result, key) {
  const perf = result?.perf;
  if (!perf || typeof perf !== "object") return null;
  const value = perf[key];
  return isFiniteNumber(value) ? value : null;
}

export function buildPerformanceSnapshot(auditReport) {
  const results = Array.isArray(auditReport?.results) ? auditReport.results : [];
  const auditMode =
    typeof auditReport?.summary?.auditMode === "string" && auditReport.summary.auditMode
      ? auditReport.summary.auditMode
      : "unknown";

  const metricBuckets = {
    p95JsTransferSizeBytes: [],
    p95MainThreadWorkMs: [],
    p95DomContentLoadedMs: [],
  };

  const routeMetricValues = {
    domContentLoadedMs: new Map(),
    mainThreadWorkMs: new Map(),
  };

  for (const result of results) {
    const route = typeof result?.route === "string" ? result.route : null;
    const jsTransfer = pickPerfValue(result, "jsTransferSizeBytes");
    const mainThread = pickPerfValue(result, "mainThreadWorkMs");
    const domContentLoaded = pickPerfValue(result, "domContentLoadedMs");

    if (isFiniteNumber(jsTransfer)) metricBuckets.p95JsTransferSizeBytes.push(jsTransfer);
    if (isFiniteNumber(mainThread)) metricBuckets.p95MainThreadWorkMs.push(mainThread);
    if (isFiniteNumber(domContentLoaded)) metricBuckets.p95DomContentLoadedMs.push(domContentLoaded);

    if (route && isFiniteNumber(domContentLoaded)) {
      const currentDom = routeMetricValues.domContentLoadedMs.get(route) || [];
      currentDom.push(domContentLoaded);
      routeMetricValues.domContentLoadedMs.set(route, currentDom);
    }
    if (route && isFiniteNumber(mainThread)) {
      const currentMain = routeMetricValues.mainThreadWorkMs.get(route) || [];
      currentMain.push(mainThread);
      routeMetricValues.mainThreadWorkMs.set(route, currentMain);
    }
  }

  const routeP95ByMetric = {
    domContentLoadedMs: Object.fromEntries(
      [...routeMetricValues.domContentLoadedMs.entries()].map(([route, values]) => [
        route,
        percentile(values, 95),
      ]),
    ),
    mainThreadWorkMs: Object.fromEntries(
      [...routeMetricValues.mainThreadWorkMs.entries()].map(([route, values]) => [
        route,
        percentile(values, 95),
      ]),
    ),
  };

  return {
    auditMode,
    sampleCount: results.length,
    p95JsTransferSizeBytes: percentile(metricBuckets.p95JsTransferSizeBytes, 95),
    p95MainThreadWorkMs: percentile(metricBuckets.p95MainThreadWorkMs, 95),
    p95DomContentLoadedMs: percentile(metricBuckets.p95DomContentLoadedMs, 95),
    routeP95ByMetric,
  };
}

function getRegressionLimit(baselineValue, allowedRegressionPct, minHeadroomMs) {
  const percentageLimit = baselineValue * (1 + allowedRegressionPct / 100);
  return Math.max(percentageLimit, baselineValue + minHeadroomMs);
}

export function evaluatePerformanceBudgetPolicy(policy, snapshot) {
  const errors = [];
  const warnings = [];
  const metrics = policy?.metrics || {};
  const allowedAuditModes = Array.isArray(policy?.allowedAuditModes)
    ? policy.allowedAuditModes.filter((mode) => typeof mode === "string" && mode)
    : [];

  if (allowedAuditModes.length > 0) {
    const auditMode =
      typeof snapshot?.auditMode === "string" && snapshot.auditMode
        ? snapshot.auditMode
        : "unknown";
    if (!allowedAuditModes.includes(auditMode)) {
      errors.push(
        `unsupported audit mode ${auditMode} (allowed: ${allowedAuditModes.join(", ")})`,
      );
    }
  }

  for (const [metricKey, threshold] of Object.entries(metrics)) {
    if (!isFiniteNumber(threshold)) {
      warnings.push(`invalid threshold for ${metricKey}`);
      continue;
    }

    const current = snapshot[metricKey];
    if (!isFiniteNumber(current)) {
      errors.push(`missing metric in audit output: ${metricKey}`);
      continue;
    }

    if (current > threshold) {
      errors.push(
        `${metricKey} exceeded budget (current=${Math.round(current)}, limit=${Math.round(threshold)})`,
      );
    }
  }

  const routeRegression = policy?.routeRegression;
  if (routeRegression && routeRegression.routes) {
    const metricName = routeRegression.metric || "domContentLoadedMs";
    const allowedRegressionPct = isFiniteNumber(routeRegression.allowedRegressionPct)
      ? routeRegression.allowedRegressionPct
      : 25;
    const minHeadroomMs = isFiniteNumber(routeRegression.minHeadroomMs)
      ? routeRegression.minHeadroomMs
      : 150;
    const currentByRoute = snapshot.routeP95ByMetric?.[metricName] || {};

    for (const [route, baselineValue] of Object.entries(routeRegression.routes)) {
      if (!isFiniteNumber(baselineValue)) {
        warnings.push(`invalid baseline for route ${route}`);
        continue;
      }

      const current = currentByRoute[route];
      if (!isFiniteNumber(current)) {
        errors.push(`missing route metric for ${route} (${metricName})`);
        continue;
      }

      const allowed = getRegressionLimit(
        baselineValue,
        allowedRegressionPct,
        minHeadroomMs,
      );
      if (current > allowed) {
        errors.push(
          `route regression on ${route} for ${metricName} (current=${Math.round(current)}, baseline=${Math.round(baselineValue)}, allowed=${Math.round(allowed)})`,
        );
      }
    }
  }

  return { errors, warnings };
}

export function runPerformanceBudgetGate({
  policyPath = DEFAULT_POLICY_PATH,
  auditPath = DEFAULT_AUDIT_PATH,
  rootDir = process.cwd(),
} = {}) {
  const resolvedPolicyPath = resolve(rootDir, policyPath);
  const resolvedAuditPath = resolve(rootDir, auditPath);

  if (!existsSync(resolvedPolicyPath)) {
    console.error(`PERF BUDGET GATE FAILED: policy file missing (${policyPath})`);
    return 1;
  }
  if (!existsSync(resolvedAuditPath)) {
    console.error(`PERF BUDGET GATE FAILED: audit file missing (${auditPath})`);
    return 1;
  }

  const policy = loadJson(resolvedPolicyPath);
  const auditReport = loadJson(resolvedAuditPath);
  const snapshot = buildPerformanceSnapshot(auditReport);
  const { errors, warnings } = evaluatePerformanceBudgetPolicy(policy, snapshot);

  console.log("PERF BUDGET SNAPSHOT:");
  console.log(`- auditMode: ${snapshot.auditMode}`);
  console.log(`- samples: ${snapshot.sampleCount}`);
  console.log(`- p95JsTransferSizeBytes: ${snapshot.p95JsTransferSizeBytes ?? "n/a"}`);
  console.log(`- p95MainThreadWorkMs: ${snapshot.p95MainThreadWorkMs ?? "n/a"}`);
  console.log(`- p95DomContentLoadedMs: ${snapshot.p95DomContentLoadedMs ?? "n/a"}`);

  for (const warning of warnings) {
    console.warn(`PERF BUDGET WARNING: ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`PERF BUDGET FAILED: ${error}`);
    }
    return 1;
  }

  console.log("PERF BUDGET GATE: OK");
  return 0;
}

function main() {
  const args = parsePerformanceBudgetArgs(process.argv.slice(2));
  const status = runPerformanceBudgetGate({
    policyPath: args.policy,
    auditPath: args.audit,
    rootDir: args.root,
  });
  process.exit(status);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
