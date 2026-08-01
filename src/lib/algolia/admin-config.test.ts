import { describe, expect, it } from "vitest";
import { getCarsIndexSettings } from "./admin-config";

describe("getCarsIndexSettings", () => {
  it("marks market code as a filter-only facet for country-separated inventory", () => {
    expect(getCarsIndexSettings("cars_live").attributesForFaceting).toContain(
      "filterOnly(market_code)",
    );
  });

  it("marks VAT deductibility as a filter-only facet for detailed search", () => {
    expect(getCarsIndexSettings("cars_live").attributesForFaceting).toContain(
      "filterOnly(is_vat_deductible)",
    );
  });
});
