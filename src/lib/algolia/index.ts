import { algoliasearch } from "algoliasearch";
import type {
  SearchResponse,
  SearchResponses,
  SearchParamsObject as SearchOptions,
 } from "algoliasearch";
import { getCityCoordinates } from "@/lib/geo/cities";
import {
  createFallbackSearchClient,
  isRecoverableAlgoliaSearchError,
} from "./fallback-search";
import { recordFallbackActivation } from "@/lib/fallbacks/monitor";

// Algolia client configuration
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";
const suppressMissingKeyWarning =
  process.env.NEXT_PUBLIC_SUPPRESS_ALGOLIA_MISSING_KEYS_WARNING === "true";

type SearchClient = {
  addAlgoliaAgent?: (segment: string, version?: string) => void;
  search<TObject>(
    requests: Array<{ indexName: string; params: SearchOptions }>,
  ): Promise<SearchResponses<TObject>>;
};

function getNonEmptyEnvValue(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Create search-only client (safe for frontend)
// Using a lazy getter to avoid crashing at module-level if keys are missing during build
let _searchClient: SearchClient | null = null;
let fallbackCatalogPromise: Promise<AlgoliaCarRecord[]> | null = null;
let fallbackSearchClient: ReturnType<typeof createFallbackSearchClient> | null = null;
let hasWarnedMissingSearchKeys = false;
let hasWarnedSearchFallback = false;

function resolveInternalApiUrl(pathname: string): string {
  if (typeof window !== "undefined") {
    return pathname;
  }

  const siteUrl =
    getNonEmptyEnvValue(process.env.NEXT_PUBLIC_SITE_URL)
    || getNonEmptyEnvValue(process.env.SITE_URL);

  if (siteUrl) {
    return new URL(pathname, siteUrl).toString();
  }

  const vercelUrl = getNonEmptyEnvValue(process.env.VERCEL_URL);
  if (vercelUrl) {
    return new URL(pathname, `https://${vercelUrl}`).toString();
  }

  return new URL(pathname, "http://localhost:3000").toString();
}

async function loadFallbackCatalog(): Promise<AlgoliaCarRecord[]> {
  if (!fallbackCatalogPromise) {
    fallbackCatalogPromise = fetch(resolveInternalApiUrl("/api/search/catalog"), {
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Search fallback catalog request failed with status ${response.status}`,
          );
        }

        const payload = (await response.json()) as {
          records?: AlgoliaCarRecord[];
        };
        return Array.isArray(payload.records) ? payload.records : [];
      })
      .catch((error) => {
        fallbackCatalogPromise = null;
        throw error;
      });
  }

  return fallbackCatalogPromise;
}

export const getSearchClient = () => {
  if (!fallbackSearchClient) {
    fallbackSearchClient = createFallbackSearchClient(loadFallbackCatalog);
  }

  if (!_searchClient) {
    if (!appId || !apiKey) {
      if (!hasWarnedMissingSearchKeys && !suppressMissingKeyWarning) {
        console.warn(
          "Algolia search keys are missing. Falling back to Supabase catalog search.",
        );
        void recordFallbackActivation({
          key: "search.algolia_missing_keys",
          summary: "Algolia search keys are missing; fallback search client enabled.",
        });
        hasWarnedMissingSearchKeys = true;
      }
      return fallbackSearchClient;
    }

    const algoliaClient = algoliasearch(appId, apiKey);
    let shouldUseFallback = false;

    _searchClient = {
      addAlgoliaAgent: algoliaClient.addAlgoliaAgent?.bind(algoliaClient),
      async search<TObject>(
        requests: Array<{ indexName: string; params: SearchOptions }>,
      ) {
        if (shouldUseFallback) {
          return fallbackSearchClient!.search<TObject>(requests);
        }

        try {
          return await algoliaClient.search<TObject>(requests);
        } catch (error) {
          if (!isRecoverableAlgoliaSearchError(error)) {
            throw error;
          }

          shouldUseFallback = true;
          if (!hasWarnedSearchFallback) {
            console.warn(
              "Algolia search is unavailable. Falling back to Supabase catalog search.",
              error,
            );
            void recordFallbackActivation({
              key: "search.algolia_unavailable",
              summary: "Algolia runtime search failed and degraded to fallback search client.",
              error,
            });
            hasWarnedSearchFallback = true;
          }

          return fallbackSearchClient!.search<TObject>(requests);
        }
      },
    };
  }

  return _searchClient;
};

export async function searchSingleIndex<TObject>({
  indexName,
  searchParams,
}: {
  indexName: string;
  searchParams: SearchOptions;
}): Promise<SearchResponse<TObject>> {
  const client = getSearchClient();
  if (!client) {
    throw new Error("Search client is not initialized");
  }

  const response = await client.search<TObject>([
    {
      indexName,
      params: searchParams,
    },
  ]);

  return response.results[0] as SearchResponse<TObject>;
}

// Index name for car ads
export const CARS_INDEX =
  getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX) ?? "ads";

// Admin client for indexing (server-side only)
export function getAdminClient() {
  const adminKey = process.env.ALGOLIA_ADMIN_KEY;
  if (!appId || !adminKey) {
    throw new Error(
      `Algolia configuration missing: appId=${!!appId}, adminKey=${!!adminKey}`,
    );
  }
  return algoliasearch(appId, adminKey);
}

// Type for car record in Algolia
export interface AlgoliaCarRecord extends Record<string, unknown> {
  objectID: string;
  brand: string;
  model: string;
  generation?: string;
  year: number;
  price_eur: number;
  mileage_km: number;
  fuel: string;
  transmission: string;
  body_style?: string;
  power_kw?: number;
  location_city?: string;
  _geoloc?: { lat: number; lng: number };
  photos_json?: string[];
  is_top_ad: boolean;
  is_highlighted: boolean;
  is_vat_deductible: boolean;
  has_service_book: boolean;
  not_crashed: boolean;
  is_bought_in_sk: boolean;
  created_at: number; // Unix timestamp for ranking
}

// Helper to transform Supabase car to Algolia record
export function transformCarToAlgoliaRecord(car: {
  id: string;
  year?: number;
  price_eur?: number;
  mileage_km?: number;
  fuel?: string;
  transmission?: string;
  body_style?: string;
  power_kw?: number;
  location_city?: string;
  photos_json?: string[];
  is_top_ad?: boolean;
  is_highlighted?: boolean;
  is_vat_deductible?: boolean;
  has_service_book?: boolean;
  not_crashed?: boolean;
  is_bought_in_sk?: boolean;
  created_at?: string;
  brands?: { name: string };
  models?: { name: string };
}): AlgoliaCarRecord {
  return {
    objectID: car.id,
    brand: car.brands?.name || "Unknown",
    model: car.models?.name || "Model",
    generation: "",
    year: car.year || 0,
    price_eur: car.price_eur || 0,
    mileage_km: car.mileage_km || 0,
    fuel: car.fuel || "",
    transmission: car.transmission || "",
    body_style: car.body_style || "",
    power_kw: car.power_kw || 0,
    location_city: car.location_city || "",
    _geoloc: car.location_city
      ? getCityCoordinates(car.location_city)
        ? {
            lat: getCityCoordinates(car.location_city)!.lat,
            lng: getCityCoordinates(car.location_city)!.lng,
          }
        : undefined
      : undefined,
    photos_json: car.photos_json || [],
    is_top_ad: car.is_top_ad || false,
    is_highlighted: car.is_highlighted || false,
    is_vat_deductible: car.is_vat_deductible || false,
    has_service_book: car.has_service_book || false,
    not_crashed: car.not_crashed || false,
    is_bought_in_sk: car.is_bought_in_sk || false,
    created_at: car.created_at
      ? new Date(car.created_at).getTime()
      : Date.now(),
  };
}
