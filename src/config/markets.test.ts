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
    expect(getMarketConfig("SK").origin).toBe("https://www.autobazar123.sk");
  });

  it.each([
    ["www.autobazar123.sk", "SK"],
    ["autobazar123.sk", "SK"],
    ["www.autobazar123.ro", "RO"],
    ["autobazar123.ro", "RO"],
    ["localhost:3000", "SK"],
    ["unknown.example", "SK"],
    [null, "SK"],
  ] as const)("resolves host %s to market %s", (host, expectedMarket) => {
    expect(resolveMarketCodeFromHost(host)).toBe(expectedMarket);
  });

  it("normalizes host names before matching domains", () => {
    expect(normalizeMarketHost(" WWW.Autobazar123.RO:443 ")).toBe(
      "www.autobazar123.ro",
    );
  });

  it("accepts only known market codes", () => {
    expect(isMarketCode("SK")).toBe(true);
    expect(isMarketCode("RO")).toBe(true);
    expect(isMarketCode("CZ")).toBe(false);
    expect(isMarketCode("")).toBe(false);
  });
});
