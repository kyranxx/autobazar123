import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICING_CONFIG_V1,
  buildSharedPricingSummary,
  pricingCentsToEuroInput,
  pricingEuroInputToCents,
} from "./config";

describe("pricing admin currency helpers", () => {
  it("round-trips stored cents through owner-facing EUR inputs", () => {
    expect(pricingCentsToEuroInput(499)).toBe("4.99");
    expect(pricingCentsToEuroInput(10000)).toBe("100");
    expect(pricingEuroInputToCents("4.99")).toBe(499);
    expect(pricingEuroInputToCents("4,99")).toBe(499);
  });

  it("keeps invalid or negative owner input as zero cents", () => {
    expect(pricingEuroInputToCents("")).toBe(0);
    expect(pricingEuroInputToCents("abc")).toBe(0);
    expect(pricingEuroInputToCents("-1")).toBe(0);
  });

  it("localizes shared pricing banner copy for Romanian market pages", () => {
    const summary = buildSharedPricingSummary(DEFAULT_PRICING_CONFIG_V1, "ro-RO");

    expect(summary.globalBanner).toBe(
      "Anunț gratuit acum. Premium de la 4,99 EUR. Exclusive 9,99 EUR.",
    );
    expect(summary.homepageSeller).toBe(
      "Adaugă anunț gratuit. Premium 4,99 EUR. Exclusive 9,99 EUR.",
    );
    expect(summary.dealerTopup).toBe(
      "Sold preplătit pentru anunțuri, cu bonus la încărcare.",
    );
  });
});
