import { afterEach, describe, expect, it, vi } from "vitest";
import { getCarsSortIndexName, type SearchSortOption } from "./sort-indices";

describe("getCarsSortIndexName", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps sort options to Algolia replica index names by default", () => {
    const options: SearchSortOption[] = [
      "newest",
      "price_asc",
      "price_desc",
      "year_desc",
      "mileage_asc",
    ];

    const result = options.map((option) => [option, getCarsSortIndexName(option)]);

    expect(result).toEqual([
      ["newest", "ads"],
      ["price_asc", "ads_price_asc"],
      ["price_desc", "ads_price_desc"],
      ["year_desc", "ads_year_desc"],
      ["mileage_asc", "ads_mileage_asc"],
    ]);
  });

  it("supports explicit environment overrides per sort option", () => {
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX_NEWEST", "cars_newest");
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX_PRICE_ASC", "cars_price_low_to_high");

    expect(getCarsSortIndexName("newest")).toBe("cars_newest");
    expect(getCarsSortIndexName("price_asc")).toBe("cars_price_low_to_high");
    expect(getCarsSortIndexName("price_desc")).toBe("cars_newest_price_desc");
  });
});
