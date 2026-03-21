export const COOKIE_CONSENT_KEY = "autobazar123_cookie_consent";
export const COOKIE_CONSENT_CHANGED_EVENT = "autobazar123:cookie-consent-changed";

export type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

export const DEFAULT_COOKIE_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
};

export function parseCookieConsent(value: string | null): CookieConsent | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<CookieConsent>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      timestamp:
        typeof parsed.timestamp === "number" && Number.isFinite(parsed.timestamp)
          ? parsed.timestamp
          : 0,
    };
  } catch {
    return null;
  }
}
