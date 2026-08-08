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

function resolveMarketSpecificGoogleOneTapClientId(
  marketCode: MarketCode,
): string | null {
  switch (marketCode) {
    case "SK":
      return normalizeGoogleOneTapClientId(
        process.env.NEXT_PUBLIC_AUTONINJA_SK_GOOGLE_CLIENT_ID,
      );
    case "RO":
      return normalizeGoogleOneTapClientId(
        process.env.NEXT_PUBLIC_AUTONINJA_RO_GOOGLE_CLIENT_ID,
      );
  }
}

export function resolveGoogleOneTapClientId(
  marketCode: MarketCode,
): string | null {
  const marketSpecificClientId =
    resolveMarketSpecificGoogleOneTapClientId(marketCode);
  const legacySlovakClientId =
    marketCode === "SK"
      ? normalizeGoogleOneTapClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
      : null;

  return marketSpecificClientId ?? legacySlovakClientId;
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
        market.services.googleOneTapDefaultEnabled &&
        configuredEnabled !== "false" &&
        (configuredEnabled === "true" || market.services.googleOneTapDefaultEnabled),
  };
}
