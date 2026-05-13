"use client";

import { useEffect, useReducer, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, reportCaptchaError] = useReducer(
    (_current: string, next: string) => next,
    "",
  );

  useEffect(() => {
    let isActive = true;
    onTokenChange(null);

    const mountWidget = async () => {
      const sitekey = resolveTurnstileSiteKey();
      if (!sitekey) {
        reportCaptchaError("Captcha nie je správne nakonfigurovaná. Kontaktujte podporu.");
        return;
      }

      try {
        await loadTurnstileScript();
      } catch {
        if (isActive) {
          reportCaptchaError("Captcha sa nepodarilo načítať. Skúste obnoviť stránku.");
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
          onTokenChange(token);
          reportCaptchaError("");
        },
        "error-callback": () => {
          onTokenChange(null);
          reportCaptchaError("Captcha zlyhala. Skúste to znova.");
        },
        "expired-callback": () => {
          onTokenChange(null);
          reportCaptchaError("Captcha expirovala. Potvrďte ju znova.");
        },
      });
    };

    void mountWidget();

    return () => {
      isActive = false;
      onTokenChange(null);
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action, onTokenChange]);

  return (
    <div className={className}>
      <div ref={containerRef} />
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}
