import {
  DEFAULT_MARKET_CODE,
  getMarketConfig,
  isMarketCode,
  type MarketCode,
} from "@/config/markets";
import { getTrimmedEnv } from "@/lib/env";

export function getEmailMarketCode(): MarketCode {
  const configuredCode = getTrimmedEnv(
    "NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE",
  )?.toUpperCase();
  return isMarketCode(configuredCode) ? configuredCode : DEFAULT_MARKET_CODE;
}

export function getEmailBrandName(): string {
  return getMarketConfig(getEmailMarketCode()).brandName;
}
