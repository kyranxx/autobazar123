"use client";

import {
  resolveAnalyticsConsentFromStorage,
  validateAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsEventPayload,
} from "@/lib/analytics/events";

type DataLayerEntry = {
  event: string;
} & Record<string, unknown>;

interface AnalyticsBrowserWindow extends Window {
  dataLayer?: DataLayerEntry[];
  gtag?: (...args: unknown[]) => void;
}

export function trackAnalyticsEvent<Name extends AnalyticsEventName>(
  name: Name,
  payload: AnalyticsEventPayload<Name>,
): boolean {
  if (typeof window === "undefined") return false;

  const hasConsent = resolveAnalyticsConsentFromStorage(window.localStorage);
  if (!hasConsent) return false;

  const validated = validateAnalyticsEvent(name, payload);
  if (!validated.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Invalid analytics payload", name, validated.error.flatten());
    }
    return false;
  }

  const browserWindow = window as AnalyticsBrowserWindow;
  const eventPayload = validated.data as Record<string, unknown>;

  browserWindow.dataLayer = browserWindow.dataLayer || [];
  browserWindow.dataLayer.push({
    event: name,
    ...eventPayload,
  });

  if (typeof browserWindow.gtag === "function") {
    browserWindow.gtag("event", name, eventPayload);
  }

  return true;
}
