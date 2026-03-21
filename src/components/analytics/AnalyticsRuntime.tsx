"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_KEY,
  parseCookieConsent,
} from "@/lib/privacy/cookie-consent";

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

function initGoogleAnalytics(measurementId: string) {
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, "ga4-script");

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
  });
}

function initPostHog(apiKey: string, host: string) {
  if (posthog.__loaded) {
    posthog.opt_in_capturing();
    return;
  }

  posthog.init(apiKey, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    persistence: "localStorage+cookie",
    person_profiles: "identified_only",
    secure_cookie: true,
    loaded(instance) {
      instance.opt_in_capturing();
    },
  });
}

export function AnalyticsRuntime() {
  const [analyticsConsentEnabled, setAnalyticsConsentEnabled] = useState(false);

  useEffect(() => {
    const syncConsent = () => {
      const storedConsent = parseCookieConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
      setAnalyticsConsentEnabled(Boolean(storedConsent?.analytics));
    };

    syncConsent();
    window.addEventListener("storage", syncConsent);
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent);

    return () => {
      window.removeEventListener("storage", syncConsent);
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent);
    };
  }, []);

  useEffect(() => {
    const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();

    if (analyticsConsentEnabled && gaMeasurementId) {
      initGoogleAnalytics(gaMeasurementId);
    }

    if (analyticsConsentEnabled && posthogKey && posthogHost) {
      initPostHog(posthogKey, posthogHost);
      return;
    }

    if (posthog.__loaded) {
      posthog.opt_out_capturing();
    }
  }, [analyticsConsentEnabled]);

  return null;
}
