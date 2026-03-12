import { describe, expect, it } from "vitest";
import {
  normalizeRouteQuery,
  routeQueryToIndexUiState,
  shouldApplyRouteQueryToIndexUiState,
} from "@/lib/algolia/route-sync";

describe("normalizeRouteQuery", () => {
  it("returns canonical query ordering", () => {
    expect(
      normalizeRouteQuery("model=Octavia&brand=Skoda&model=Fabia&q= family car "),
    ).toBe("q=family+car&brand=Skoda&model=Fabia&model=Octavia");
  });
});

describe("routeQueryToIndexUiState", () => {
  it("parses query into index ui state", () => {
    expect(routeQueryToIndexUiState("q=octavia&brand=Skoda&priceFrom=5000")).toEqual({
      query: "octavia",
      refinementList: {
        brand: ["Skoda"],
      },
      range: {
        price_eur: "5000:",
      },
    });
  });
});

describe("shouldApplyRouteQueryToIndexUiState", () => {
  it("does not apply when route query was already applied", () => {
    expect(
      shouldApplyRouteQueryToIndexUiState({
        routeQuery: "brand=Skoda",
        currentUiState: {},
        lastAppliedRouteQuery: "brand=Skoda",
      }),
    ).toBe(false);
  });

  it("does not apply when current state already matches route query", () => {
    expect(
      shouldApplyRouteQueryToIndexUiState({
        routeQuery: "model=Octavia&brand=Skoda",
        currentUiState: {
          refinementList: {
            brand: ["Skoda"],
            model: ["Octavia"],
          },
        },
        lastAppliedRouteQuery: null,
      }),
    ).toBe(false);
  });

  it("applies when route query differs from current state", () => {
    expect(
      shouldApplyRouteQueryToIndexUiState({
        routeQuery: "brand=Ford&model=Focus",
        currentUiState: {
          refinementList: {
            brand: ["Skoda"],
            model: ["Octavia"],
          },
        },
        lastAppliedRouteQuery: null,
      }),
    ).toBe(true);
  });
});

