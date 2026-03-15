/**
 * Cached server-side data fetching functions
 * Uses Next.js Cache Components (`use cache`) directives
 * with explicit cache tags for targeted invalidation.
 *
 * Uses anonymous Supabase client (no cookies) to allow Next.js caching
 */
import { cacheLife, cacheTag } from "next/cache";
import {
  ADS_CACHE_TAG,
  FEATURED_CARS_CACHE_TAG,
} from "@/lib/cache/tags";
import { recordFallbackActivation } from "@/lib/fallbacks/monitor";
import { getAnonClient } from "./anon";

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

interface FeaturedCar {
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
