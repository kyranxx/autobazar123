"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_MARKET_CODE,
  getMarketConfig,
  type MarketCode,
  type MarketConfig,
} from "@/config/markets";

const MarketContext = createContext<MarketCode>(DEFAULT_MARKET_CODE);

export function MarketProvider({
  children,
  marketCode,
}: {
  children: ReactNode;
  marketCode: MarketCode;
}) {
  return (
    <MarketContext.Provider value={marketCode}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarketCode(): MarketCode {
  return useContext(MarketContext);
}

export function useMarket(): MarketConfig {
  return getMarketConfig(useMarketCode());
}
