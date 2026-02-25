import { describe, expect, it } from "vitest";
import {
  indexUiStateToRouteParams,
  routeParamsToIndexUiState,
} from "./url-state";

describe("routeParamsToIndexUiState", () => {
  it("hydrates query, refinements, and ranges from homepage query params", () => {
    const params = new URLSearchParams(
      "q=octavia&brand=Skoda&model=Octavia&fuel=diesel&transmission=manual&priceFrom=10000&priceTo=20000&yearFrom=2018&yearTo=2022",
    );

    expect(routeParamsToIndexUiState(params)).toEqual({
      query: "octavia",
      refinementList: {
        brand: ["Skoda"],
        model: ["Octavia"],
        fuel: ["diesel"],
        transmission: ["manual"],
      },
      range: {
        price_eur: "10000:20000",
        year: "2018:2022",
      },
    });
  });

  it("supports repeated and comma-separated refinement values", () => {
    const params = new URLSearchParams(
      "brand=Skoda&brand=BMW&fuel=diesel,hybrid",
    );

    expect(routeParamsToIndexUiState(params)).toEqual({
      refinementList: {
        brand: ["Skoda", "BMW"],
        fuel: ["diesel", "hybrid"],
      },
    });
  });
});

describe("indexUiStateToRouteParams", () => {
  it("serializes query, refinements, and ranges back to URL params", () => {
    const params = indexUiStateToRouteParams({
      query: "audi",
      refinementList: {
        brand: ["Audi", "BMW"],
        transmission: ["automatic"],
      },
      range: {
        price_eur: "15000:45000",
        year: "2019:",
      },
    });

    expect(params.toString()).toBe(
      "q=audi&brand=Audi&brand=BMW&transmission=automatic&priceFrom=15000&priceTo=45000&yearFrom=2019",
    );
  });
});
