import {
  DEFAULT_MARKET_CODE,
  getMarketConfig,
  isMarketCode,
  type MarketCode,
} from "@/config/markets";
import { COMPANY_INFO } from "@/config/company";
import { getTrimmedEnv } from "@/lib/env";

const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

export function getEmailMarketCode(): MarketCode {
  const configuredCode = getTrimmedEnv(
    "NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE",
  )?.toUpperCase();
  return isMarketCode(configuredCode) ? configuredCode : DEFAULT_MARKET_CODE;
}

export function getEmailBrandName(marketCode = getEmailMarketCode()): string {
  return getMarketConfig(marketCode).brandName;
}

export function getEmailSupportEmail(marketCode = getEmailMarketCode()): string {
  const market = getMarketConfig(marketCode);
  const fallbackEmail =
    market.code === "SK" ? COMPANY_INFO.supportEmail : market.contact.email;

  return (
    getTrimmedEnv(`EMAIL_REPLY_TO_${marketCode}`) ||
    getTrimmedEnv("EMAIL_REPLY_TO") ||
    fallbackEmail
  );
}

export function getEmailFromAddress(marketCode = getEmailMarketCode()): string {
  const market = getMarketConfig(marketCode);
  const hostname = new URL(market.origin).hostname.replace(/^www\./, "");

  return (
    getTrimmedEnv(`EMAIL_FROM_${marketCode}`) ||
    getTrimmedEnv("EMAIL_FROM") ||
    `noreply@${hostname}`
  );
}

function normalizeConfiguredOrigin(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Resolve public URLs used inside emails to a real market origin.
 *
 * Preview/local app URLs must not leak into delivered emails. A configured
 * origin is accepted only when it belongs to the active market; otherwise the
 * canonical market origin is the safe production fallback.
 */
export function getEmailPublicOrigin(
  marketCode = getEmailMarketCode(),
): string {
  const market = getMarketConfig(marketCode);
  const configuredOrigin = normalizeConfiguredOrigin(
    getTrimmedEnv("NEXT_PUBLIC_SITE_URL") || getTrimmedEnv("NEXT_PUBLIC_APP_URL"),
  );

  if (configuredOrigin) {
    const configuredHost = new URL(configuredOrigin).hostname.toLowerCase();
    if (market.hosts.some((host) => host.toLowerCase() === configuredHost)) {
      return configuredOrigin;
    }
  }

  return market.origin;
}

export function getEmailUrl(
  pathOrUrl: string,
  marketCode = getEmailMarketCode(),
): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getEmailPublicOrigin(marketCode)}${normalizedPath}`;
}
