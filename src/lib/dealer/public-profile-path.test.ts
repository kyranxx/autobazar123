import { describe, expect, it } from "vitest";
import { buildDealerPublicProfilePath } from "./public-profile-path";

describe("buildDealerPublicProfilePath", () => {
  it("builds canonical localized dealer profile path", () => {
    expect(buildDealerPublicProfilePath("autobazar-plus")).toBe(
      "/predajca/autobazar-plus",
    );
  });

  it("trims and URL-encodes slug value", () => {
    expect(buildDealerPublicProfilePath("  dealer showroom  ")).toBe(
      "/predajca/dealer%20showroom",
    );
  });
});

