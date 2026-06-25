import { describe, expect, it } from "vitest";
import {
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
});
