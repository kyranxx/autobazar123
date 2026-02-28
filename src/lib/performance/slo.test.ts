import { describe, expect, it } from "vitest";
import {
  buildSloDashboardSnapshot,
  normalizeMetricValue,
  normalizeRoutePath,
  percentile,
  toWebVitalSample,
} from "@/lib/performance/slo";

describe("performance slo helpers", () => {
  it("normalizes route and metric value safely", () => {
    expect(normalizeRoutePath("/")).toBe("/");
    expect(normalizeRoutePath(" /vysledky ")).toBe("/vysledky");
    expect(normalizeRoutePath("https://example.com")).toBeNull();
    expect(normalizeMetricValue(123.456)).toBe(123.46);
    expect(normalizeMetricValue(-1)).toBeNull();
    expect(normalizeMetricValue(999_999)).toBeNull();
  });

  it("extracts valid samples from log metadata", () => {
    expect(
      toWebVitalSample(
        {
          metric_name: "LCP",
          metric_value: 1040.444,
          route: "/",
        },
        "2026-02-27T10:00:00.000Z",
      ),
    ).toEqual({
      metricName: "LCP",
      metricValue: 1040.44,
      route: "/",
      timestamp: "2026-02-27T10:00:00.000Z",
    });

    expect(
      toWebVitalSample({
        metricName: "CLS",
        metricValue: 0.2,
        route: "/",
      }),
    ).toBeNull();
  });

  it("computes percentiles and route-level dashboard rows", () => {
    const values = [100, 200, 300, 400, 500];
    expect(percentile(values, 50)).toBe(300);
    expect(percentile(values, 95)).toBe(480);

    const snapshot = buildSloDashboardSnapshot([
      { metricName: "LCP", metricValue: 1000, route: "/" },
      { metricName: "LCP", metricValue: 2000, route: "/" },
      { metricName: "INP", metricValue: 120, route: "/" },
      { metricName: "TTFB", metricValue: 300, route: "/vysledky" },
    ]);

    expect(snapshot.totalSamples).toBe(4);
    expect(snapshot.routeCount).toBe(2);
    expect(snapshot.rows).toEqual([
      { route: "/", metricName: "INP", sampleCount: 1, p50: 120, p95: 120 },
      { route: "/", metricName: "LCP", sampleCount: 2, p50: 1500, p95: 1950 },
      {
        route: "/vysledky",
        metricName: "TTFB",
        sampleCount: 1,
        p50: 300,
        p95: 300,
      },
    ]);
  });
});
