import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MARKET_CODE,
  getDeploymentMarketCode,
  getMarketConfig,
  isMarketCode,
  normalizeMarketHost,
  resolveMarketCodeFromHost,
} from "./markets";

describe("market config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it("uses the deployment market for preview and unknown hosts", () => {
    vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE", "RO");

    expect(
      resolveMarketCodeFromHost("autobazar123-ro-git-main.vercel.app"),
    ).toBe("RO");
    expect(resolveMarketCodeFromHost("localhost:3000")).toBe("RO");
  });

  it("keeps the deployment market authoritative even on a mismatched host", () => {
    vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE", "RO");

    expect(getDeploymentMarketCode()).toBe("RO");
    expect(resolveMarketCodeFromHost("www.autobazar123.sk")).toBe("RO");
  });

  it("rejects an unknown deployment market", () => {
    vi.stubEnv("NEXT_PUBLIC_DEPLOYMENT_MARKET_CODE", "CZ");

    expect(getDeploymentMarketCode()).toBeNull();
    expect(resolveMarketCodeFromHost("preview.example")).toBe("SK");
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
