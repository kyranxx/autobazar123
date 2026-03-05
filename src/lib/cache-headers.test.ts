import { describe, expect, it } from "vitest";
import { CACHE_HEADERS, ISR_REVALIDATE, generateRevalidateTags } from "./cache-headers";

describe("generateRevalidateTags", () => {
  it("returns type-only tag when id is missing", () => {
    expect(generateRevalidateTags("listing")).toEqual(["listing"]);
  });

  it("returns type and type-id tags when id is provided", () => {
    expect(generateRevalidateTags("listing", "123")).toEqual([
      "listing",
      "listing-123",
    ]);
  });
});

describe("cache header constants", () => {
  it("defines expected static and private cache headers", () => {
    expect(CACHE_HEADERS.STATIC_ASSET["Cache-Control"]).toContain("immutable");
    expect(CACHE_HEADERS.PRIVATE["Cache-Control"]).toContain("private");
    expect(CACHE_HEADERS.PRIVATE["Cache-Control"]).toContain("no-store");
    expect(CACHE_HEADERS.PRIVATE["Cache-Control"]).toContain("must-revalidate");
  });

  it("exposes canonical ISR revalidate values", () => {
    expect(ISR_REVALIDATE.REALTIME).toBe(1);
    expect(ISR_REVALIDATE.INDEFINITE).toBe(false);
  });
});
