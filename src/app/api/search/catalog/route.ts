import { NextRequest, NextResponse } from "next/server";
import { getAnonClient } from "@/lib/supabase/anon";
import { transformCarToAlgoliaRecord } from "@/lib/algolia";
import { recordFallbackActivation } from "@/lib/fallbacks/monitor";
import type { FallbackKey } from "@/lib/fallbacks/registry";
import { isExpectedPrerenderBailout } from "@/lib/next/prerender-bailout";

interface SupabaseAd {
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
}

const PAGE_SIZE = 1000;
const SEARCH_FALLBACK_REASONS = new Set<FallbackKey>([
  "search.algolia_missing_keys",
  "search.algolia_unavailable",
]);

export async function GET(request: NextRequest) {
  try {
    const fallbackReason = request.nextUrl.searchParams.get("fallbackReason");
    if (
      fallbackReason
      && SEARCH_FALLBACK_REASONS.has(fallbackReason as FallbackKey)
    ) {
      await recordFallbackActivation({
        key: fallbackReason as FallbackKey,
        summary:
          fallbackReason === "search.algolia_missing_keys"
            ? "Algolia search keys are missing; fallback catalog search served from API."
            : "Algolia runtime search failed; fallback catalog search served from API.",
      });
    }

    const supabase = getAnonClient();
    let from = 0;
    let hasMore = true;
    const ads: SupabaseAd[] = [];

    while (hasMore) {
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
            body_style,
            power_kw,
            location_city,
            photos_json,
            is_top_ad,
            is_highlighted,
            is_vat_deductible,
            has_service_book,
            not_crashed,
            is_bought_in_sk,
            created_at,
            brands:brand_id (name),
            models:model_id (name)
          `,
        )
        .eq("status", "active")
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw error;
      }

      ads.push(...((data as unknown as SupabaseAd[]) ?? []));
      hasMore = (data?.length ?? 0) === PAGE_SIZE;
      from += PAGE_SIZE;
    }

    return NextResponse.json(
      {
        records: ads.map(transformCarToAlgoliaRecord),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    if (isExpectedPrerenderBailout(error)) {
      return NextResponse.json(
        { records: [], degraded: true },
        {
          headers: {
            "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
          },
        },
      );
    }

    console.info("Search fallback catalog: returning empty records.", error);
    await recordFallbackActivation({
      key: "search.catalog_api_degraded",
      summary: "Fallback catalog API failed and returned empty degraded records.",
      error,
    });
    return NextResponse.json(
      { records: [], degraded: true },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  }
}
