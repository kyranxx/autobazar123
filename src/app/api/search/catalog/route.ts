import { NextResponse } from "next/server";
import { getAnonClient } from "@/lib/supabase/anon";
import { transformCarToAlgoliaRecord } from "@/lib/algolia";

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

export async function GET() {
  try {
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
    console.error("Search fallback catalog error:", error);
    return NextResponse.json(
      { error: "Failed to load search fallback catalog" },
      { status: 500 },
    );
  }
}
