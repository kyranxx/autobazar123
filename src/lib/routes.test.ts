import { describe, expect, it } from "vitest";
import { getInternalMarketPath, getMarketPath, isLegacyMarketPath } from "./routes";

describe("Romanian public routes", () => {
  const routes = [
    ["/vysledky", "/masini"], ["/predajcovia", "/dealeri"],
    ["/kalkulacka-leasingu", "/calculator-leasing"], ["/ceny", "/preturi"],
    ["/kontakt", "/contact"], ["/o-nas", "/despre-noi"],
    ["/obchodne-podmienky", "/termeni-si-conditii"],
    ["/ochrana-udajov", "/politica-de-confidentialitate"],
    ["/auto/example", "/masina/example"], ["/predajca/example", "/dealeri/example"],
  ] as const;

  it.each(routes)("maps %s to %s", (internal, localized) => {
    expect(getMarketPath(internal, "RO")).toBe(localized);
    expect(getInternalMarketPath(localized, "RO")).toBe(internal);
  });

  it("preserves queries and leaves Slovak paths unchanged", () => {
    expect(getMarketPath("/vysledky?brand=Dacia", "RO")).toBe("/masini?brand=Dacia");
    expect(getMarketPath("/vysledky", "SK")).toBe("/vysledky");
    expect(isLegacyMarketPath("/vysledky", "RO")).toBe(true);
  });
});
