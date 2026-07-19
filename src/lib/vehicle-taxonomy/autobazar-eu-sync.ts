import type {
  AutobazarEuBrand,
  AutobazarEuModel,
} from "./autobazar-eu";
import { AUTOBazar_EU_FILTER_SOURCE } from "./autobazar-eu";
import { normalizeTaxonomyLookupKey } from "./normalize";

export interface ExistingTaxonomyBrandRow {
  id: string;
  name: string;
  slug: string;
  source: string;
  is_active: boolean | null;
}

export interface ExistingTaxonomyModelRow {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  source: string;
  is_active: boolean | null;
}

export interface TaxonomySyncPlanInput {
  existingBrands: readonly ExistingTaxonomyBrandRow[];
  existingModels: readonly ExistingTaxonomyModelRow[];
  sourceBrands: ReadonlyArray<AutobazarEuBrand & { models: AutobazarEuModel[] }>;
  syncedAtIso: string;
}

export interface TaxonomyInsertPlan<T> {
  slug: string;
  row: T;
}

export interface TaxonomyUpdatePlan<T> {
  id: string;
  slug?: string;
  brandSlug?: string;
  modelSlug?: string;
  patch: T;
}

export interface TaxonomyBrandInsertRow {
  name: string;
  slug: string;
  source: string;
  last_synced_at: string;
  is_active: true;
  is_popular: false;
  is_seo_indexable: false;
}

export interface TaxonomyModelInsertPlan {
  brandId: string | null;
  brandSlug: string;
  row: {
    brand_id: string | null;
    name: string;
    slug: string;
    source: string;
    last_synced_at: string;
    is_active: true;
    is_popular: false;
    is_seo_indexable: false;
    is_city_seo_indexable: false;
  };
}

export interface TaxonomyCandidateUpsertRow {
  source: string;
  candidate_key: string;
  entity_type: "brand" | "model";
  status: "imported";
  brand_name: string;
  brand_slug: string;
  model_name?: string;
  model_slug?: string;
  confidence: number;
  evidence: Record<string, unknown>;
  last_seen_at: string;
  promoted_at: string;
}

export interface AutobazarEuTaxonomySyncPlan {
  brandInserts: Array<TaxonomyInsertPlan<TaxonomyBrandInsertRow>>;
  brandUpdates: Array<TaxonomyUpdatePlan<{ is_active: true; last_synced_at: string }>>;
  candidateUpserts: TaxonomyCandidateUpsertRow[];
  modelInserts: TaxonomyModelInsertPlan[];
  modelUpdates: Array<
    TaxonomyUpdatePlan<{ is_active: true; last_synced_at: string }>
  >;
  stats: {
    sourceBrands: number;
    sourceModels: number;
    brandInserts: number;
    brandUpdates: number;
    modelInserts: number;
    modelUpdates: number;
    candidateUpserts: number;
  };
}

function buildBrandCandidate(
  brand: AutobazarEuBrand,
  syncedAtIso: string,
): TaxonomyCandidateUpsertRow {
  return {
    source: AUTOBazar_EU_FILTER_SOURCE,
    candidate_key: `brand:${brand.slug}`,
    entity_type: "brand",
    status: "imported",
    brand_name: brand.name,
    brand_slug: brand.slug,
    confidence: 0.95,
    evidence: {
      sourceUrl: brand.sourceUrl,
    },
    last_seen_at: syncedAtIso,
    promoted_at: syncedAtIso,
  };
}

function buildModelCandidate(
  brand: AutobazarEuBrand,
  model: AutobazarEuModel,
  syncedAtIso: string,
): TaxonomyCandidateUpsertRow {
  return {
    source: AUTOBazar_EU_FILTER_SOURCE,
    candidate_key: `model:${brand.slug}:${model.slug}`,
    entity_type: "model",
    status: "imported",
    brand_name: brand.name,
    brand_slug: brand.slug,
    model_name: model.name,
    model_slug: model.slug,
    confidence: 0.95,
    evidence: {
      sourceUrl: brand.sourceUrl,
    },
    last_seen_at: syncedAtIso,
    promoted_at: syncedAtIso,
  };
}

