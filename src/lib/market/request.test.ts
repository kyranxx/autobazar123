import { describe, expect, it } from "vitest";
import {
  resolveMarketCodeFromHeaders,
  resolveMarketConfigFromHeaders,
} from "./request";

describe("request market resolution", () => {
  it("prefers forwarded host headers when resolving a market", () => {
    const headers = new Headers({
      host: "internal.vercel.app",
      "x-forwarded-host": "www.autobazar123.ro",
    });

    expect(resolveMarketCodeFromHeaders(headers)).toBe("RO");
    expect(resolveMarketConfigFromHeaders(headers).origin).toBe(
      "https://www.autobazar123.ro",
    );
  });

  it("keeps the proxy-resolved market across an internal route rewrite", () => {
    const headers = new Headers({
      host: "internal.vercel.app",
      "x-forwarded-host": "internal.vercel.app",
      "x-autobazar-market": "RO",
    });

    expect(resolveMarketCodeFromHeaders(headers)).toBe("RO");
    expect(resolveMarketConfigFromHeaders(headers).origin).toBe(
      "https://www.autobazar123.ro",
    );
  });

  it("falls back to Slovakia when headers do not identify a known market", () => {
    expect(resolveMarketCodeFromHeaders(new Headers())).toBe("SK");
  });
});
