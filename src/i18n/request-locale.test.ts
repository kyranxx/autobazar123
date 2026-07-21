import { describe, expect, it } from "vitest";
import { resolveRequestLocaleSettings } from "./request-locale";

describe("request locale settings", () => {
  it("lets an explicit locale cookie override the market default", () => {
    expect(
      resolveRequestLocaleSettings({
        localeCookie: "en",
        acceptLanguage: "ro-RO,ro;q=0.9",
        host: "www.autoninja.ro",
      }),
    ).toEqual({ locale: "en", timeZone: "Europe/Bucharest" });
  });

  it("defaults Romanian market hosts to Romanian even when the browser prefers Slovak", () => {
    expect(
      resolveRequestLocaleSettings({
        localeCookie: null,
        acceptLanguage: "sk-SK,sk;q=0.9",
        host: "www.autoninja.ro",
      }),
    ).toEqual({ locale: "ro", timeZone: "Europe/Bucharest" });
  });

  it("keeps Romanian locale after an internal localized-route rewrite", () => {
    expect(
      resolveRequestLocaleSettings({
        localeCookie: null,
        acceptLanguage: "sk-SK,sk;q=0.9",
        host: "internal.vercel.app",
        marketCode: "RO",
      }),
    ).toEqual({ locale: "ro", timeZone: "Europe/Bucharest" });
  });

  it("uses Accept-Language only when the host is not a configured market", () => {
    expect(
      resolveRequestLocaleSettings({
        localeCookie: null,
        acceptLanguage: "hu-HU,hu;q=0.9",
        host: "localhost:3000",
      }),
    ).toEqual({ locale: "hu", timeZone: "Europe/Bratislava" });
  });
});
