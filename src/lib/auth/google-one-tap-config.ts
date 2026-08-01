import {
  getMarketConfig,
  type MarketCode,
} from "@/config/markets";

export type GoogleOneTapConfig = {
  clientId: string | null;
  enabled: boolean;
};

export function normalizeGoogleOneTapClientId(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function resolveGoogleOneTapClientId(
  marketCode: MarketCode,
): string | null {
  const market = getMarketConfig(marketCode);

  return (
    normalizeGoogleOneTapClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) ??
    normalizeGoogleOneTapClientId(market.services.googleClientId)
  );
}

export function resolveGoogleOneTapConfig(
  marketCode: MarketCode,
): GoogleOneTapConfig {
  const market = getMarketConfig(marketCode);
  const clientId = resolveGoogleOneTapClientId(marketCode);
  const configuredEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP;

  return {
    clientId,
    enabled:
      Boolean(clientId) &&
      configuredEnabled !== "false" &&
      (configuredEnabled === "true" || market.services.googleOneTapDefaultEnabled),
  };
}
