/**
 * Cached server-side data fetching functions
 * Uses Next.js Cache Components (`use cache`) directives
 * with explicit cache tags for targeted invalidation.
 *
 * Uses anonymous Supabase client (no cookies) to allow Next.js caching
 */
import { cacheLife, cacheTag } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  ADS_CACHE_TAG,
  FEATURED_CARS_CACHE_TAG,
  SOLD_CARS_CACHE_TAG,
} from "@/lib/cache/tags";
import { recordFallbackActivation } from "@/lib/fallbacks/monitor";
import { getAnonClient } from "./anon";

// Service-role client for server-only reads where public RLS is intentionally stricter.
let serviceRoleClient: ReturnType<typeof createSupabaseClient> | null = null;
let warnedMissingServiceRole = false;
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    if (!warnedMissingServiceRole) {
      console.info(
        "SUPABASE_SERVICE_ROLE_KEY missing. Falling back to anon client for sold feed.",
      );
      void recordFallbackActivation({
        key: "home.sold_feed_anon_client_fallback",
        summary: "Service-role client unavailable; sold-feed query fell back to anon client.",
      });
      warnedMissingServiceRole = true;
    }
    return null;
  }

  if (!serviceRoleClient) {
    serviceRoleClient = createSupabaseClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
  return serviceRoleClient;
}

// Types for featured cars
interface FeaturedCarData {
  id: string;
  year?: number;
  price_eur?: number;
  mileage_km?: number;
  fuel?: string;
  transmission?: string;
  location_city?: string;
  photos_json?: string[];
  is_top_ad?: boolean;
  brands?: { name: string };
  models?: { name: string };
}

export interface FeaturedCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  location: string;
  fuel: string;
  transmission: string;
  image: string | null;
  isTopAd: boolean;
}

async function fetchFeaturedCars(): Promise<FeaturedCar[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ADS_CACHE_TAG);
  cacheTag(FEATURED_CARS_CACHE_TAG);

  const supabase = getAnonClient();

  try {
    const { data, error } = await supabase
      .from("ads")
      .select(
        `
        id,
        year,
        price_eur,
        mileage_km,
        fuel,
        transmission,
        location_city,
        photos_json,
        is_top_ad,
        brands:brand_id (name),
        models:model_id (name)
      `,
      )
      .eq("status", "active")
      .order("is_top_ad", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(9);

    if (error) throw error;

    const formattedCars: FeaturedCar[] = (
      (data || []) as unknown as FeaturedCarData[]
    ).map((ad) => ({
      id: ad.id,
      brand: ad.brands?.name || "Neznáma",
      model: ad.models?.name || "Model",
      year: ad.year || 0,
      mileage: ad.mileage_km || 0,
      price: ad.price_eur || 0,
      location: ad.location_city || "Slovensko",
      fuel: ad.fuel || "petrol",
      transmission: ad.transmission || "manual",
      image: ad.photos_json?.[0] || null,
      isTopAd: ad.is_top_ad || false,
    }));

    return formattedCars;
  } catch (error) {
    console.info("Featured cars fallback: returning empty list.", error);
    void recordFallbackActivation({
      key: "home.featured_cars_empty_fallback",
      summary: "Featured cars query failed and returned empty fallback list.",
      error,
    });
    return [];
  }
}

// Shared featured cars cache for SSR surfaces.
export async function getFeaturedCars(): Promise<FeaturedCar[]> {
  return fetchFeaturedCars();
}

// Types for sold cars
interface SoldCarData {
  id: string;
  year?: number;
  price_eur?: number;
  location_city?: string;
  sold_at?: string | null;
  updated_at: string;
  photos_json?: string[];
  brands?: { name: string };
  models?: { name: string };
}

export interface SoldCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  soldAt: string; // ISO string for serialization
  soldDateLabel: string;
  location: string;
  image: string | null;
}

const soldDateFormatter = new Intl.DateTimeFormat("sk-SK", {
  timeZone: "Europe/Bratislava",
});

function formatSoldDateLabel(value: string): string {
  const soldDate = new Date(value);
  if (Number.isNaN(soldDate.getTime())) {
    return value;
  }

  return soldDateFormatter.format(soldDate);
}

async function fetchRecentlySoldCars(): Promise<SoldCar[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ADS_CACHE_TAG);
  cacheTag(SOLD_CARS_CACHE_TAG);

  const supabase = getServiceRoleClient() ?? getAnonClient();

  try {
    let { data, error } = await supabase
      .from("ads")
      .select(
        `
        id,
        year,
        price_eur,
        location_city,
        sold_at,
        updated_at,
        photos_json,
        brands:brand_id (name),
        models:model_id (name)
      `,
      )
      .eq("status", "sold")
      .eq("is_hidden", false)
      .order("sold_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(14);

    // Compatibility fallback for deployments where is_hidden is not present yet.
    if (error && error.message?.includes("is_hidden")) {
      void recordFallbackActivation({
        key: "home.recently_sold_compat_query_fallback",
        summary: "Recently sold query retried without is_hidden due schema compatibility fallback.",
        error,
      });
      ({ data, error } = await supabase
        .from("ads")
        .select(
          `
          id,
          year,
          price_eur,
          location_city,
          sold_at,
          updated_at,
          photos_json,
          brands:brand_id (name),
          models:model_id (name)
        `,
        )
        .eq("status", "sold")
        .order("sold_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .limit(14));
    }

    if (error) throw error;

    const formattedCars: SoldCar[] = (
      (data || []) as unknown as SoldCarData[]
    ).map((ad) => {
      const soldAt = ad.sold_at || ad.updated_at;

      return {
        id: ad.id,
        brand: ad.brands?.name || "Neznáma",
        model: ad.models?.name || "Model",
        year: ad.year || 0,
        price: ad.price_eur || 0,
        soldAt,
        soldDateLabel: formatSoldDateLabel(soldAt),
        location: ad.location_city || "Slovensko",
        image: ad.photos_json?.[0] || null,
      };
    });

    return formattedCars;
  } catch (error) {
    console.info("Recently sold fallback: returning empty list.", error);
    void recordFallbackActivation({
      key: "home.recently_sold_empty_fallback",
      summary: "Recently sold query failed and returned empty fallback list.",
      error,
    });
    return [];
  }
}

// Shared recently-sold cache for SSR surfaces.
export async function getRecentlySoldCars(): Promise<SoldCar[]> {
  return fetchRecentlySoldCars();
}
