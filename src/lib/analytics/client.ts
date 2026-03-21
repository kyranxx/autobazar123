"use client";

import posthog from "posthog-js";
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

const ANALYTICS_DISTINCT_ID_STORAGE_KEY = "autobazar123_analytics_distinct_id";

function getOrCreateAnalyticsDistinctId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existingId = window.localStorage.getItem(ANALYTICS_DISTINCT_ID_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const nextId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(ANALYTICS_DISTINCT_ID_STORAGE_KEY, nextId);
  return nextId;
}

function buildAnalyticsContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const pageUrl = `${window.location.pathname}${window.location.search}`;

  return {
    pagePath: window.location.pathname,
    pageUrl,
    pageTitle: document.title || null,
    referrer: document.referrer || null,
    distinctId: getOrCreateAnalyticsDistinctId(),
  };
}

function queueFirstPartyAnalyticsEvent(
  name: AnalyticsEventName,
  payload: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    name,
    payload,
    context: buildAnalyticsContext(),
  });

  try {
    if (typeof navigator.sendBeacon === "function") {
      const beaconBody = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/events", beaconBody);
      return;
    }
  } catch {
    // Ignore beacon transport failures and fall back to fetch.
  }

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Ignore background analytics transport errors.
  });
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

  if (posthog.__loaded) {
    posthog.capture(name, eventPayload);
  }

  queueFirstPartyAnalyticsEvent(name, eventPayload);

  return true;
}
