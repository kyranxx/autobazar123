import { afterEach, describe, expect, it, vi } from "vitest";
import { getCarsSortIndexName, type SearchSortOption } from "./sort-indices";

describe("getCarsSortIndexName", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the base index for all sort options by default", () => {
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
      ["price_asc", "ads"],
      ["price_desc", "ads"],
      ["year_desc", "ads"],
      ["mileage_asc", "ads"],
    ]);
  });

  it("supports explicit environment overrides per sort option", () => {
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ENABLE_REPLICA_SORT", "true");
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX_NEWEST", "cars_newest");
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX_PRICE_ASC", "cars_price_low_to_high");

    expect(getCarsSortIndexName("newest")).toBe("cars_newest");
    expect(getCarsSortIndexName("price_asc")).toBe("cars_price_low_to_high");
    expect(getCarsSortIndexName("price_desc")).toBe("cars_newest_price_desc");
  });

  it("supports explicit base index override without newest override", () => {
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX", "cars_live");
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ENABLE_REPLICA_SORT", "true");

    expect(getCarsSortIndexName("newest")).toBe("cars_live");
    expect(getCarsSortIndexName("price_desc")).toBe("cars_live_price_desc");
  });
});
