/**
 * Cached server-side data fetching functions
 * Uses React.cache() for per-request deduplication
 * This prevents duplicate database queries within a single request
 *
 * Uses anonymous Supabase client (no cookies) to allow Next.js caching
 */
import { cache } from "react";
import { getAnonClient } from "./anon";

// Cached active ads count - prevents multiple DB queries per request
export const getActiveAdsCount = cache(async (): Promise<number> => {
  const supabase = getAnonClient();
  const { count, error } = await supabase
    .from("ads")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (error) {
    console.error("Error fetching active ads count:", error);
    return 0;
  }
  return count || 0;
});

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

// Cached featured cars - fetches data server-side for SSR
export const getFeaturedCars = cache(async (): Promise<FeaturedCar[]> => {
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
      .limit(6);

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
});

// Types for sold cars
interface SoldCarData {
  id: string;
  year?: number;
  price_eur?: number;
  location_city?: string;
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
  location: string;
  image: string | null;
}

// Cached recently sold cars - fetches data server-side for SSR
export const getRecentlySoldCars = cache(async (): Promise<SoldCar[]> => {
  const supabase = getAnonClient();

  try {
    const { data, error } = await supabase
      .from("ads")
      .select(
        `
        id,
        year,
        price_eur,
        location_city,
        updated_at,
        photos_json,
        brands:brand_id (name),
        models:model_id (name)
      `,
      )
      .eq("status", "sold")
      .order("updated_at", { ascending: false })
      .limit(4);

    if (error) throw error;

    const formattedCars: SoldCar[] = (
      (data || []) as unknown as SoldCarData[]
    ).map((ad) => ({
      id: ad.id,
      brand: ad.brands?.name || "Neznáma",
      model: ad.models?.name || "Model",
      year: ad.year || 0,
      price: ad.price_eur || 0,
      soldAt: ad.updated_at,
      location: ad.location_city || "Slovensko",
      image: ad.photos_json?.[0] || null,
    }));

    return formattedCars;
  } catch (error) {
    console.error("Error fetching recently sold cars:", error);
    return [];
  }
});
