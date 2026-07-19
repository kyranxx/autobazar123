import { describe, expect, it } from "vitest";
import { buildAutobazarEuTaxonomySyncPlan } from "./autobazar-eu-sync";

const syncedAtIso = "2026-07-04T09:30:00.000Z";

describe("autobazar.eu taxonomy sync plan", () => {
  it("adds missing source models without overwriting existing seed provenance", () => {
    const plan = buildAutobazarEuTaxonomySyncPlan({
      syncedAtIso,
      sourceBrands: [
        {
          name: "Volvo",
          slug: "volvo",
          sourceUrl: "https://www.autobazar.eu/vysledky/osobne-vozidla/volvo/",
          models: [
            { name: "XC40", slug: "xc40" },
            { name: "EX30", slug: "ex30" },
            { name: "Iný model", slug: "iny-model" },
          ],
        },
      ],
      existingBrands: [
        {
          id: "brand-volvo",
          name: "Volvo",
          slug: "volvo",
          source: "seed",
          is_active: true,
        },
      ],
      existingModels: [
        {
          id: "model-xc40",
          brand_id: "brand-volvo",
          name: "XC40",
          slug: "xc40",
          source: "seed",
          is_active: true,
        },
      ],
    });

    expect(plan.brandInserts).toEqual([]);
    expect(plan.brandUpdates).toEqual([
      {
        id: "brand-volvo",
        slug: "volvo",
        patch: {
          is_active: true,
          last_synced_at: syncedAtIso,
        },
      },
    ]);
    expect(plan.modelUpdates).toEqual([
      {
        id: "model-xc40",
        brandSlug: "volvo",
        modelSlug: "xc40",
        patch: {
          is_active: true,
          last_synced_at: syncedAtIso,
        },
      },
    ]);
    expect(plan.modelInserts).toEqual([
      {
        brandId: "brand-volvo",
        brandSlug: "volvo",
        row: {
          brand_id: "brand-volvo",
          name: "EX30",
          slug: "ex30",
          source: "autobazar_eu_filter",
          last_synced_at: syncedAtIso,
          is_active: true,
          is_popular: false,
          is_seo_indexable: false,
          is_city_seo_indexable: false,
        },
      },
      {
        brandId: "brand-volvo",
        brandSlug: "volvo",
        row: {
          brand_id: "brand-volvo",
          name: "Iný model",
          slug: "iny-model",
          source: "autobazar_eu_filter",
          last_synced_at: syncedAtIso,
          is_active: true,
          is_popular: false,
          is_seo_indexable: false,
          is_city_seo_indexable: false,
        },
      },
    ]);
    expect(plan.stats).toMatchObject({
      sourceBrands: 1,
      sourceModels: 3,
      brandInserts: 0,
      modelInserts: 2,
    });
  });

  it("plans new brands and defers their model brand_id until execution returns the inserted id", () => {
    const plan = buildAutobazarEuTaxonomySyncPlan({
      syncedAtIso,
      sourceBrands: [
        {
          name: "Xiaomi",
          slug: "xiaomi",
          sourceUrl: "https://www.autobazar.eu/vysledky/osobne-vozidla/xiaomi/",
          models: [{ name: "YU7", slug: "yu7" }],
        },
      ],
      existingBrands: [],
      existingModels: [],
    });

    expect(plan.brandInserts).toEqual([
      {
        slug: "xiaomi",
        row: {
          name: "Xiaomi",
          slug: "xiaomi",
          source: "autobazar_eu_filter",
          last_synced_at: syncedAtIso,
          is_active: true,
          is_popular: false,
          is_seo_indexable: false,
        },
      },
    ]);
    expect(plan.modelInserts).toEqual([
      {
        brandId: null,
        brandSlug: "xiaomi",
        row: {
          brand_id: null,
          name: "YU7",
          slug: "yu7",
          source: "autobazar_eu_filter",
          last_synced_at: syncedAtIso,
          is_active: true,
          is_popular: false,
          is_seo_indexable: false,
          is_city_seo_indexable: false,
        },
      },
    ]);
  });

  it("matches existing brands by normalized name when a previous import used another slug", () => {
    const plan = buildAutobazarEuTaxonomySyncPlan({
      syncedAtIso,
      sourceBrands: [
        {
          name: "Lynk & Co",
          slug: "lynk-co",
          sourceUrl: "https://www.autobazar.eu/vysledky/osobne-vozidla/lynk-co/",
          models: [{ name: "01", slug: "01" }],
        },
      ],
      existingBrands: [
        {
          id: "brand-lynk",
          name: "Lynk & Co",
          slug: "lynk-and-co",
          source: "autobazar_eu_brand_filter",
          is_active: true,
        },
      ],
      existingModels: [],
    });

    expect(plan.brandInserts).toEqual([]);
    expect(plan.brandUpdates).toEqual([
      {
        id: "brand-lynk",
        slug: "lynk-co",
        patch: {
          is_active: true,
          last_synced_at: syncedAtIso,
        },
      },
    ]);
    expect(plan.modelInserts[0]).toMatchObject({
      brandId: "brand-lynk",
      brandSlug: "lynk-co",
      row: {
        brand_id: "brand-lynk",
        name: "01",
        slug: "01",
      },
    });
  });
});
