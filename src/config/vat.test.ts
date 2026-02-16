import { describe, expect, it } from "vitest";
import {
  VAT_MULTIPLIER,
  VAT_RATE,
  calculateGrossPrice,
  calculateNetPrice,
  calculateVatAmount,
  formatCurrency,
  formatCurrencyWithDecimals,
  formatPriceWithVat,
} from "./vat";

describe("VAT constants", () => {
  it("uses Slovak 23% VAT", () => {
    expect(VAT_RATE).toBe(0.23);
    expect(VAT_MULTIPLIER).toBe(1.23);
  });
});

describe("VAT calculations", () => {
  it("calculates net price from gross", () => {
    expect(calculateNetPrice(123)).toBe(100);
  });

  it("calculates gross price from net", () => {
    expect(calculateGrossPrice(100)).toBe(123);
  });

  it("calculates VAT amount from gross", () => {
    expect(calculateVatAmount(123)).toBe(23);
  });

  it("keeps roundtrip precision within 0.01", () => {
    const gross = 19999;
    const net = calculateNetPrice(gross);
    const rebuiltGross = calculateGrossPrice(net);

    expect(Math.abs(rebuiltGross - gross)).toBeLessThanOrEqual(0.01);
  });
});

describe("VAT formatting", () => {
  it("formats whole-currency Slovak output", () => {
    const value = formatCurrency(12345);
    expect(value).toContain("€");
    expect(value).toMatch(/12[\s\u00A0]?345/);
  });

  it("formats decimal Slovak output", () => {
    const value = formatCurrencyWithDecimals(123.4);
    expect(value).toContain("€");
    expect(value).toMatch(/123/);
  });

  it("returns a full VAT breakdown payload", () => {
    const payload = formatPriceWithVat(123);

    expect(payload.gross).toContain("€");
    expect(payload.net).toContain("€");
    expect(payload.vatAmount).toContain("€");
    expect(payload.vatLabel).toContain("bez DPH");
  });
});
