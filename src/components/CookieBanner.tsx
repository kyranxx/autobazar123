"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const COOKIE_CONSENT_KEY = "autobazar123_cookie_consent";

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

interface CookieBannerState {
  isVisible: boolean;
  showSettings: boolean;
  isReady: boolean;
  consent: CookieConsent;
}

type CookieBannerAction =
  | { type: "hydrate_saved"; consent: CookieConsent }
  | { type: "mark_ready" }
  | { type: "show_banner" }
  | { type: "open_settings" }
  | { type: "close_settings" }
  | { type: "set_analytics"; value: boolean }
  | { type: "set_marketing"; value: boolean }
  | { type: "save_consent"; consent: CookieConsent };

const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
};

const initialState: CookieBannerState = {
  isVisible: false,
  showSettings: false,
  isReady: false,
  consent: defaultConsent,
};

function parseStoredConsent(value: string | null): CookieConsent | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as CookieConsent;
  } catch {
    return null;
  }
}

function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  return parseStoredConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
}

function cookieBannerReducer(
  state: CookieBannerState,
  action: CookieBannerAction,
): CookieBannerState {
  switch (action.type) {
    case "hydrate_saved":
      return {
        ...state,
        consent: action.consent,
        isVisible: false,
        showSettings: false,
        isReady: true,
      };
    case "mark_ready":
      return {
        ...state,
        isReady: true,
      };
    case "show_banner":
      return {
        ...state,
        isVisible: true,
      };
    case "open_settings":
      return {
        ...state,
        showSettings: true,
      };
    case "close_settings":
      return {
        ...state,
        showSettings: false,
      };
    case "set_analytics":
      return {
        ...state,
        consent: {
          ...state.consent,
          analytics: action.value,
        },
      };
    case "set_marketing":
      return {
        ...state,
        consent: {
          ...state.consent,
          marketing: action.value,
        },
      };
    case "save_consent":
      return {
        ...state,
        consent: action.consent,
        isVisible: false,
        showSettings: false,
      };
    default:
      return state;
  }
}

export default function CookieBanner() {
  const [state, dispatch] = useReducer(cookieBannerReducer, initialState);
  const t = useTranslations("cookies");
  const tCommon = useTranslations("common");

  useEffect(() => {
    const savedConsent = readStoredConsent();

    if (savedConsent) {
      dispatch({ type: "hydrate_saved", consent: savedConsent });
      return;
    }

    dispatch({ type: "mark_ready" });

    const timer = setTimeout(() => {
      dispatch({ type: "show_banner" });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const saveConsent = (newConsent: CookieConsent) => {
    const consentWithTimestamp = { ...newConsent, timestamp: Date.now() };
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify(consentWithTimestamp),
    );
    dispatch({ type: "save_consent", consent: consentWithTimestamp });
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: 0,
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: 0,
    });
  };

  const savePreferences = () => {
    saveConsent(state.consent);
  };

  if (!state.isReady || !state.isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
        {!state.showSettings ? (
          /* Main Banner */
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🍪</span>
                  <h3 className="font-semibold text-primary">{t("title")}</h3>
                </div>
                <p className="text-sm text-secondary">
                  {t("description")}{" "}
                  <Link
                    href="/ochrana-udajov"
                    className="text-accent hover:underline"
                  >
                    {tCommon("learnMore")}
                  </Link>
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
                <button
                  onClick={() => dispatch({ type: "open_settings" })}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-surface transition-colors"
                >
                  {t("settings")}
                </button>
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-surface transition-colors"
                >
                  {t("reject")}
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
                >
                  {t("accept")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Settings Panel */
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">
                {t("settings")}
              </h3>
              <button
                onClick={() => dispatch({ type: "close_settings" })}
                className="text-secondary hover:text-primary"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-surface">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">
                      {t("necessary")}
                    </span>
                  </div>
                  <p className="text-sm text-secondary mt-1">
                    Potrebné pre základné fungovanie stránky, prihlásenie a
                    bezpečnosť.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 w-5 h-5 rounded accent-accent"
                />
              </div>

              {/* Analytics */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <div className="flex-1">
                  <span className="font-medium text-primary">
                    {t("analytics")}
                  </span>
                  <p className="text-sm text-secondary mt-1">
                    Pomáhajú nám pochopiť, ako používatelia využívajú stránku.
                    Dáta sú anonymizované.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={state.consent.analytics}
                  onChange={(e) =>
                    dispatch({ type: "set_analytics", value: e.target.checked })
                  }
                  className="mt-1 w-5 h-5 rounded accent-accent cursor-pointer"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <div className="flex-1">
                  <span className="font-medium text-primary">
                    {t("marketing")}
                  </span>
                  <p className="text-sm text-secondary mt-1">
                    Umožňujú zobrazovať relevantné reklamy na iných stránkach.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={state.consent.marketing}
                  onChange={(e) =>
                    dispatch({ type: "set_marketing", value: e.target.checked })
                  }
                  className="mt-1 w-5 h-5 rounded accent-accent cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={acceptNecessary}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-surface transition-colors"
              >
                {t("reject")}
              </button>
              <button
                onClick={savePreferences}
                className="px-6 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
              >
                {tCommon("save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to check cookie consent
function useCookieConsent() {
  const [consent] = useState<CookieConsent | null>(() => readStoredConsent());

  return consent;
}
