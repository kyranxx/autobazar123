import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMarketConfig } from "@/config/markets";
import { generateMetadata } from "./page";

const mocks = vi.hoisted(() => ({
  getAllSeoBrands: vi.fn(),
  getBrandTaxonomy: vi.fn(),
  getRequestMarketConfig: vi.fn(),
  getSeoBrandSlugs: vi.fn(),
}));

vi.mock("@/lib/seo/programmatic-taxonomy", () => ({
  getAllSeoBrands: mocks.getAllSeoBrands,
  getBrandTaxonomy: mocks.getBrandTaxonomy,
  getSeoBrandSlugs: mocks.getSeoBrandSlugs,
}));

vi.mock("@/lib/market/request", () => ({
  getRequestMarketConfig: mocks.getRequestMarketConfig,
}));

describe("brand page metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBrandTaxonomy.mockResolvedValue({
      name: "Dacia",
      slug: "dacia",
      models: [{ name: "Duster", slug: "duster", isCityIndexable: true }],
    });
    mocks.getRequestMarketConfig.mockResolvedValue(getMarketConfig("RO"));
  });

  it("keeps Romanian brand metadata and canonical on the .ro market", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ brand: "dacia" }),
    });

    expect(metadata).toMatchObject({
      title: "Dacia | Mașini de vânzare în România | Autobazar123",
      description:
        "Modele Dacia și anunțuri actuale în România. 1 modele în catalogul Autobazar123.",
      alternates: {
        canonical: "https://www.autobazar123.ro/dacia",
      },
      openGraph: {
        locale: "ro_RO",
        url: "https://www.autobazar123.ro/dacia",
      },
    });
    expect(metadata.keywords).toContain("Dacia de vânzare");
  });
});
