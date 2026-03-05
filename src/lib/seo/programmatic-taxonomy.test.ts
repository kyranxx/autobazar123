import { describe, expect, it } from "vitest";
import {
  SEO_BRANDS,
  SEO_CITIES,
  SEO_TOP_BRANDS_FOR_CITY_PAGES,
  SEO_TOP_CITY_SLUGS,
  SEO_TOP_MODELS_FOR_CITY_PAGES,
  buildProgrammaticSeoPath,
  getAllSeoBrandModelPairs,
  getTopSeoBrandModelCityTriples,
  resolveBrandSlugFromValue,
  resolveCitySlugFromValue,
  resolveModelSlugForBrand,
} from "./programmatic-taxonomy";

describe("programmatic taxonomy", () => {
  it("resolves known brands from names and slugs", () => {
    expect(resolveBrandSlugFromValue("\u0160koda")).toBe("skoda");
    expect(resolveBrandSlugFromValue("Skoda")).toBe("skoda");
    expect(resolveBrandSlugFromValue("volkswagen")).toBe("volkswagen");
  });

  it("resolves models within the selected brand", () => {
    expect(resolveModelSlugForBrand("bmw", "3-series")).toBe("3-series");
    expect(resolveModelSlugForBrand("bmw", "3 series")).toBe("3-series");
    expect(resolveModelSlugForBrand("audi", "3 series")).toBeNull();
  });

  it("resolves known cities from names and slugs", () => {
    expect(resolveCitySlugFromValue("Ko\u0161ice")).toBe("kosice");
    expect(resolveCitySlugFromValue("kosice")).toBe("kosice");
    expect(resolveCitySlugFromValue("Banska Bystrica")).toBe("banska-bystrica");
  });

  it("builds only valid programmatic paths", () => {
    expect(
      buildProgrammaticSeoPath({
        brandSlug: "ford",
        modelSlug: null,
        citySlug: null,
      }),
    ).toBe("/ford");

    expect(
      buildProgrammaticSeoPath({
        brandSlug: "ford",
        modelSlug: "kuga",
        citySlug: "bratislava",
      }),
    ).toBe("/ford/kuga/bratislava");

    expect(
      buildProgrammaticSeoPath({
        brandSlug: "ford",
        modelSlug: null,
        citySlug: "bratislava",
      }),
    ).toBeNull();
  });

  it("keeps top-city page brand and model mappings valid", () => {
    for (const brandSlug of SEO_TOP_BRANDS_FOR_CITY_PAGES) {
      const brand = SEO_BRANDS[brandSlug];
      expect(brand).toBeTruthy();

      const topModels = SEO_TOP_MODELS_FOR_CITY_PAGES[brandSlug] || [];
      for (const modelSlug of topModels) {
        expect(brand.models).toContain(modelSlug);
      }
    }
  });

  it("keeps top city slugs aligned with known city taxonomy", () => {
    for (const citySlug of SEO_TOP_CITY_SLUGS) {
      expect(SEO_CITIES[citySlug]).toBeTruthy();
    }
  });

  it("generates one pair per brand-model combination", () => {
    const expectedCount = Object.values(SEO_BRANDS).reduce(
      (sum, brand) => sum + brand.models.length,
      0,
    );
    const pairs = getAllSeoBrandModelPairs();

    expect(pairs).toHaveLength(expectedCount);
    expect(new Set(pairs.map((pair) => `${pair.brandSlug}/${pair.modelSlug}`)).size).toBe(
      pairs.length,
    );
  });

  it("generates valid top brand-model-city triples", () => {
    const triples = getTopSeoBrandModelCityTriples();
    const expectedCount = SEO_TOP_BRANDS_FOR_CITY_PAGES.reduce(
      (sum, brandSlug) =>
        sum +
        (SEO_TOP_MODELS_FOR_CITY_PAGES[brandSlug]?.length || 0) * SEO_TOP_CITY_SLUGS.length,
      0,
    );

    expect(triples).toHaveLength(expectedCount);

    for (const triple of triples) {
      expect(SEO_BRANDS[triple.brandSlug]).toBeTruthy();
      expect(SEO_CITIES[triple.citySlug]).toBeTruthy();
      expect(SEO_BRANDS[triple.brandSlug]?.models).toContain(triple.modelSlug);
    }
  });
});
