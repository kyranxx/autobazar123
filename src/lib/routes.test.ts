import { describe, expect, it } from "vitest";
import {
  getInternalMarketPath,
  getMarketPath,
  isLegacyMarketPath,
} from "./routes";

describe("market-aware public routes", () => {
  const romanianRoutes = [
    ["/moj-ucet", "/contul-meu"],
    ["/vysledky", "/masini"],
    ["/predajcovia", "/dealeri"],
    ["/kalkulacka-leasingu", "/calculator-leasing"],
    ["/ceny", "/preturi"],
    ["/kontakt", "/contact"],
    ["/o-nas", "/despre-noi"],
    ["/obchodne-podmienky", "/termeni-si-conditii"],
    ["/ochrana-udajov", "/politica-de-confidentialitate"],
    ["/auto/example", "/masina/example"],
    ["/predajca/example", "/dealeri/example"],
  ] as const;

  it.each(romanianRoutes)("maps %s to %s", (internalPath, romanianPath) => {
    expect(getMarketPath(internalPath, "RO")).toBe(romanianPath);
    expect(getInternalMarketPath(romanianPath, "RO")).toBe(internalPath);
  });

  it("localizes the Slovak inventory route", () => {
    expect(getMarketPath("/vysledky?brand=Skoda", "SK")).toBe(
      "/auta?brand=Skoda",
    );
    expect(getInternalMarketPath("/auta?brand=Skoda", "SK")).toBe(
      "/vysledky?brand=Skoda",
    );
  });

  it("localizes Romanian routes while preserving suffixes and queries", () => {
    expect(getMarketPath("/moj-ucet?tab=settings", "RO")).toBe(
      "/contul-meu?tab=settings",
    );
    expect(getMarketPath("/vysledky?brand=Dacia", "RO")).toBe(
      "/masini?brand=Dacia",
    );
    expect(getMarketPath("/auto/123-dacia-duster", "RO")).toBe(
      "/masina/123-dacia-duster",
    );
  });

  it("maps Romanian public URLs back to their internal routes", () => {
    expect(getInternalMarketPath("/masini?brand=Dacia", "RO")).toBe(
      "/vysledky?brand=Dacia",
    );
    expect(getInternalMarketPath("/dealeri/example", "RO")).toBe(
      "/predajca/example",
    );
  });

  it("detects legacy localized public paths", () => {
    expect(isLegacyMarketPath("/vysledky", "RO")).toBe(true);
    expect(isLegacyMarketPath("/masini", "RO")).toBe(false);
    expect(isLegacyMarketPath("/vysledky", "SK")).toBe(true);
    expect(isLegacyMarketPath("/auta", "SK")).toBe(false);
  });
});
