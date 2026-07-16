export const MARKET_CODES = ["SK", "RO"] as const;
export type MarketCode = (typeof MARKET_CODES)[number];

export const INTERNAL_MARKET_HEADER = "x-autobazar-market";

export const DEFAULT_MARKET_CODE: MarketCode = "SK";

export type MarketConfig = {
  code: MarketCode;
  countryCode: MarketCode;
  domain: string;
  origin: string;
  locale: "sk" | "ro";
  languageTag: "sk-SK" | "ro-RO";
  currency: "EUR";
  timeZone: "Europe/Bratislava" | "Europe/Bucharest";
};

export const MARKET_CONFIGS: Record<MarketCode, MarketConfig> = {
  SK: {
    code: "SK",
    countryCode: "SK",
    domain: "www.autobazar123.sk",
    origin: "https://www.autobazar123.sk",
    locale: "sk",
    languageTag: "sk-SK",
    currency: "EUR",
    timeZone: "Europe/Bratislava",
  },
  RO: {
    code: "RO",
    countryCode: "RO",
    domain: "www.autobazar123.ro",
    origin: "https://www.autobazar123.ro",
    locale: "ro",
    languageTag: "ro-RO",
    currency: "EUR",
    timeZone: "Europe/Bucharest",
  },
};

const HOST_TO_MARKET: Record<string, MarketCode> = {
  "autobazar123.sk": "SK",
  "www.autobazar123.sk": "SK",
  "autobazar123.ro": "RO",
  "www.autobazar123.ro": "RO",
};

export function isMarketCode(value: unknown): value is MarketCode {
  return (
    typeof value === "string" && MARKET_CODES.includes(value as MarketCode)
  );
}

export function getMarketConfig(marketCode: MarketCode): MarketConfig {
  return MARKET_CONFIGS[marketCode];
}

export function getDeploymentMarketCode(): MarketCode | null {
  const configuredMarketCode =
    process.env.NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE?.trim().toUpperCase();
  return isMarketCode(configuredMarketCode) ? configuredMarketCode : null;
}

export function normalizeMarketHost(
  host: string | null | undefined,
): string | null {
  const rawHost = host?.split(",", 1)[0]?.trim().toLowerCase();
  if (!rawHost) {
    return null;
  }

  const withoutProtocol = rawHost.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/", 1)[0] ?? "";
  const withoutPort = withoutPath.replace(/:\d+$/, "");

  return withoutPort || null;
}

export function resolveMarketCodeFromHost(
  host: string | null | undefined,
): MarketCode {
  return (
    getDeploymentMarketCode() ??
    resolveKnownMarketCodeFromHost(host) ??
    DEFAULT_MARKET_CODE
  );
}

export function resolveKnownMarketCodeFromHost(
  host: string | null | undefined,
): MarketCode | null {
  const normalizedHost = normalizeMarketHost(host);
  if (!normalizedHost) {
    return null;
  }

  return HOST_TO_MARKET[normalizedHost] ?? null;
}

export function getAlgoliaMarketFilter(marketCode: MarketCode): string {
  return `market_code:${marketCode}`;
}
