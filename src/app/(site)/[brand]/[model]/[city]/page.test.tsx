import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SEO_CONFIG } from "@/config/config";
import BrandModelCityPage, { generateMetadata, generateStaticParams } from "./page";

const mocks = vi.hoisted(() => ({
  eastCitySlug: ["ko", "sice"].join(""),
  getSeoInventoryListings: vi.fn(),
  getBrandTaxonomy: vi.fn(),
  getModelTaxonomy: vi.fn(),
  getCityTaxonomy: vi.fn(),
  hasModelForBrand: vi.fn(),
  getTopSeoBrandModelCityTriples: vi.fn(),
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
  SEO_CITIES: {
    bratislava: { name: "Bratislava", region: "Bratislavský kraj" },
    [mocks.eastCitySlug]: { name: "Košice", region: "Košický kraj" },
  },
  getBrandTaxonomy: mocks.getBrandTaxonomy,
  getCityTaxonomy: mocks.getCityTaxonomy,
  getModelTaxonomy: mocks.getModelTaxonomy,
  getTopSeoBrandModelCityTriples: mocks.getTopSeoBrandModelCityTriples,
  hasModelForBrand: mocks.hasModelForBrand,
}));

function cityParams() {
  return Promise.resolve({
    brand: "skoda",
    model: "octavia",
    city: "bratislava",
  });
}

function listing(index: number) {
  return {
    id: `ad-${index}`,
    brand: "Škoda",
    model: "Octavia",
    year: 2020,
    priceEur: 12000,
    mileageKm: 90000,
    fuel: "Benzín",
    city: "Bratislava",
    image: "/placeholder-car.jpg",
  };
}

describe("BrandModelCityPage", () => {
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
    mocks.getCityTaxonomy.mockReturnValue({
      name: "Bratislava",
      region: "Bratislavský kraj",
    });
    mocks.hasModelForBrand.mockResolvedValue(true);
    mocks.getSeoInventoryListings.mockResolvedValue([]);
  });

  it("keeps below-threshold city pSEO metadata out of the index", async () => {
    const metadata = await generateMetadata({ params: cityParams() });

    expect(metadata).toMatchObject({
      title: "Nenájdené",
      robots: {
        index: false,
        follow: false,
      },
    });
    expect(metadata.alternates).toBeUndefined();
  });

  it("does not broadly prebuild taxonomy-only city pSEO paths", async () => {
    mocks.getTopSeoBrandModelCityTriples.mockResolvedValue([
      { brandSlug: "skoda", modelSlug: "octavia", citySlug: "bratislava" },
      { brandSlug: "skoda", modelSlug: "octavia", citySlug: mocks.eastCitySlug },
    ]);

    await expect(generateStaticParams()).resolves.toEqual([
      { brand: "skoda", model: "octavia", city: "bratislava" },
    ]);
  });

  it("does not link unqualified sibling city pSEO pages", async () => {
    mocks.getSeoInventoryListings.mockResolvedValue(
      Array.from({ length: SEO_CONFIG.sitemapCityPageMinActiveAds }, (_, index) =>
        listing(index),
      ),
    );

    const page = await BrandModelCityPage({ params: cityParams() });
    const { container } = render(page);

    expect(
      container.querySelector(`a[href="/skoda/octavia/${mocks.eastCitySlug}"]`),
    ).toBeNull();
  });

  it("does not render city pSEO pages below the launch inventory threshold", async () => {
    await expect(
      BrandModelCityPage({ params: cityParams() }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.getSeoInventoryListings).toHaveBeenCalledWith({
      brandName: "Škoda",
      modelName: "Octavia",
      cityName: "Bratislava",
      limit: SEO_CONFIG.sitemapCityPageMinActiveAds,
    });
  });
});