export function buildAutobazarEuTaxonomySyncPlan({
  existingBrands,
  existingModels,
  sourceBrands,
  syncedAtIso,
}: TaxonomySyncPlanInput): AutobazarEuTaxonomySyncPlan {
  const existingBrandBySlug = new Map(
    existingBrands.map((brand) => [brand.slug, brand]),
  );
  const existingBrandByName = new Map(
    existingBrands.map((brand) => [normalizeTaxonomyLookupKey(brand.name), brand]),
  );
  const existingModelsByBrandAndSlug = new Map(
    existingModels.map((model) => [`${model.brand_id}:${model.slug}`, model]),
  );
  const brandInserts: AutobazarEuTaxonomySyncPlan["brandInserts"] = [];
  const brandUpdates: AutobazarEuTaxonomySyncPlan["brandUpdates"] = [];
  const modelInserts: AutobazarEuTaxonomySyncPlan["modelInserts"] = [];
  const modelUpdates: AutobazarEuTaxonomySyncPlan["modelUpdates"] = [];
  const candidateUpserts: TaxonomyCandidateUpsertRow[] = [];
  let sourceModels = 0;

  for (const sourceBrand of sourceBrands) {
    candidateUpserts.push(buildBrandCandidate(sourceBrand, syncedAtIso));

    const existingBrand =
      existingBrandBySlug.get(sourceBrand.slug) ??
      existingBrandByName.get(normalizeTaxonomyLookupKey(sourceBrand.name));
    if (existingBrand) {
      brandUpdates.push({
        id: existingBrand.id,
        slug: sourceBrand.slug,
        patch: {
          is_active: true,
          last_synced_at: syncedAtIso,
        },
      });
    } else {
      brandInserts.push({
        slug: sourceBrand.slug,
        row: {
          name: sourceBrand.name,
          slug: sourceBrand.slug,
          source: AUTOBazar_EU_FILTER_SOURCE,
          last_synced_at: syncedAtIso,
          is_active: true,
          is_popular: false,
          is_seo_indexable: false,
        },
      });
    }

    for (const sourceModel of sourceBrand.models) {
      sourceModels += 1;
      candidateUpserts.push(
        buildModelCandidate(sourceBrand, sourceModel, syncedAtIso),
      );

      const brandId = existingBrand?.id ?? null;
      const existingModel = brandId
        ? existingModelsByBrandAndSlug.get(`${brandId}:${sourceModel.slug}`)
        : null;

      if (existingModel) {
        modelUpdates.push({
          id: existingModel.id,
          brandSlug: sourceBrand.slug,
          modelSlug: sourceModel.slug,
          patch: {
            is_active: true,
            last_synced_at: syncedAtIso,
          },
        });
        continue;
      }

      modelInserts.push({
        brandId,
        brandSlug: sourceBrand.slug,
        row: {
          brand_id: brandId,
          name: sourceModel.name,
          slug: sourceModel.slug,
          source: AUTOBazar_EU_FILTER_SOURCE,
          last_synced_at: syncedAtIso,
          is_active: true,
          is_popular: false,
          is_seo_indexable: false,
          is_city_seo_indexable: false,
        },
      });
    }
  }

  return {
    brandInserts,
    brandUpdates,
    candidateUpserts,
    modelInserts,
    modelUpdates,
    stats: {
      sourceBrands: sourceBrands.length,
      sourceModels,
      brandInserts: brandInserts.length,
      brandUpdates: brandUpdates.length,
      modelInserts: modelInserts.length,
      modelUpdates: modelUpdates.length,
      candidateUpserts: candidateUpserts.length,
    },
  };
}
