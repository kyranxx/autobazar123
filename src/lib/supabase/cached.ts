/**
 * Cached server-side data fetching functions
 * Uses stable Next.js cache tags for targeted invalidation without enabling
 * global Cache Components/PPR.
 *
 * Uses anonymous Supabase client (no cookies) to allow Next.js caching
 */
import { unstable_cache } from "next/cache";
import {
  ADS_CACHE_TAG,
  FEATURED_CARS_CACHE_TAG,
} from "@/lib/cache/tags";
import { recordFallbackActivation } from "@/lib/fallbacks/monitor";
import { getListingFallbackImage } from "@/lib/cars/fallback-images";
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

async function fetchFeaturedCarsUncached(): Promise<FeaturedCar[]> {
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
      .eq("is_top_ad", true)
      .order("created_at", { ascending: false })
      .limit(24);

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
      location: ad.location_city || "",
      fuel: ad.fuel || "petrol",
      transmission: ad.transmission || "manual",
      image: ad.photos_json?.[0] || getListingFallbackImage(ad.id),
      isTopAd: ad.is_top_ad || false,
    }));

    const shuffledCars = [...formattedCars];
    for (let index = shuffledCars.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledCars[index], shuffledCars[swapIndex]] = [
        shuffledCars[swapIndex],
        shuffledCars[index],
      ];
    }

    return shuffledCars.slice(0, 10);
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

const fetchFeaturedCars = unstable_cache(fetchFeaturedCarsUncached, ["featured-cars"], {
  revalidate: 60,
  tags: [ADS_CACHE_TAG, FEATURED_CARS_CACHE_TAG],
});

// Shared featured cars cache for SSR surfaces.
export async function getFeaturedCars(): Promise<FeaturedCar[]> {
  return fetchFeaturedCars();
}
