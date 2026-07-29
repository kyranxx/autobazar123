import {
  getMarketConfig,
  resolveKnownMarketCodeFromHost,
  type MarketCode,
} from "@/config/markets";
import type { CookieConsent } from "@/lib/privacy/cookie-consent";

type ClarityStorageConsent = "granted" | "denied";

export type ClarityProjectIds = {
  defaultId?: string | null;
  byMarket?: Partial<Record<MarketCode, string | null | undefined>>;
};

export type ClarityConsentV2 = {
  ad_storage: ClarityStorageConsent;
  analytics_storage: ClarityStorageConsent;
};

function normalizeClarityProjectId(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  return /^[a-z0-9]+$/i.test(trimmed) ? trimmed : null;
}

export function resolveClarityProjectIdForHost(
  host: string | null | undefined,
  ids: ClarityProjectIds,
) {
  const marketCode = resolveKnownMarketCodeFromHost(host);
  if (!marketCode) return null;

  const marketId = normalizeClarityProjectId(
    ids.byMarket?.[marketCode] ??
      getMarketConfig(marketCode).services.clarityProjectId,
  );

  return marketId ?? normalizeClarityProjectId(ids.defaultId);
}

export function buildClarityConsentV2(
  consent: Pick<CookieConsent, "analytics" | "marketing"> | null | undefined,
): ClarityConsentV2 {
  return {
    ad_storage: consent?.marketing ? "granted" : "denied",
    analytics_storage: consent?.analytics ? "granted" : "denied",
  };
}
