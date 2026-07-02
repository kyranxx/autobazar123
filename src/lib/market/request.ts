import { headers } from "next/headers";
import {
  DEFAULT_MARKET_CODE,
  getMarketConfig,
  resolveMarketCodeFromHost,
  type MarketCode,
  type MarketConfig,
} from "@/config/markets";

type HeaderReader = {
  get(name: string): string | null;
};

export function resolveMarketCodeFromHeaders(
  requestHeaders: HeaderReader | null | undefined,
): MarketCode {
  const forwardedHost = requestHeaders?.get("x-forwarded-host");
  const host = requestHeaders?.get("host");

  return resolveMarketCodeFromHost(forwardedHost || host || null);
}

export function resolveMarketConfigFromHeaders(
  requestHeaders: HeaderReader | null | undefined,
): MarketConfig {
  return getMarketConfig(resolveMarketCodeFromHeaders(requestHeaders));
}

export async function getRequestMarketConfig(): Promise<MarketConfig> {
  try {
    return resolveMarketConfigFromHeaders(await headers());
  } catch {
    return getMarketConfig(DEFAULT_MARKET_CODE);
  }
}
