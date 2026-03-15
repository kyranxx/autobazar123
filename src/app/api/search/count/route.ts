import { NextRequest, NextResponse } from "next/server";
import { getAnonClient } from "@/lib/supabase/anon";
import { isExpectedPrerenderBailout } from "@/lib/next/prerender-bailout";
import {
  parseSavedSearchFilters,
  type SavedSearchFilters,
} from "@/lib/search/saved-searches";

export type SearchCountFilters = SavedSearchFilters;

export function parseSearchCountFilters(searchParams: URLSearchParams): SearchCountFilters {
  return parseSavedSearchFilters(searchParams);
}

export async function GET(request: NextRequest) {
  try {
    const filters = parseSearchCountFilters(request.nextUrl.searchParams);
    const supabase = getAnonClient();
    let query = supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    if (filters.brand.length > 0) {
      query = query.in("brand", filters.brand);
    }
    if (filters.model) {
      query = query.ilike("model", filters.model);
    }
    if (filters.fuel) {
      query = query.eq("fuel", filters.fuel);
    }
    if (filters.transmission) {
      query = query.eq("transmission", filters.transmission);
    }
    if (filters.bodyStyle) {
      query = query.eq("body_style", filters.bodyStyle);
    }
    if (filters.location) {
      query = query.ilike("location_city", `%${filters.location.replace(/\s+/g, "%")}%`);
    }
    if (typeof filters.priceFrom === "number") {
      query = query.gte("price_eur", filters.priceFrom);
    }
    if (typeof filters.priceTo === "number") {
      query = query.lte("price_eur", filters.priceTo);
    }
    if (typeof filters.yearFrom === "number") {
      query = query.gte("year", filters.yearFrom);
    }
    if (typeof filters.yearTo === "number") {
      query = query.lte("year", filters.yearTo);
    }
    if (filters.hasServiceBook) {
      query = query.eq("has_service_book", true);
    }
    if (filters.notCrashed) {
      query = query.eq("not_crashed", true);
    }
    if (filters.boughtInSk) {
      query = query.eq("is_bought_in_sk", true);
    }
    if (filters.q) {
      const wildcardQuery = filters.q.replace(/\s+/g, "%");
      query = query.or(
        `brand.ilike.%${wildcardQuery}%,model.ilike.%${wildcardQuery}%,location_city.ilike.%${wildcardQuery}%`,
      );
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json(
      { count: count ?? 0 },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    if (!isExpectedPrerenderBailout(error)) {
      console.error("Search count preview error:", error);
    }
    return NextResponse.json(
      { count: 0, degraded: true },
      {
        headers: {
          "Cache-Control": "public, max-age=15, s-maxage=15, stale-while-revalidate=30",
        },
      },
    );
  }
}
