import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/public";

vi.mock("@/lib/vehicle-taxonomy/public", () => ({
  getPublicVehicleTaxonomy: vi.fn(),
}));

const mockedGetPublicVehicleTaxonomy = vi.mocked(getPublicVehicleTaxonomy);

describe("programmatic taxonomy", () => {
  beforeEach(() => {
    mockedGetPublicVehicleTaxonomy.mockReset();
    mockedGetPublicVehicleTaxonomy.mockResolvedValue({
      brands: [
        { id: "brand-skoda", name: "Škoda", slug: "skoda", isPopular: true },
        { id: "brand-vw", name: "Volkswagen", slug: "volkswagen", isPopular: false },
        { id: "brand-mercedes", name: "Mercedes-Benz", slug: "mercedes", isPopular: true },
      ],
      modelsByBrandId: {
        "brand-skoda": [
          { id: "model-octavia", name: "Octavia", slug: "octavia", isPopular: false },
          { id: "model-fabia", name: "Fabia", slug: "fabia", isPopular: false },
        ],
        "brand-vw": [
          { id: "model-golf", name: "Golf", slug: "golf", isPopular: false },
        ],
        "brand-mercedes": [
          { id: "model-glc", name: "GLC", slug: "glc", isPopular: false },
        ],
      },
    });
  });

  it("resolves known brands from names and slugs", async () => {
    const { resolveBrandSlugFromValue } = await import("./programmatic-taxonomy");

    await expect(resolveBrandSlugFromValue("Škoda")).resolves.toBe("skoda");
    await expect(resolveBrandSlugFromValue("Skoda")).resolves.toBe("skoda");
    await expect(resolveBrandSlugFromValue("Mercedes-Benz")).resolves.toBe(
      "mercedes",
    );
  }, 15000);

  it("resolves models within the selected brand", async () => {
    const { resolveModelSlugForBrand } = await import("./programmatic-taxonomy");

    await expect(resolveModelSlugForBrand("mercedes", "glc")).resolves.toBe(
      "glc",
    );
    await expect(resolveModelSlugForBrand("skoda", "Octavia")).resolves.toBe(
      "octavia",
    );
    await expect(resolveModelSlugForBrand("volkswagen", "Octavia")).resolves.toBeNull();
  }, 15000);

  it("resolves known cities from names and slugs", async () => {
    const { normalizeSeoSegment, resolveCitySlugFromValue } = await import(
      "./programmatic-taxonomy"
    );

    const kosiceSlug = normalizeSeoSegment("Košice");
    expect(resolveCitySlugFromValue("Košice")).toBe(kosiceSlug);
    expect(resolveCitySlugFromValue(kosiceSlug)).toBe(kosiceSlug);
    expect(resolveCitySlugFromValue("Banska Bystrica")).toBe("banska-bystrica");
  }, 15000);

  it("builds only valid programmatic paths", async () => {
    const { buildProgrammaticSeoPath } = await import("./programmatic-taxonomy");

    await expect(
      buildProgrammaticSeoPath({
        brandSlug: "skoda",
        modelSlug: null,
        citySlug: null,
      }),
    ).resolves.toBe("/skoda");

    await expect(
      buildProgrammaticSeoPath({
        brandSlug: "mercedes",
        modelSlug: "glc",
        citySlug: "bratislava",
      }),
    ).resolves.toBe("/mercedes/glc/bratislava");

    await expect(
      buildProgrammaticSeoPath({
        brandSlug: "skoda",
        modelSlug: null,
        citySlug: "bratislava",
      }),
    ).resolves.toBeNull();
  }, 15000);

  it("generates one pair per brand-model combination", async () => {
    const { getAllSeoBrandModelPairs } = await import("./programmatic-taxonomy");
    const pairs = await getAllSeoBrandModelPairs();

    expect(pairs).toHaveLength(4);
    expect(
      new Set(pairs.map((pair) => `${pair.brandSlug}/${pair.modelSlug}`)).size,
    ).toBe(pairs.length);
  });

  it("generates valid city triples only for models under popular brands", async () => {
    const {
      SEO_CITY_SLUGS,
      getTopSeoBrandModelCityTriples,
      getBrandTaxonomy,
    } = await import("./programmatic-taxonomy");

    const triples = await getTopSeoBrandModelCityTriples();
    expect(triples).toHaveLength(SEO_CITY_SLUGS.length * 3);

    const mercedes = await getBrandTaxonomy("mercedes");
    expect(mercedes?.models.some((model) => model.slug === "glc")).toBe(true);
    expect(
      triples.every((triple) =>
        ["octavia", "fabia", "glc"].includes(triple.modelSlug),
      ),
    ).toBe(true);
  });
});
