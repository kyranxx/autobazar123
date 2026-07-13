import { describe, expect, it } from "vitest";
import { getMarketConfig } from "@/config/markets";
import {
  getPublicMarketCopyForLocale,
  resolvePublicCopyMarketCode,
} from "./public-copy";

describe("public market copy locale selection", () => {
  it("uses Romanian visible copy when a rewritten route resolves locale ro", () => {
    const fallbackMarket = getMarketConfig("SK");

    expect(resolvePublicCopyMarketCode("ro", fallbackMarket.code)).toBe("RO");
    expect(getPublicMarketCopyForLocale(fallbackMarket, "ro")).toMatchObject({
      languageTag: "ro-RO",
      listingsLabel: "Anunțuri",
      countryName: "România",
    });
  });

  it("keeps Slovak copy on Slovak routes", () => {
    const market = getMarketConfig("SK");

    expect(resolvePublicCopyMarketCode("sk", market.code)).toBe("SK");
    expect(getPublicMarketCopyForLocale(market, "sk")).toMatchObject({
      languageTag: "sk-SK",
      listingsLabel: "Inzeráty",
      countryName: "Slovensko",
    });
  });
});
