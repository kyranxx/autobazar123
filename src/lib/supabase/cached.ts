/**
 * Cached server-side data fetching functions
 * Uses Next.js unstable_cache() for cross-request caching
 * with explicit tags and short revalidation windows.
 *
 * Uses anonymous Supabase client (no cookies) to allow Next.js caching
 */
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAnonClient } from "./anon";

const ADS_CACHE_TAG = "ads";
const FEATURED_CARS_CACHE_TAG = "ads:featured-cars";
const SOLD_CARS_CACHE_TAG = "ads:sold-cars";
const CARS_CACHE_REVALIDATE_SECONDS = 60;

// Service-role client for server-only reads where public RLS is intentionally stricter.
let serviceRoleClient: ReturnType<typeof createSupabaseClient> | null = null;
let warnedMissingServiceRole = false;
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    if (!warnedMissingServiceRole) {
      console.warn(
        "SUPABASE_SERVICE_ROLE_KEY missing. Falling back to anon client for sold feed.",
      );
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
    console.error("Error fetching featured cars:", error);
    return [];
  }
}

const getFeaturedCarsFromCache = unstable_cache(
  fetchFeaturedCars,
  ["featured-cars"],
  {
    revalidate: CARS_CACHE_REVALIDATE_SECONDS,
    tags: [ADS_CACHE_TAG, FEATURED_CARS_CACHE_TAG],
  },
);

// Shared featured cars cache for SSR surfaces.
export async function getFeaturedCars(): Promise<FeaturedCar[]> {
  return getFeaturedCarsFromCache();
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
    console.error("Error fetching recently sold cars:", error);
    return [];
  }
}

const getRecentlySoldCarsFromCache = unstable_cache(
  fetchRecentlySoldCars,
  ["recently-sold-cars"],
  {
    revalidate: CARS_CACHE_REVALIDATE_SECONDS,
    tags: [ADS_CACHE_TAG, SOLD_CARS_CACHE_TAG],
  },
);

// Shared recently-sold cache for SSR surfaces.
export async function getRecentlySoldCars(): Promise<SoldCar[]> {
  return getRecentlySoldCarsFromCache();
}
