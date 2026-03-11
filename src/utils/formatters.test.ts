import { describe, expect, it } from "vitest";
import { formatDate, formatPrice, normalizeText } from "./formatters";

describe("normalizeText", () => {
  it("removes accents, lowercases, and trims", () => {
    expect(normalizeText("  \u010cerven\u00e1 \u0160koda  ")).toBe("cervena skoda");
  });

  it("keeps internal spacing untouched", () => {
    expect(normalizeText("A   B")).toBe("a   b");
  });
});

describe("formatPrice", () => {
  it("formats thousands in Slovak locale", () => {
    const formatted = formatPrice(1234567);
    expect(formatted).toMatch(/1[\s\u00A0]?234[\s\u00A0]?567/);
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("0");
  });
});

describe("formatDate", () => {
  it("formats a valid date into Slovak date text", () => {
    const formatted = formatDate("2026-01-15T12:00:00.000Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("15");
  });

  it("returns Invalid Date for invalid input", () => {
    expect(formatDate("not-a-date")).toContain("Invalid");
  });
});
