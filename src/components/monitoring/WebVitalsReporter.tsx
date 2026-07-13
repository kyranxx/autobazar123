"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import {
  WEB_VITAL_METRICS,
  isWebVitalMetricName,
  normalizeMetricValue,
  normalizeRoutePath,
} from "@/lib/performance/slo";

const INGEST_ENDPOINT = "/api/monitoring/web-vitals";
const MAX_SENT_METRIC_KEYS = 250;
const sentMetricKeys = new Set<string>();

type WebVitalPayload = {
  id: string;
  name: string;
  value: number;
  delta?: number;
  rating?: string;
  navigationType?: string;
  route: string;
};

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

function shouldReportInCurrentEnvironment(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === "true") return true;
  return process.env.NODE_ENV === "production";
}

function sendWebVital(payload: WebVitalPayload) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(INGEST_ENDPOINT, blob);
    return;
  }

  void fetch(INGEST_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
    cache: "no-store",
  });
}

function rememberMetricKey(metricKey: string): boolean {
  if (sentMetricKeys.has(metricKey)) return false;

  sentMetricKeys.add(metricKey);
  if (sentMetricKeys.size > MAX_SENT_METRIC_KEYS) {
    const oldestMetricKey = sentMetricKeys.values().next().value;
    if (oldestMetricKey) {
      sentMetricKeys.delete(oldestMetricKey);
    }
  }

  return true;
}

export default function WebVitalsReporter() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname || "/");

  useEffect(() => {
    pathnameRef.current = pathname || "/";
  }, [pathname]);

  const reportWebVital = useCallback<ReportWebVitalsCallback>((metric) => {
    if (!shouldReportInCurrentEnvironment()) return;
    if (!WEB_VITAL_METRICS.includes(metric.name as (typeof WEB_VITAL_METRICS)[number])) {
      return;
    }
    if (!isWebVitalMetricName(metric.name)) return;

    const route = normalizeRoutePath(pathnameRef.current);
    const value = normalizeMetricValue(metric.value);
    const delta = normalizeMetricValue(metric.delta);
    if (!route || value === null) return;

    const dedupeKey = `${metric.id}:${metric.name}:${route}`;
    if (!rememberMetricKey(dedupeKey)) return;

    sendWebVital({
      id: metric.id,
      name: metric.name,
      value,
      delta: delta ?? undefined,
      rating: metric.rating,
      navigationType: metric.navigationType,
      route,
    });
  }, []);

  useReportWebVitals(reportWebVital);

  return null;
}
