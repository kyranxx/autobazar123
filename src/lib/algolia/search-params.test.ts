import { describe, expect, it } from "vitest";
import { indexUiStateToSearchParams } from "./search-params";

describe("indexUiStateToSearchParams", () => {
  it("maps route-backed refinements and ranges into Algolia search params", () => {
    expect(
      indexUiStateToSearchParams({
        query: "BMW X5",
        refinementList: {
          brand: ["BMW", "Audi"],
          model: ["X5"],
          fuel: ["diesel"],
          location_city: ["Bratislava"],
          has_service_book: ["true"],
        },
        range: {
          price_eur: "12000:30000",
          mileage_km: ":150000",
          year: "2018:",
        },
      }),
    ).toEqual({
      query: "BMW X5",
      facetFilters: [
        ["brand:BMW", "brand:Audi"],
        ["model:X5"],
        ["fuel:diesel"],
        ["location_city:Bratislava"],
        ["has_service_book:true"],
      ],
      numericFilters: [
        "price_eur>=12000",
        "price_eur<=30000",
        "mileage_km<=150000",
        "year>=2018",
      ],
    });
  });

  it("omits empty filter groups", () => {
    expect(indexUiStateToSearchParams({})).toEqual({
      query: "",
    });
  });
});
