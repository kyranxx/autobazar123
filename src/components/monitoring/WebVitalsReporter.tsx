"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import {
  WEB_VITAL_METRICS,
  isWebVitalMetricName,
  normalizeMetricValue,
  normalizeRoutePath,
} from "@/lib/performance/slo";

const INGEST_ENDPOINT = "/api/monitoring/web-vitals";
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

export default function WebVitalsReporter() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname || "/");

  useEffect(() => {
    pathnameRef.current = pathname || "/";
  }, [pathname]);

  useReportWebVitals((metric) => {
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
    if (sentMetricKeys.has(dedupeKey)) return;
    sentMetricKeys.add(dedupeKey);

    sendWebVital({
      id: metric.id,
      name: metric.name,
      value,
      delta: delta ?? undefined,
      rating: metric.rating,
      navigationType: metric.navigationType,
      route,
    });
  });

  return null;
}
