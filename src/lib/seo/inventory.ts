import { getAnonClient } from "@/lib/supabase/anon";

const FALLBACK_IMAGE = "/placeholder-car.jpg";

type SeoInventoryQuery = {
  brandName: string;
  modelName: string;
  cityName?: string;
  limit?: number;
};

export type SeoInventoryListing = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  priceEur: number | null;
  mileageKm: number | null;
  fuel: string | null;
  city: string | null;
  image: string;
};

interface SeoInventoryRow {
  id: string;
  year?: number | null;
  price_eur?: number | null;
  mileage_km?: number | null;
  fuel?: string | null;
  location_city?: string | null;
  photos_json?: string[] | null;
  is_top_ad?: boolean | null;
  created_at?: string | null;
  brands?: { name?: string | null } | null;
  models?: { name?: string | null } | null;
}

function escapeAlgoliaFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').trim();
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function buildSeoInventoryFilter({
  brandName,
  modelName,
  cityName,
}: Omit<SeoInventoryQuery, "limit">): string {
  const filters = [
    `brand:"${escapeAlgoliaFilterValue(brandName)}"`,
    `model:"${escapeAlgoliaFilterValue(modelName)}"`,
  ];

  if (cityName) {
    filters.push(`location_city:"${escapeAlgoliaFilterValue(cityName)}"`);
  }

  return filters.join(" AND ");
}

export function normalizeSeoInventoryHits(
  hits: unknown[],
  limit = 12,
): SeoInventoryListing[] {
  const seen = new Set<string>();
  const listings: SeoInventoryListing[] = [];

  for (const hit of hits) {
    if (listings.length >= limit) break;
    if (!hit || typeof hit !== "object") continue;

    const row = hit as Record<string, unknown>;
    const objectIdRaw = row.objectID;
    if (typeof objectIdRaw !== "string" || !objectIdRaw.trim()) continue;

    const objectId = objectIdRaw.trim();
    if (seen.has(objectId)) continue;
    seen.add(objectId);

    const photos = Array.isArray(row.photos_json)
      ? row.photos_json.filter((entry): entry is string => typeof entry === "string")
      : [];
    const image = photos[0]?.trim() || FALLBACK_IMAGE;

    listings.push({
      id: objectId,
      brand: typeof row.brand === "string" ? row.brand : "",
      model: typeof row.model === "string" ? row.model : "",
      year: toNullableNumber(row.year),
      priceEur: toNullableNumber(row.price_eur),
      mileageKm: toNullableNumber(row.mileage_km),
      fuel: typeof row.fuel === "string" ? row.fuel : null,
      city: typeof row.location_city === "string" ? row.location_city : null,
      image,
    });
  }

  return listings;
}

function normalizeSeoInventoryRows(
  rows: SeoInventoryRow[],
  limit = 12,
): SeoInventoryListing[] {
  const seen = new Set<string>();
  const listings: SeoInventoryListing[] = [];

  for (const row of rows) {
    if (listings.length >= limit) break;
    if (!row.id || seen.has(row.id)) continue;

    seen.add(row.id);
    listings.push({
      id: row.id,
      brand: row.brands?.name?.trim() || "",
      model: row.models?.name?.trim() || "",
      year: toNullableNumber(row.year),
      priceEur: toNullableNumber(row.price_eur),
      mileageKm: toNullableNumber(row.mileage_km),
      fuel: typeof row.fuel === "string" ? row.fuel : null,
      city: typeof row.location_city === "string" ? row.location_city : null,
      image: row.photos_json?.[0]?.trim() || FALLBACK_IMAGE,
    });
  }

  return listings;
}

async function querySeoInventoryRows(
  query: SeoInventoryQuery,
): Promise<SeoInventoryRow[]> {
  const supabase = getAnonClient();
  const limit = query.limit ?? 12;
  const select = `
    id,
    year,
    price_eur,
    mileage_km,
    fuel,
    location_city,
    photos_json,
    is_top_ad,
    created_at,
    brands:brand_id!inner (name),
    models:model_id!inner (name)
  `;

  let request = supabase
    .from("ads")
    .select(select)
    .eq("status", "active")
    .eq("is_hidden", false)
    .eq("brands.name", query.brandName)
    .eq("models.name", query.modelName)
    .order("is_top_ad", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query.cityName) {
    request = request.eq("location_city", query.cityName);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return (data as SeoInventoryRow[] | null) ?? [];
}

export async function getSeoInventoryListings(
  query: SeoInventoryQuery,
): Promise<SeoInventoryListing[]> {
  try {
    const rows = await querySeoInventoryRows(query);
    return normalizeSeoInventoryRows(rows, query.limit ?? 12);
  } catch (error) {
    console.error("SEO inventory lookup failed:", error);
    return [];
  }
}
