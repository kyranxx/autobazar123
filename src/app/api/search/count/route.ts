import { NextRequest, NextResponse } from "next/server";
import { getAnonClient } from "@/lib/supabase/anon";

export type SearchCountFilters = {
  q: string;
  brand: string;
  model: string;
  fuel: string;
  transmission: string;
  bodyStyle: string;
  location: string;
  priceFrom?: number;
  priceTo?: number;
  yearFrom?: number;
  yearTo?: number;
  hasServiceBook: boolean;
  notCrashed: boolean;
  boughtInSk: boolean;
};

function normalizeTextFilter(value: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function normalizeIntegerFilter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return undefined;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeBooleanFilter(value: string | null): boolean {
  return value === "true";
}

export function parseSearchCountFilters(searchParams: URLSearchParams): SearchCountFilters {
  return {
    q: normalizeTextFilter(searchParams.get("q")),
    brand: normalizeTextFilter(searchParams.get("brand")),
    model: normalizeTextFilter(searchParams.get("model")),
    fuel: normalizeTextFilter(searchParams.get("fuel")).toLowerCase(),
    transmission: normalizeTextFilter(searchParams.get("transmission")).toLowerCase(),
    bodyStyle: normalizeTextFilter(searchParams.get("bodyStyle")).toLowerCase(),
    location: normalizeTextFilter(searchParams.get("location")),
    priceFrom: normalizeIntegerFilter(searchParams.get("priceFrom")),
    priceTo: normalizeIntegerFilter(searchParams.get("priceTo")),
    yearFrom: normalizeIntegerFilter(searchParams.get("yearFrom")),
    yearTo: normalizeIntegerFilter(searchParams.get("yearTo")),
    hasServiceBook: normalizeBooleanFilter(searchParams.get("hasServiceBook")),
    notCrashed: normalizeBooleanFilter(searchParams.get("notCrashed")),
    boughtInSk: normalizeBooleanFilter(searchParams.get("boughtInSk")),
  };
}

export async function GET(request: NextRequest) {
  try {
    const filters = parseSearchCountFilters(request.nextUrl.searchParams);
    const supabase = getAnonClient();
    let query = supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    if (filters.brand) {
      query = query.ilike("brand", filters.brand);
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
    console.error("Search count preview error:", error);
    return NextResponse.json(
      { error: "Failed to load search preview count" },
      { status: 500 },
    );
  }
}
