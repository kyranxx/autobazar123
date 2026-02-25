import { CARS_INDEX, getSearchClient } from "@/lib/algolia";

const FALLBACK_IMAGE = "/placeholder-car.jpg";

export type SeoInventoryQuery = {
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

export async function getSeoInventoryListings(
  query: SeoInventoryQuery,
): Promise<SeoInventoryListing[]> {
  const client = getSearchClient();
  if (!client) return [];

  const limit = query.limit ?? 12;
  const filters = buildSeoInventoryFilter(query);

  try {
    const response = await client.searchSingleIndex({
      indexName: CARS_INDEX,
      searchParams: {
        query: "",
        filters,
        hitsPerPage: limit,
      },
    });

    return normalizeSeoInventoryHits((response.hits ?? []) as unknown[], limit);
  } catch (error) {
    console.error("SEO inventory lookup failed:", error);
    return [];
  }
}
