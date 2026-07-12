"use client";

import { useEffect, useReducer, useRef } from "react";
import { useLocale } from "next-intl";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

type TurnstileApi = {
  render(target: HTMLElement, options: TurnstileRenderOptions): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __autobazarTurnstileLoader?: Promise<void>;
  }
}

type TurnstileCaptchaProps = {
  onTokenChange: (token: string | null) => void;
  action?: string;
  className?: string;
};

function getTurnstileCaptchaCopy(locale: string) {
  if (locale.toLowerCase().startsWith("ro")) {
    return {
      misconfigured: "Captcha nu este configurată corect. Contactează suportul.",
      loadFailed: "Captcha nu a putut fi încărcată. Reîncarcă pagina.",
      failed: "Captcha a eșuat. Încearcă din nou.",
      expired: "Captcha a expirat. Confirmă captcha din nou.",
    };
  }

  return {
    misconfigured: "Captcha nie je správne nakonfigurovaná. Kontaktujte podporu.",
    loadFailed: "Captcha sa nepodarilo načítať. Skúste obnoviť stránku.",
    failed: "Captcha zlyhala. Skúste to znova.",
    expired: "Captcha expirovala. Potvrďte ju znova.",
  };
}

function resolveTurnstileSiteKey(): string | null {
  const configured = TURNSTILE_SITE_KEY?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return TURNSTILE_TEST_SITE_KEY;
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (window.__autobazarTurnstileLoader) {
    return window.__autobazarTurnstileLoader;
  }

  window.__autobazarTurnstileLoader = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      TURNSTILE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Turnstile script load failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script load failed"));
    document.head.appendChild(script);
  });

  return window.__autobazarTurnstileLoader;
}

export default function TurnstileCaptcha({
  onTokenChange,
  action = "inquiry_submit",
  className = "",
}: TurnstileCaptchaProps) {
  const locale = useLocale();
  const copy = getTurnstileCaptchaCopy(locale);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [error, reportCaptchaError] = useReducer(
    (_current: string, next: string) => next,
    "",
  );

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let isActive = true;
    onTokenChangeRef.current(null);

    const mountWidget = async () => {
      const sitekey = resolveTurnstileSiteKey();
      if (!sitekey) {
        reportCaptchaError(copy.misconfigured);
        return;
      }

      try {
        await loadTurnstileScript();
      } catch {
        if (isActive) {
          reportCaptchaError(copy.loadFailed);
        }
        return;
      }

      if (!isActive || !containerRef.current || !window.turnstile) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        action,
        theme: "light",
        callback: (token: string) => {
          onTokenChangeRef.current(token);
          reportCaptchaError("");
        },
        "error-callback": () => {
          onTokenChangeRef.current(null);
          reportCaptchaError(copy.failed);
        },
        "expired-callback": () => {
          onTokenChangeRef.current(null);
          reportCaptchaError(copy.expired);
        },
      });
    };

    void mountWidget();

    return () => {
      isActive = false;
      onTokenChangeRef.current(null);
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action, copy.expired, copy.failed, copy.loadFailed, copy.misconfigured]);

  return (
    <div className={className}>
      <div ref={containerRef} />
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}
