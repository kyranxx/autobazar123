import { getMarketConfig, type MarketCode } from "@/config/markets";
import { getTrimmedEnv } from "@/lib/env";

export function getEmailMarketCode(): MarketCode {
  return getTrimmedEnv("NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE")?.toUpperCase() === "RO"
    ? "RO"
    : "SK";
}

export function getEmailBrandName(): "Autobazar123" | "AutoNinja" {
  return getMarketConfig(getEmailMarketCode()).brandName;
}
