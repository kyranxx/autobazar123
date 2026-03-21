import { createAdminClient } from "@/lib/supabase/admin";

export interface VehicleTaxonomyImportModel {
  externalId?: string;
  name: string;
  slug: string;
  seoSlug?: string;
  isPopular?: boolean;
  isSeoIndexable?: boolean;
  isCitySeoIndexable?: boolean;
}

export interface VehicleTaxonomyImportBrand {
  externalId?: string;
  name: string;
  slug: string;
  seoSlug?: string;
  isPopular?: boolean;
  isSeoIndexable?: boolean;
  models: VehicleTaxonomyImportModel[];
}

export interface VehicleTaxonomyImportInput {
  provider: string;
  exportedAt?: string;
  payload?: Record<string, unknown>;
  brands: VehicleTaxonomyImportBrand[];
}

function withOptionalField(
  payload: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (value !== undefined) {
    payload[key] = value;
  }

  return payload;
}

function buildBrandPayload(
  provider: string,
  brand: VehicleTaxonomyImportBrand,
  syncedAtIso: string,
) {
  return withOptionalField(
    withOptionalField(
      withOptionalField(
        withOptionalField(
          {
            name: brand.name,
            slug: brand.slug,
            source: provider,
            last_synced_at: syncedAtIso,
            is_active: true,
          },
          "source_external_id",
          brand.externalId,
        ),
        "seo_slug",
        brand.seoSlug,
      ),
      "is_popular",
      brand.isPopular,
    ),
    "is_seo_indexable",
    brand.isSeoIndexable,
  );
}

function buildModelPayload(
  provider: string,
  brandId: string,
  model: VehicleTaxonomyImportModel,
  syncedAtIso: string,
) {
  return withOptionalField(
    withOptionalField(
      withOptionalField(
        withOptionalField(
          withOptionalField(
            {
              brand_id: brandId,
              name: model.name,
              slug: model.slug,
              source: provider,
              last_synced_at: syncedAtIso,
              is_active: true,
            },
            "source_external_id",
            model.externalId,
          ),
          "seo_slug",
          model.seoSlug,
        ),
        "is_popular",
        model.isPopular,
      ),
      "is_seo_indexable",
      model.isSeoIndexable,
    ),
    "is_city_seo_indexable",
    model.isCitySeoIndexable,
  );
}

async function findExistingBrandId(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  provider: string,
  brand: VehicleTaxonomyImportBrand,
): Promise<string | null> {
  if (brand.externalId) {
    const { data } = await supabase
      .from("brands")
      .select("id")
      .eq("source", provider)
      .eq("source_external_id", brand.externalId)
      .maybeSingle();

    if (data?.id) {
      return data.id;
    }
  }

  if (brand.seoSlug) {
    const { data } = await supabase
      .from("brands")
      .select("id")
      .eq("seo_slug", brand.seoSlug)
      .maybeSingle();

    if (data?.id) {
      return data.id;
    }
  }

  const { data } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", brand.slug)
    .maybeSingle();

  return data?.id ?? null;
}

async function findExistingModelId(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  provider: string,
  brandId: string,
  model: VehicleTaxonomyImportModel,
): Promise<string | null> {
  if (model.externalId) {
    const { data } = await supabase
      .from("models")
      .select("id")
      .eq("source", provider)
      .eq("source_external_id", model.externalId)
      .maybeSingle();

    if (data?.id) {
      return data.id;
    }
  }

  if (model.seoSlug) {
    const { data } = await supabase
      .from("models")
      .select("id")
      .eq("brand_id", brandId)
      .eq("seo_slug", model.seoSlug)
      .maybeSingle();

    if (data?.id) {
      return data.id;
    }
  }

  const { data } = await supabase
    .from("models")
    .select("id")
    .eq("brand_id", brandId)
    .eq("slug", model.slug)
    .maybeSingle();

  return data?.id ?? null;
}

async function upsertBrand(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  provider: string,
  brand: VehicleTaxonomyImportBrand,
  syncedAtIso: string,
): Promise<string> {
  const existingId = await findExistingBrandId(supabase, provider, brand);
  const payload = buildBrandPayload(provider, brand, syncedAtIso);

  if (existingId) {
    const { error } = await supabase
      .from("brands")
      .update(payload)
      .eq("id", existingId);

    if (error) {
      throw error;
    }

    return existingId;
  }

  const { data, error } = await supabase
    .from("brands")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data?.id) {
    throw error ?? new Error(`Failed to insert brand ${brand.name}`);
  }

  return data.id;
}

async function upsertModel(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  provider: string,
  brandId: string,
  model: VehicleTaxonomyImportModel,
  syncedAtIso: string,
): Promise<string> {
  const existingId = await findExistingModelId(supabase, provider, brandId, model);
  const payload = buildModelPayload(provider, brandId, model, syncedAtIso);

  if (existingId) {
    const { error } = await supabase
      .from("models")
      .update(payload)
      .eq("id", existingId);

    if (error) {
      throw error;
    }

    return existingId;
  }

  const { data, error } = await supabase
    .from("models")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data?.id) {
    throw error ?? new Error(`Failed to insert model ${model.name}`);
  }

  return data.id;
}

async function markMissingRowsInactive(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  table: "brands" | "models",
  provider: string,
  syncedAtIso: string,
  seenIds: string[],
) {
  let query = supabase
    .from(table)
    .update({
      is_active: false,
      last_synced_at: syncedAtIso,
    })
    .eq("source", provider);

  if (seenIds.length > 0) {
    query = query.not("id", "in", `(${seenIds.join(",")})`);
  }

  const { error } = await query;
  if (error) {
    throw error;
  }
}

export async function runVehicleTaxonomyImport(
  input: VehicleTaxonomyImportInput,
) {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  const syncedAtIso = new Date().toISOString();
  const { data: syncRun, error: syncRunError } = await supabase
    .from("taxonomy_sync_runs")
    .insert({
      provider: input.provider,
      status: "running",
      payload: input.payload ?? {},
    })
    .select("id")
    .single();

  if (syncRunError || !syncRun?.id) {
    throw syncRunError ?? new Error("Failed to create taxonomy sync run.");
  }

  const seenBrandIds: string[] = [];
  const seenModelIds: string[] = [];

  try {
    for (const brand of input.brands) {
      const brandId = await upsertBrand(
        supabase,
        input.provider,
        brand,
        syncedAtIso,
      );
      seenBrandIds.push(brandId);

      for (const model of brand.models) {
        const modelId = await upsertModel(
          supabase,
          input.provider,
          brandId,
          model,
          syncedAtIso,
        );
        seenModelIds.push(modelId);
      }
    }

    await markMissingRowsInactive(
      supabase,
      "models",
      input.provider,
      syncedAtIso,
      seenModelIds,
    );
    await markMissingRowsInactive(
      supabase,
      "brands",
      input.provider,
      syncedAtIso,
      seenBrandIds,
    );

    const { error: finishError } = await supabase
      .from("taxonomy_sync_runs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        brands_processed: seenBrandIds.length,
        models_processed: seenModelIds.length,
      })
      .eq("id", syncRun.id);

    if (finishError) {
      throw finishError;
    }

    return {
      syncRunId: syncRun.id,
      brandsProcessed: seenBrandIds.length,
      modelsProcessed: seenModelIds.length,
    };
  } catch (error) {
    await supabase
      .from("taxonomy_sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        brands_processed: seenBrandIds.length,
        models_processed: seenModelIds.length,
        error_message:
          error instanceof Error ? error.message : "Unknown taxonomy sync error",
      })
      .eq("id", syncRun.id);

    throw error;
  }
}
