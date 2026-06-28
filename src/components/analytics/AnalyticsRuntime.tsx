"use client";

import { useEffect, useRef } from "react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_KEY,
  parseCookieConsent,
  type CookieConsent,
} from "@/lib/privacy/cookie-consent";
import { getAnalyticsUserId } from "@/lib/analytics/events";
import {
  initPostHogClient,
  optOutPostHogClient,
} from "@/lib/analytics/posthog-client";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function loadScript(src: string, id: string) {
  if (document.getElementById(id)) {
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
}

function setConsentDefaults() {
  ensureGtag();
  window.gtag!("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });
}

function updateConsent(consent: CookieConsent) {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
    analytics_storage: consent.analytics ? "granted" : "denied",
    functionality_storage: "granted",
    personalization_storage: consent.analytics ? "granted" : "denied",
    security_storage: "granted",
  });
}

function initGoogleAnalytics(measurementId: string) {
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, "ga4-script");

  const configOptions: Record<string, unknown> = {
    send_page_view: false,
  };

  const userId = getAnalyticsUserId();
  if (userId) {
    configOptions.user_id = userId;
  }

  window.gtag!("js", new Date());
  window.gtag!("config", measurementId, configOptions);
}

export function AnalyticsRuntime() {
  const analyticsConsentEnabledRef = useRef(false);
  const consentDefaultsSet = useRef(false);

  useEffect(() => {
    if (!consentDefaultsSet.current && typeof window !== "undefined") {
      setConsentDefaults();
      consentDefaultsSet.current = true;
    }
  }, []);

  useEffect(() => {
    const applyAnalyticsConsent = (enabled: boolean) => {
      analyticsConsentEnabledRef.current = enabled;
      const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();

      if (enabled && gaMeasurementId) {
        initGoogleAnalytics(gaMeasurementId);
      }

      if (enabled && posthogKey && posthogHost) {
        void initPostHogClient(posthogKey, posthogHost, getAnalyticsUserId()).catch(
          (error) => {
            if (process.env.NODE_ENV !== "production") {
              console.warn("PostHog initialization failed", error);
            }
          },
        );
        return;
      }

      optOutPostHogClient();
    };

    const syncConsent = () => {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      const consent = parseCookieConsent(stored);
      applyAnalyticsConsent(Boolean(consent?.analytics));

      if (consent) {
        updateConsent(consent);
      }
    };

    syncConsent();
    window.addEventListener("storage", syncConsent);
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent);

    return () => {
      window.removeEventListener("storage", syncConsent);
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent);
    };
  }, []);

  return null;
}
