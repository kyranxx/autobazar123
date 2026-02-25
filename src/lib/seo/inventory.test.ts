import { describe, expect, it } from "vitest";
import { buildSeoInventoryFilter, normalizeSeoInventoryHits } from "./inventory";

describe("buildSeoInventoryFilter", () => {
  it("builds brand and model filters", () => {
    expect(
      buildSeoInventoryFilter({
        brandName: "Skoda",
        modelName: "Octavia",
      }),
    ).toBe('brand:"Skoda" AND model:"Octavia"');
  });

  it("includes city filter and escapes quotes", () => {
    expect(
      buildSeoInventoryFilter({
        brandName: 'AC "Test"',
        modelName: "Roadster",
        cityName: 'Banska "Bystrica"',
      }),
    ).toBe(
      'brand:"AC \\"Test\\"" AND model:"Roadster" AND location_city:"Banska \\"Bystrica\\""',
    );
  });
});

describe("normalizeSeoInventoryHits", () => {
  it("maps and limits normalized listings", () => {
    const listings = normalizeSeoInventoryHits(
      [
        {
          objectID: "ad-1",
          brand: "Skoda",
          model: "Octavia",
          year: 2020,
          price_eur: 14500,
          mileage_km: 85000,
          fuel: "Diesel",
          location_city: "Bratislava",
          photos_json: ["https://img.example/1.jpg"],
        },
        {
          objectID: "ad-2",
          brand: "Skoda",
          model: "Octavia",
          year: "2019",
          price_eur: "13000",
          mileage_km: "92000",
          photos_json: [],
        },
      ],
      1,
    );

    expect(listings).toHaveLength(1);
    expect(listings[0]).toMatchObject({
      id: "ad-1",
      brand: "Skoda",
      model: "Octavia",
      year: 2020,
      priceEur: 14500,
      mileageKm: 85000,
      fuel: "Diesel",
      city: "Bratislava",
      image: "https://img.example/1.jpg",
    });
  });

  it("drops invalid rows and uses fallback image", () => {
    const listings = normalizeSeoInventoryHits([
      null,
      { objectID: "" },
      { objectID: "ad-1", photos_json: [null], year: "NaN" },
      { objectID: "ad-1", photos_json: ["https://dup.example/1.jpg"] },
    ]);

    expect(listings).toHaveLength(1);
    expect(listings[0].id).toBe("ad-1");
    expect(listings[0].image).toBe("/placeholder-car.jpg");
    expect(listings[0].year).toBeNull();
  });
});
