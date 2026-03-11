import { describe, expect, it } from "vitest";
import { searchFallbackCatalog } from "./fallback-search";
import type { AlgoliaCarRecord } from "./index";

const catalog: AlgoliaCarRecord[] = [
  {
    objectID: "1",
    brand: "Skoda",
    model: "Octavia",
    generation: "",
    year: 2020,
    price_eur: 15500,
    mileage_km: 98000,
    fuel: "diesel",
    transmission: "manual",
    body_style: "wagon",
    power_kw: 110,
    location_city: "Bratislava",
    photos_json: [],
    is_top_ad: true,
    is_highlighted: false,
    is_vat_deductible: false,
    has_service_book: true,
    not_crashed: true,
    is_bought_in_sk: true,
    created_at: new Date("2026-03-01T10:00:00Z").getTime(),
  },
  {
    objectID: "2",
    brand: "Skoda",
    model: "Fabia",
    generation: "",
    year: 2018,
    price_eur: 8900,
    mileage_km: 120000,
    fuel: "petrol",
    transmission: "manual",
    body_style: "hatchback",
    power_kw: 66,
    location_city: "Košice",
    photos_json: [],
    is_top_ad: false,
    is_highlighted: false,
    is_vat_deductible: false,
    has_service_book: false,
    not_crashed: true,
    is_bought_in_sk: false,
    created_at: new Date("2026-02-20T10:00:00Z").getTime(),
  },
  {
    objectID: "3",
    brand: "Volkswagen",
    model: "Golf",
    generation: "",
    year: 2021,
    price_eur: 17200,
    mileage_km: 87000,
    fuel: "diesel",
    transmission: "automatic",
    body_style: "hatchback",
    power_kw: 110,
    location_city: "Bratislava",
    photos_json: [],
    is_top_ad: false,
    is_highlighted: true,
    is_vat_deductible: true,
    has_service_book: true,
    not_crashed: true,
    is_bought_in_sk: false,
    created_at: new Date("2026-03-03T10:00:00Z").getTime(),
  },
];

describe("searchFallbackCatalog", () => {
  it("filters hits by query, facet filters, and numeric filters", () => {
    const response = searchFallbackCatalog(catalog, {
      indexName: "ads",
      params: {
        query: "octa",
        facetFilters: ["brand:Skoda", "location_city:Bratislava", "has_service_book:true"],
        numericFilters: ["price_eur<=16000", "year>=2019"],
        hitsPerPage: 24,
        page: 0,
        facets: ["brand", "location_city"],
      },
    });

    expect(response.nbHits).toBe(1);
    expect(response.hits.map((hit) => hit.objectID)).toEqual(["1"]);
    expect(response.facets?.brand).toEqual({ Skoda: 1 });
    expect(response.facets?.location_city).toEqual({ Bratislava: 1 });
  });

  it("applies replica-sort suffixes when sorting fallback hits", () => {
    const response = searchFallbackCatalog(catalog, {
      indexName: "ads_price_asc",
      params: {
        hitsPerPage: 24,
        page: 0,
        facets: [],
      },
    });

    expect(response.hits.map((hit) => hit.objectID)).toEqual(["2", "1", "3"]);
  });

  it("collects facet counts and numeric stats from the filtered result set", () => {
    const response = searchFallbackCatalog(catalog, {
      indexName: "ads",
      params: {
        facetFilters: [["fuel:diesel", "fuel:petrol"]],
        numericFilters: ["year>=2020"],
        hitsPerPage: 24,
        page: 0,
        facets: ["fuel", "transmission"],
      },
    });

    expect(response.nbHits).toBe(2);
    expect(response.facets?.fuel).toEqual({ diesel: 2 });
    expect(response.facets?.transmission).toEqual({ automatic: 1, manual: 1 });
    expect(response.facets_stats?.price_eur).toMatchObject({
      min: 15500,
      max: 17200,
    });
    expect(response.facets_stats?.year).toMatchObject({
      min: 2020,
      max: 2021,
    });
  });
});
