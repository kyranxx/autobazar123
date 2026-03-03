import { describe, expect, it } from "vitest";
import { buildAdPath, extractAdIdFromRouteParam } from "@/lib/cars/ad-path";

describe("ad-path", () => {
  const id = "75573f75-b6c0-458c-adf7-c165e5b32e5e";

  it("builds canonical ad path with slug", () => {
    expect(
      buildAdPath({
        id,
        brand: "Skoda",
        model: "Octavia RS",
        year: 2021,
      }),
    ).toBe(`/auto/${id}-skoda-octavia-rs-2021`);
  });

  it("falls back to UUID-only path when slug data is missing", () => {
    expect(buildAdPath({ id })).toBe(`/auto/${id}`);
  });

  it("extracts UUID from slugged route param", () => {
    expect(
      extractAdIdFromRouteParam(`${id}-skoda-octavia-rs-2021`),
    ).toBe(id);
  });
});
