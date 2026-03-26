import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAdminClient,
  getCarsIndexName,
  transformCarToAlgoliaRecord,
} from "@/lib/algolia";
import {
  getCarsIndexSettings,
  getCarsReplicaSettings,
  getCarsSynonymBatch,
} from "@/lib/algolia/admin-config";
import { assertRuntimeEnvConfigured, getTrimmedEnv } from "@/lib/env";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";

assertRuntimeEnvConfigured("algoliaSync");

// Server-side Supabase client with service role for admin operations
function createAdminSupabase() {
  const url = getTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getTrimmedEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing Supabase admin configuration");
  }
  return createClient(url, key);
}

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
  promotion_tier?: "none" | "premium" | "top";
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

/**
 * POST /api/algolia/sync
 * Syncs all active ads from Supabase to Algolia
 * Protected by API key header
 */
export async function POST(request: NextRequest) {
  const rate = await checkStrictRateLimit(
    createRateLimitIdentifier("algolia_sync", request.headers),
  );
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const expectedKey = getTrimmedEnv("ALGOLIA_SYNC_SECRET");

  if (!expectedKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing ALGOLIA_SYNC_SECRET" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabase();
    const algolia = getAdminClient();
    const carsIndexName = getCarsIndexName();

    const PAGE_SIZE = 1000;
    let syncedCount = 0;
    const taskIDs: number[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: ads, error } = await supabase
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
                    promotion_tier,
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
        console.error("Error fetching ads:", error);
        return NextResponse.json(
          { error: "Failed to fetch ads from database" },
          { status: 500 },
        );
      }

      if (ads && ads.length > 0) {
        const records = (ads as unknown as SupabaseAd[]).map(
          transformCarToAlgoliaRecord,
        );
        const batchResponse = await algolia.saveObjects({
          indexName: carsIndexName,
          objects: records,
        });
        syncedCount += records.length;
        taskIDs.push(...batchResponse.map((entry) => entry.taskID));
      }

      hasMore = (ads?.length || 0) === PAGE_SIZE;
      from += PAGE_SIZE;
    }

    if (syncedCount === 0) {
      return NextResponse.json({
        success: true,
        message: "No active ads to sync",
        count: 0,
      });
    }

    await algolia.customPut({
      path: `1/indexes/${encodeURIComponent(carsIndexName)}/settings`,
      body: getCarsIndexSettings(carsIndexName),
    });

    for (const replica of getCarsReplicaSettings()) {
      await algolia.customPut({
        path: `1/indexes/${encodeURIComponent(`${carsIndexName}${replica.suffix}`)}/settings`,
        body: {
          ranking: replica.ranking,
        },
      });
    }

    await algolia.customPost({
      path: `1/indexes/${encodeURIComponent(carsIndexName)}/synonyms/batch`,
      body: getCarsSynonymBatch().requests.map((request) => request.body) as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} ads to Algolia`,
      count: syncedCount,
      taskIDs,
    });
  } catch (error) {
    console.error("Algolia sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync to Algolia" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/algolia/sync
 * Clears all records from Algolia index
 * Protected by API key header
 */
export async function DELETE(request: NextRequest) {
  const rate = await checkStrictRateLimit(
    createRateLimitIdentifier("algolia_sync", request.headers),
  );
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  const authHeader = request.headers.get("authorization");
  const expectedKey = getTrimmedEnv("ALGOLIA_SYNC_SECRET");

  if (!expectedKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing ALGOLIA_SYNC_SECRET" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const algolia = getAdminClient();
    await algolia.clearObjects({ indexName: getCarsIndexName() });

    return NextResponse.json({
      success: true,
      message: "Cleared all records from Algolia index",
    });
  } catch (error) {
    console.error("Algolia clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear Algolia index" },
      { status: 500 },
    );
  }
}
