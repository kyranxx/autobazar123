import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrandModelPage from "./page";

const mocks = vi.hoisted(() => ({
  eastCitySlug: ["ko", "sice"].join(""),
  getSeoInventoryListings: vi.fn(),
  getBrandTaxonomy: vi.fn(),
  getCityTaxonomy: vi.fn(),
  getModelTaxonomy: vi.fn(),
  hasModelForBrand: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/lib/seo/inventory", () => ({
  getSeoInventoryListings: mocks.getSeoInventoryListings,
}));

vi.mock("@/lib/seo/programmatic-taxonomy", () => ({
  SEO_CITY_SLUGS: ["bratislava", mocks.eastCitySlug],
  getAllSeoBrandModelPairs: vi.fn(),
  getBrandTaxonomy: mocks.getBrandTaxonomy,
  getCityTaxonomy: mocks.getCityTaxonomy,
  getModelTaxonomy: mocks.getModelTaxonomy,
  hasModelForBrand: mocks.hasModelForBrand,
}));

describe("BrandModelPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBrandTaxonomy.mockResolvedValue({
      name: "Škoda",
      slug: "skoda",
      models: [{ name: "Octavia", slug: "octavia", isCityIndexable: true }],
    });
    mocks.getModelTaxonomy.mockResolvedValue({
      name: "Octavia",
      slug: "octavia",
      isCityIndexable: true,
    });
    mocks.getCityTaxonomy.mockImplementation((city: string) => ({
      name: city === mocks.eastCitySlug ? "Košice" : "Bratislava",
      region: city === mocks.eastCitySlug ? "Košický kraj" : "Bratislavský kraj",
    }));
    mocks.hasModelForBrand.mockResolvedValue(true);
    mocks.getSeoInventoryListings.mockResolvedValue([]);
  });

  it("does not link city pSEO pages before launch inventory qualifies them", async () => {
    const page = await BrandModelPage({
      params: Promise.resolve({ brand: "skoda", model: "octavia" }),
    });
    const { container } = render(page);

    expect(container.querySelector('a[href="/skoda/octavia/bratislava"]')).toBeNull();
    expect(
      container.querySelector(`a[href="/skoda/octavia/${mocks.eastCitySlug}"]`),
    ).toBeNull();
  });
});
