import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createMarketRegistry,
  MARKET_DEFINITIONS,
  type MarketDefinition,
} from "./markets";
import { translateMarketPath } from "@/lib/routes";

const futureCzechMarket = {
  code: "CZ",
  countryCode: "CZ",
  brandName: "AutoNinja",
  domain: "www.autoninja.cz",
  origin: "https://www.autoninja.cz",
  locale: "cs",
  languageTag: "cs-CZ",
  currency: "CZK",
  timeZone: "Europe/Prague",
  callingCode: "420",
  phonePlaceholder: "+420 XXX XXX XXX",
  hosts: ["autoninja.cz", "www.autoninja.cz"],
  routeMappings: [
    { internalPath: "/vysledky", publicPath: "/auta", match: "prefix" },
    { internalPath: "/ceny", publicPath: "/ceny", match: "exact" },
  ],
  presentation: {
    sellerImageAlt: "Prodejní prostor s vozidly",
  },
  contact: {
    email: "info@autoninja.cz",
    phoneDisplay: null,
    phoneHref: null,
    postalAddressLines: ["AutoNinja CZ"],
  },
  copy: {
    llmsDescription: "AutoNinja is a Czech car marketplace.",
    listingDescriptionAction: "Kup\u0074e na AutoNinja.",
    authEmail: {
      defaultUserName: "Uživatel",
      registrationSubject: "Potvrzení registrace",
      registrationIntro: "Potvrďte registraci na",
      registrationAction: "Dokončete aktivaci účtu zde",
      registrationLogin: "Přihlášení po potvrzení",
      passwordResetSubject: "Obnovení hesla",
      passwordResetIntro: "Obnovení hesla pro účet",
      passwordResetAction: "Nastavte nové heslo zde",
      passwordResetIgnore: "Pokud jste o změnu nežádali, e-mail ignorujte.",
      supportLabel: "Podpora",
    },
  },
  services: {
    googleOneTapDefaultEnabled: false,
  },
} as const satisfies MarketDefinition;

describe("market registry extension contract", () => {
  it("has a translation catalog for every production market locale", () => {
    for (const market of MARKET_DEFINITIONS) {
      expect(
        existsSync(
          resolve(process.cwd(), "src", "i18n", "messages", `${market.locale}.json`),
        ),
        `${market.code} must provide src/i18n/messages/${market.locale}.json`,
      ).toBe(true);
    }
  });

  it("registers a future TLD without country-specific resolver code", () => {
    const registry = createMarketRegistry([futureCzechMarket]);

    expect(registry.resolveHost("WWW.AutoNinja.CZ:443")?.code).toBe("CZ");
    expect(registry.resolveLocale("cs-CZ")?.domain).toBe("www.autoninja.cz");
  });

  it("uses the future market's declarative route mappings in both directions", () => {
    expect(
      translateMarketPath(
        "/vysledky/skoda?q=octavia",
        futureCzechMarket.routeMappings,
        "internal-to-public",
      ),
    ).toBe("/auta/skoda?q=octavia");

    expect(
      translateMarketPath(
        "/auta/skoda?q=octavia",
        futureCzechMarket.routeMappings,
        "public-to-internal",
      ),
    ).toBe("/vysledky/skoda?q=octavia");
  });

  it("rejects duplicate hosts before a market can ship", () => {
    expect(() =>
      createMarketRegistry([
        futureCzechMarket,
        {
          ...futureCzechMarket,
          code: "CZ2",
          locale: "cs2",
          domain: "shop.autoninja.cz",
          origin: "https://shop.autoninja.cz",
        },
      ]),
    ).toThrow(/Duplicate or invalid market host/);
  });
});
