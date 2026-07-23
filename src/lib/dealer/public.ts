import { cache } from "react";
import { buildAdPath } from "@/lib/cars/ad-path";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicDealerRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  is_verified?: boolean | null;
  created_at?: string | null;
};

type DealerAdCountRow = {
  dealer_id?: string | null;
  status?: string | null;
};

type DealerAdRow = {
  id: string;
  brand?: string | null;
  model?: string | null;
  year?: number | string | null;
  mileage_km?: number | string | null;
  price_eur?: number | string | null;
  fuel?: string | null;
  photos_json?: unknown;
  is_top_ad?: boolean | null;
  is_highlighted?: boolean | null;
};

export interface PublicDealerSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  city: string | null;
  isVerified: boolean;
  memberSince: string;
  activeAds: number;
  soldCount: number;
}

export interface PublicDealerListing {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  mileageKm: number | null;
  priceEur: number | null;
  fuel: string | null;
  photos: string[];
  isTop: boolean;
  isHighlighted: boolean;
  href: string;
}

export interface PublicDealerProfile extends PublicDealerSummary {
  address: string | null;
  phone: string | null;
  websiteUrl: string | null;
  activeListings: PublicDealerListing[];
}

function getPublicDealerDataClient() {
  return createAdminClient();
}

function normalizePhotos(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function mapDealerSummary(
  row: PublicDealerRow,
  counts?: { activeAds: number; soldCount: number },
): PublicDealerSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description?.trim() || null,
    logoUrl: row.logo_url?.trim() || null,
    city: row.city?.trim() || null,
    isVerified: Boolean(row.is_verified),
    memberSince: row.created_at || new Date(0).toISOString(),
    activeAds: counts?.activeAds ?? 0,
    soldCount: counts?.soldCount ?? 0,
  };
}

export const getVerifiedDealerSlugs = cache(async (): Promise<string[]> => {
  const supabase = getPublicDealerDataClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("dealers")
    .select("slug")
    .eq("is_verified", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Array<{ slug?: string | null }> | null) || [])
    .map((row) => row.slug?.trim() || "")
    .filter((slug) => slug.length > 0);
});

export const getVerifiedDealerSummaries = cache(async (): Promise<PublicDealerSummary[]> => {
  const supabase = getPublicDealerDataClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("dealers")
    .select("id, slug, name, description, logo_url, city, is_verified, created_at")
    .eq("is_verified", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const dealers = (data as PublicDealerRow[] | null) || [];
  if (dealers.length === 0) {
    return [];
  }

  const dealerIds = dealers.map((dealer) => dealer.id);
  const { data: adRows, error: adError } = await supabase
    .from("ads")
    .select("dealer_id, status")
    .in("dealer_id", dealerIds)
    .in("status", ["active", "sold"]);

  if (adError) {
    throw new Error(adError.message);
  }

  const countsByDealerId = new Map<string, { activeAds: number; soldCount: number }>();

  for (const dealer of dealers) {
    countsByDealerId.set(dealer.id, { activeAds: 0, soldCount: 0 });
  }

  for (const row of ((adRows as DealerAdCountRow[] | null) || [])) {
    const dealerId = row.dealer_id;
    if (!dealerId) continue;

    const counts = countsByDealerId.get(dealerId);
    if (!counts) continue;

    if (row.status === "active") {
      counts.activeAds += 1;
    } else if (row.status === "sold") {
      counts.soldCount += 1;
    }
  }

  return dealers
    .map((dealer) => mapDealerSummary(dealer, countsByDealerId.get(dealer.id)))
    .sort((left, right) => {
      if (right.activeAds !== left.activeAds) {
        return right.activeAds - left.activeAds;
      }

      if (right.soldCount !== left.soldCount) {
        return right.soldCount - left.soldCount;
      }

      return left.name.localeCompare(right.name, "sk");
    });
});

export const getVerifiedDealerProfile = cache(
  async (slug: string): Promise<PublicDealerProfile | null> => {
    const supabase = getPublicDealerDataClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("dealers")
      .select(
        "id, slug, name, description, logo_url, website_url, address, city, phone, is_verified, created_at",
      )
      .eq("slug", slug)
      .eq("is_verified", true)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const dealer = data as PublicDealerRow | null;
    if (!dealer) {
      return null;
    }

    const [{ count: activeAds, error: activeCountError }, { count: soldCount, error: soldCountError }, { data: activeListingRows, error: listingsError }] = await Promise.all([
      supabase
        .from("ads")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", dealer.id)
        .eq("status", "active"),
      supabase
        .from("ads")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", dealer.id)
        .eq("status", "sold"),
      supabase
        .from("ads")
        .select("id, brand, model, year, mileage_km, price_eur, fuel, photos_json, is_top_ad, is_highlighted")
        .eq("dealer_id", dealer.id)
        .eq("status", "active")
        .order("is_top_ad", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(24),
    ]);

    if (activeCountError) {
      throw new Error(activeCountError.message);
    }

    if (soldCountError) {
      throw new Error(soldCountError.message);
    }

    if (listingsError) {
      throw new Error(listingsError.message);
    }

    const summary = mapDealerSummary(dealer, {
      activeAds: activeAds || 0,
      soldCount: soldCount || 0,
    });

    const activeListings = ((activeListingRows as DealerAdRow[] | null) || []).map((row) => ({
      id: row.id,
      brand: row.brand?.trim() || "",
      model: row.model?.trim() || "",
      year: normalizeNumber(row.year),
      mileageKm: normalizeNumber(row.mileage_km),
      priceEur: normalizeNumber(row.price_eur),
      fuel: row.fuel?.trim() || null,
      photos: normalizePhotos(row.photos_json),
      isTop: Boolean(row.is_top_ad),
      isHighlighted: Boolean(row.is_highlighted),
      href: buildAdPath({
        id: row.id,
        brand: row.brand,
        model: row.model,
        year: row.year,
      }),
    }));

    return {
      ...summary,
      address: dealer.address?.trim() || null,
      phone: dealer.phone?.trim() || null,
      websiteUrl: dealer.website_url?.trim() || null,
      activeListings,
    };
  },
);
