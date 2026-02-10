/**
 * 🗄️ Database Types
 *
 * TypeScript interfaces that match the Supabase database schema exactly.
 * These are used for type safety when querying the database.
 */

// ==============================================
// ENUMS (Match PostgreSQL Enums)
// ==============================================

export type FuelType =
  | "petrol"
  | "diesel"
  | "electric"
  | "hybrid"
  | "lpg"
  | "cng"
  | "hydrogen";

export type TransmissionType = "manual" | "automatic";

export type BodyType =
  | "sedan"
  | "combi"
  | "suv"
  | "hatchback"
  | "coupe"
  | "cabriolet"
  | "mpv"
  | "pickup"
  | "commercial";

export type AdStatus = "draft" | "active" | "sold" | "expired" | "banned";

// ==============================================
// TABLE INTERFACES
// ==============================================

/**
 * Profile - Extends Supabase Auth User
 */
export interface Profile {
  id: string; // UUID, references auth.users
  email: string;
  full_name: string | null;
  phone: string | null;
  is_verified: boolean;
  avatar_url: string | null;
  credit_balance: number;
  created_at: string; // ISO timestamp
}

/**
 * Dealer - B2B Profile for car dealerships
 */
export interface Dealer {
  id: string;
  owner_id: string; // References profiles.id
  slug: string; // URL slug, unique
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_verified: boolean;
  credit_balance: number;
  created_at: string;
}

/**
 * Brand - Car manufacturer
 */
export interface Brand {
  id: string;
  name: string;
  slug: string; // URL-safe, lowercase
  logo_url: string | null;
  is_popular: boolean;
  created_at: string;
}

/**
 * Model - Car model (belongs to Brand)
 */
export interface Model {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  category: string | null; // E.g., 'suv', 'sedan', 'combi'
  created_at: string;
}

/**
 * Model with Brand info (for dropdowns)
 */
export interface ModelWithBrand extends Model {
  brand: Brand;
}

/**
 * Ad - Car listing (the core product)
 */
export interface Ad {
  id: string;
  seller_id: string;
  dealer_id: string | null;

  // Brand/Model
  brand_id: string | null;
  model_id: string | null;
  brand: string; // Text fallback
  model: string; // Text fallback
  generation: string | null;
  year: number;
  price_eur: number;
  mileage_km: number;

  // Technical Specs
  fuel: FuelType;
  transmission: TransmissionType;
  body_style: BodyType;
  power_kw: number | null;
  engine_volume_cm3: number | null;
  drive_type: string | null;
  color: string | null;

  // Trust Signals (Slovak Specifics)
  is_bought_in_sk: boolean;
  is_vat_deductible: boolean;
  has_service_book: boolean;
  full_service_history: boolean;
  originality_check: boolean;
  warranty_expiration: string | null;
  garage_kept: boolean;
  not_crashed: boolean;
  is_imported: boolean;

  // Status & Analytics
  status: AdStatus;
  views_count: number;
  click_count: number;

  // Monetization
  is_top_ad: boolean;
  is_highlighted: boolean;
  top_expires_at: string | null;
  highlight_expires_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  sold_at: string | null;
  auto_prolong: boolean;

  // Media & Content
  photos_json: string[]; // Array of image URLs
  equipment_json: string[]; // Array of equipment codes/names
  description: string | null;

  // Location
  location_city: string;
  location_district: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Ad with related data (for display)
 */
export interface AdWithRelations extends Ad {
  seller?: Profile;
  dealer?: Dealer;
  brand_info?: Brand;
  model_info?: Model;
}

/**
 * Ad Card - Minimal data for listing views
 */
export interface AdCard {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_eur: number;
  mileage_km: number;
  fuel: FuelType;
  transmission: TransmissionType;
  location_city: string;
  photos_json: string[];
  is_top_ad: boolean;
  is_highlighted: boolean;
  is_vat_deductible: boolean;
  status: AdStatus;
  created_at: string;
}

/**
 * Saved Ad - User's favorites
 */
export interface SavedAd {
  id: string;
  user_id: string;
  ad_id: string;
  created_at: string;
}

/**
 * Saved Ad with Ad details
 */
export interface SavedAdWithDetails extends SavedAd {
  ad: AdCard;
}

/**
 * Inquiry - Contact message from buyer to seller
 */
export interface Inquiry {
  id: string;
  ad_id: string;
  sender_id: string;
  message: string;
  phone: string | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Inquiry with sender info
 */
export interface InquiryWithSender extends Inquiry {
  sender: Profile;
  ad: AdCard;
}

/**
 * Credit Package - Available for purchase
 */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_eur: number;
  stripe_price_id: string | null;
  is_active: boolean;
  is_popular: boolean;
  discount_percent: number;
  created_at: string;
}

/**
 * Credit Transaction - Ledger entry
 */
export interface CreditTransaction {
  id: string;
  user_id: string | null;
  dealer_id: string | null;
  amount: number; // Positive = credit, Negative = debit
  description: string;
  action_type: string | null;
  ad_id: string | null;
  stripe_payment_id: string | null;
  created_at: string;
}

// ==============================================
// FORM/INPUT TYPES
// ==============================================

/**
 * New Ad Input (for creation form)
 */
export type AdInput = Omit<
  Ad,
  | "id"
  | "seller_id"
  | "dealer_id"
  | "status"
  | "views_count"
  | "click_count"
  | "is_top_ad"
  | "is_highlighted"
  | "top_expires_at"
  | "highlight_expires_at"
  | "published_at"
  | "expires_at"
  | "sold_at"
  | "auto_prolong"
  | "created_at"
  | "updated_at"
>;

/**
 * Ad Update Input
 */
export type AdUpdateInput = Partial<AdInput> & { id: string };

/**
 * Profile Update Input
 */
export type ProfileInput = Pick<Profile, "full_name" | "phone" | "avatar_url">;

/**
 * Dealer Registration Input
 */
export type DealerInput = Omit<
  Dealer,
  "id" | "owner_id" | "is_verified" | "credit_balance" | "created_at"
>;

// ==============================================
// API RESPONSE TYPES
// ==============================================

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string>;
}

/**
 * Operation result
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ==============================================
// SEARCH/FILTER TYPES
// ==============================================

export interface AdFilters {
  brand_id?: string;
  model_id?: string;
  year_from?: number;
  year_to?: number;
  price_from?: number;
  price_to?: number;
  mileage_from?: number;
  mileage_to?: number;
  fuel?: FuelType;
  transmission?: TransmissionType;
  body_style?: BodyType;
  power_from?: number;
  power_to?: number;
  location_city?: string;
  is_bought_in_sk?: boolean;
  has_service_book?: boolean;
  not_crashed?: boolean;
}

export interface AdSortOptions {
  field: "price_eur" | "year" | "mileage_km" | "created_at";
  direction: "asc" | "desc";
}

export interface AdSearchParams extends AdFilters {
  sort?: AdSortOptions;
  page?: number;
  per_page?: number;
}
