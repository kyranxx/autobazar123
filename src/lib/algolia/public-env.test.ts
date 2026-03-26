import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCarsIndexName,
  getCarsSortIndexOverrides,
  getPublicAlgoliaAppId,
  getPublicAlgoliaSearchKey,
  isCarsReplicaSortEnabled,
  shouldSuppressMissingAlgoliaKeyWarning,
} from "./public-env";

describe("algolia public env helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the default cars index when no override is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX", "");

    expect(getCarsIndexName()).toBe("ads");
  });

  it("reads public algolia configuration lazily from env", () => {
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_APP_ID", "app-123");
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_SEARCH_KEY", "search-456");
    vi.stubEnv("NEXT_PUBLIC_SUPPRESS_ALGOLIA_MISSING_KEYS_WARNING", "true");

    expect(getPublicAlgoliaAppId()).toBe("app-123");
    expect(getPublicAlgoliaSearchKey()).toBe("search-456");
    expect(shouldSuppressMissingAlgoliaKeyWarning()).toBe(true);
  });

  it("builds sort index overrides from explicit env values", () => {
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX", "cars_live");
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX_NEWEST", "cars_newest");
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ADS_INDEX_PRICE_DESC", "cars_price_desc");

    expect(getCarsSortIndexOverrides()).toEqual({
      newest: "cars_newest",
      price_asc: null,
      price_desc: "cars_price_desc",
      year_desc: null,
      mileage_asc: null,
    });
  });

  it("treats replica sorting as enabled unless explicitly disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ENABLE_REPLICA_SORT", "");

    expect(isCarsReplicaSortEnabled()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_ALGOLIA_ENABLE_REPLICA_SORT", "false");

    expect(isCarsReplicaSortEnabled()).toBe(false);
  });
});
