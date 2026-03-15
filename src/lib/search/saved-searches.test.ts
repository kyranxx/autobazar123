import { describe, expect, it } from "vitest";
import {
  createSavedSearchFingerprint,
  createSavedSearchLabel,
  parseSavedSearchFilters,
  savedSearchFiltersToParams,
} from "./saved-searches";

describe("parseSavedSearchFilters", () => {
  it("normalizes search params into a stable filter object", () => {
    const params = new URLSearchParams(
      "q=Octavia&brand=Skoda&brand=Volkswagen&fuel=Diesel&priceTo=25000&hasServiceBook=true",
    );

    expect(parseSavedSearchFilters(params)).toEqual({
      q: "Octavia",
      brand: ["Skoda", "Volkswagen"],
      model: "",
      fuel: "diesel",
      transmission: "",
      bodyStyle: "",
      location: "",
      priceTo: 25000,
      hasServiceBook: true,
      notCrashed: false,
      boughtInSk: false,
    });
  });
});

describe("savedSearchFiltersToParams", () => {
  it("round-trips parsed filters into URL params", () => {
    const parsed = parseSavedSearchFilters(
      new URLSearchParams(
        "q=Octavia&brand=Skoda&location=Bratislava&priceTo=25000&notCrashed=true",
      ),
    );

    expect(savedSearchFiltersToParams(parsed).toString()).toBe(
      "q=Octavia&brand=Skoda&location=Bratislava&priceTo=25000&notCrashed=true",
    );
  });
});

describe("createSavedSearchFingerprint", () => {
  it("stays stable regardless of brand param order", () => {
    const first = parseSavedSearchFilters(
      new URLSearchParams("brand=Volkswagen&brand=Skoda&priceTo=25000"),
    );
    const second = parseSavedSearchFilters(
      new URLSearchParams("brand=Skoda&brand=Volkswagen&priceTo=25000"),
    );

    expect(createSavedSearchFingerprint(first)).toBe(
      createSavedSearchFingerprint(second),
    );
  });
});

describe("createSavedSearchLabel", () => {
  it("builds a concise human label from the most useful filters", () => {
    const filters = parseSavedSearchFilters(
      new URLSearchParams("brand=BMW&model=X5&location=Bratislava&priceTo=25000"),
    );

    expect(createSavedSearchLabel(filters)).toBe("BMW • X5 • Bratislava • do 25\u00A0000 EUR");
  });
});
