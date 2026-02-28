export const WEB_VITAL_METRICS = ["LCP", "INP", "TTFB"] as const;

export type WebVitalMetricName = (typeof WEB_VITAL_METRICS)[number];

export interface WebVitalSample {
  metricName: WebVitalMetricName;
  metricValue: number;
  route: string;
  timestamp?: string;
}

export interface SloMetricRow {
  route: string;
  metricName: WebVitalMetricName;
  sampleCount: number;
  p50: number;
  p95: number;
}

export interface SloDashboardSnapshot {
  rows: SloMetricRow[];
  totalSamples: number;
  routeCount: number;
  generatedAt: string;
}

export function isWebVitalMetricName(value: unknown): value is WebVitalMetricName {
  return typeof value === "string" && (WEB_VITAL_METRICS as readonly string[]).includes(value);
}

export function normalizeMetricValue(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 120_000) return null;
  return Number(value.toFixed(2));
}

export function normalizeRoutePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.length > 180) return null;
  return trimmed;
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (p <= 0) return Number(sorted[0].toFixed(2));
  if (p >= 100) return Number(sorted[sorted.length - 1].toFixed(2));

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return Number(sorted[lower].toFixed(2));

  const weight = index - lower;
  const interpolated = sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
  return Number(interpolated.toFixed(2));
}

export function toWebVitalSample(
  metadata: Record<string, unknown> | null | undefined,
  createdAt?: string,
): WebVitalSample | null {
  if (!metadata) return null;

  const metricName = metadata.metricName ?? metadata.metric_name;
  const metricValue = metadata.metricValue ?? metadata.metric_value;
  const route = metadata.route;

  if (!isWebVitalMetricName(metricName)) return null;

  const normalizedValue = normalizeMetricValue(metricValue);
  if (normalizedValue === null) return null;

  const normalizedRoute = normalizeRoutePath(route);
  if (!normalizedRoute) return null;

  return {
    metricName,
    metricValue: normalizedValue,
    route: normalizedRoute,
    timestamp: createdAt,
  };
}

export function buildSloDashboardSnapshot(samples: WebVitalSample[]): SloDashboardSnapshot {
  const byKey = new Map<string, number[]>();
  const routes = new Set<string>();

  for (const sample of samples) {
    routes.add(sample.route);
    const key = `${sample.route}::${sample.metricName}`;
    const current = byKey.get(key);
    if (current) {
      current.push(sample.metricValue);
    } else {
      byKey.set(key, [sample.metricValue]);
    }
  }

  const rows: SloMetricRow[] = [...byKey.entries()]
    .map(([key, values]) => {
      const [route, metricName] = key.split("::");
      return {
        route,
        metricName: metricName as WebVitalMetricName,
        sampleCount: values.length,
        p50: percentile(values, 50),
        p95: percentile(values, 95),
      };
    })
    .sort((a, b) => {
      if (a.route === b.route) return a.metricName.localeCompare(b.metricName);
      return a.route.localeCompare(b.route);
    });

  return {
    rows,
    totalSamples: samples.length,
    routeCount: routes.size,
    generatedAt: new Date().toISOString(),
  };
}
