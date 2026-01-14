import { algoliasearch } from "algoliasearch";

// Algolia client configuration
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";

// Create search-only client (safe for frontend)
export const searchClient = algoliasearch(appId, apiKey);

// Index name for car ads
export const CARS_INDEX = "ads"; // Main index for car listings

// Admin client for indexing (server-side only)
export function getAdminClient() {
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;
    if (!adminKey) {
        throw new Error("ALGOLIA_ADMIN_KEY is not set");
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
        photos_json: car.photos_json || [],
        is_top_ad: car.is_top_ad || false,
        is_highlighted: car.is_highlighted || false,
        is_vat_deductible: car.is_vat_deductible || false,
        has_service_book: car.has_service_book || false,
        not_crashed: car.not_crashed || false,
        is_bought_in_sk: car.is_bought_in_sk || false,
        created_at: car.created_at ? new Date(car.created_at).getTime() : Date.now(),
    };
}
