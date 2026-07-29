import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARKET_CODE,
  getMarketConfig,
  isMarketCode,
  normalizeMarketHost,
  resolveMarketCodeFromHost,
} from "./markets";

describe("market config", () => {
  it("uses Slovakia as the default market", () => {
    expect(DEFAULT_MARKET_CODE).toBe("SK");
    expect(getMarketConfig("SK").origin).toBe("https://www.autoninja.sk");
  });

  it("uses AutoNinja as the Romanian public brand and canonical domain", () => {
    expect(getMarketConfig("RO")).toMatchObject({
      brandName: "AutoNinja",
      domain: "www.autoninja.ro",
      origin: "https://www.autoninja.ro",
    });
  });

  it("uses the same default AutoNinja product presentation in every market", () => {
    for (const marketCode of ["SK", "RO"] as const) {
      const market = getMarketConfig(marketCode);

      expect(market.services.googleOneTapDefaultEnabled).toBe(true);
      expect(market.presentation).not.toHaveProperty("skinClassName");
      expect(market.presentation).not.toHaveProperty("resultsClassName");
      expect(market.presentation).not.toHaveProperty("showHomepageMascot");
    }
  });

  it.each([
    ["www.autoninja.sk", "SK"],
    ["autoninja.sk", "SK"],
    ["www.autoninja.ro", "RO"],
    ["autoninja.ro", "RO"],
    ["www.autoninja.ro", "RO"],
    ["autoninja.ro", "RO"],
    ["localhost:3000", "SK"],
    ["unknown.example", "SK"],
    [null, "SK"],
  ] as const)("resolves host %s to market %s", (host, expectedMarket) => {
    expect(resolveMarketCodeFromHost(host)).toBe(expectedMarket);
  });

  it("normalizes host names before matching domains", () => {
    expect(normalizeMarketHost(" WWW.AutoNinja.RO:443 ")).toBe(
      "www.autoninja.ro",
    );
  });

  it("accepts only known market codes", () => {
    expect(isMarketCode("SK")).toBe(true);
    expect(isMarketCode("RO")).toBe(true);
    expect(isMarketCode("CZ")).toBe(false);
    expect(isMarketCode("")).toBe(false);
  });
});
