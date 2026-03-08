import { describe, expect, it } from "vitest";
import { parseSearchCountFilters } from "./route";

describe("parseSearchCountFilters", () => {
  it("normalizes search preview filters into safe query inputs", () => {
    const filters = parseSearchCountFilters(
      new URLSearchParams({
        q: "Audi, A4; Bratislava<script>",
        brand: "Audi",
        model: "A4",
        fuel: "Diesel",
        transmission: "Automatic",
        bodyStyle: "SUV",
        location: "Banska Bystrica",
        priceFrom: "12000 EUR",
        priceTo: "30000",
        yearFrom: "2018",
        yearTo: "2024",
        hasServiceBook: "true",
        notCrashed: "true",
        boughtInSk: "false",
      }),
    );

    expect(filters).toEqual({
      q: "Audi A4 Bratislava script",
      brand: ["Audi"],
      model: "A4",
      fuel: "diesel",
      transmission: "automatic",
      bodyStyle: "suv",
      location: "Banska Bystrica",
      priceFrom: 12000,
      priceTo: 30000,
      yearFrom: 2018,
      yearTo: 2024,
      hasServiceBook: true,
      notCrashed: true,
      boughtInSk: false,
    });
  });
});
