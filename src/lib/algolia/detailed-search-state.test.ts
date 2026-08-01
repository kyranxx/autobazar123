import { describe, expect, it } from "vitest";
import {
  detailedSearchStateFromParams,
  detailedSearchStateToParams,
} from "./detailed-search-state";

describe("detailed search URL state", () => {
  it("hydrates the full detailed-search form from existing result backlinks", () => {
    const state = detailedSearchStateFromParams(
      new URLSearchParams(
        "q=octavia&brand=Škoda&brand=Volkswagen&model=Octavia&fuel=diesel&bodyStyle=combi&transmission=automatic&location=Bratislava&priceFrom=10000&priceTo=25000&mileageTo=150000&yearFrom=2018&powerFrom=90&powerTo=140&hasServiceBook=true&vatDeductible=true",
      ),
    );

    expect(state).toEqual({
      q: "octavia",
      brands: ["Škoda", "Volkswagen"],
      model: "Octavia",
      fuels: ["diesel"],
      bodyStyles: ["combi"],
      transmissions: ["automatic"],
      locations: ["Bratislava"],
      priceFrom: "10000",
      priceTo: "25000",
      mileageFrom: "",
      mileageTo: "150000",
      yearFrom: "2018",
      yearTo: "",
      powerFrom: "90",
      powerTo: "140",
      hasServiceBook: true,
      notCrashed: false,
      boughtInSk: false,
      vatDeductible: true,
    });
  });

  it("serializes detailed form state using the existing result URL contract", () => {
    const params = detailedSearchStateToParams({
      q: "  BMW X3  ",
      brands: ["BMW", "Audi"],
      model: "X3",
      fuels: ["diesel", "hybrid"],
      bodyStyles: ["suv"],
      transmissions: ["automatic"],
      locations: ["Bratislava"],
      priceFrom: "25000",
      priceTo: "",
      mileageFrom: "",
      mileageTo: "120000",
      yearFrom: "2019",
      yearTo: "2024",
      powerFrom: "110",
      powerTo: "",
      hasServiceBook: true,
      notCrashed: true,
      boughtInSk: false,
      vatDeductible: true,
    });

    expect(params.toString()).toBe(
      "q=BMW+X3&brand=Audi&brand=BMW&model=X3&fuel=diesel&fuel=hybrid&transmission=automatic&location=Bratislava&bodyStyle=suv&hasServiceBook=true&notCrashed=true&vatDeductible=true&priceFrom=25000&mileageTo=120000&yearFrom=2019&yearTo=2024&powerFrom=110",
    );
  });
});
