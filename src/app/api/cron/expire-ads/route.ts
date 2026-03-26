import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getCarsIndexName } from "@/lib/algolia";
import {
  createCronAdminClient,
  rejectWhenInvalidCronRequest,
  revalidateAdsCacheTags,
} from "@/lib/cron/route-helpers";
import { isExpectedPrerenderBailout } from "@/lib/next/prerender-bailout";

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

// This endpoint:
// 1. Expires ads that are past their 30-day active period
// 2. Disables TOP/Premium features after their configured promotion window
// Should be called daily via Vercel Cron
export async function GET(request: NextRequest) {
  try {
    const cronError = rejectWhenInvalidCronRequest(request);
    if (cronError) {
      return cronError;
    }

    const supabaseAdmin = createCronAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Cron admin client is not configured" },
        { status: 500 },
      );
    }

    const now = new Date().toISOString();
    const results: {
      expiredAds: number;
      expiredPremiums: number;
      removedFromAlgolia: number;
    } = {
      expiredAds: 0,
      expiredPremiums: 0,
      removedFromAlgolia: 0,
    };
    let didMutateAds = false;

    // 1. EXPIRE ADS (past 30 days)
    const { data: expiredAds, error: fetchError } = await supabaseAdmin
      .from("ads")
      .select("id, seller_id, brand, model")
      .eq("status", "active")
      .lt("expires_at", now);

    if (fetchError) {
      console.error("Error fetching expired ads:", fetchError);
    } else if ((expiredAds?.length ?? 0) > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("ads")
        .update({ status: "expired", updated_at: now })
        .in(
          "id",
          expiredAds!.map((ad) => ad.id),
        );

      if (!updateError) {
        results.expiredAds = expiredAds!.length;
        didMutateAds = true;
        console.log(`Expired ${expiredAds!.length} ads at ${now}`);
      }
    }

    // 2. EXPIRE PREMIUMS (TOP and Premium)
    // Disable TOP ads where top_expires_at is in the past
    const { data: expiredTops } = await supabaseAdmin
      .from("ads")
      .select("id")
      .eq("is_top_ad", true)
      .lt("top_expires_at", now);

    if ((expiredTops?.length ?? 0) > 0) {
      await supabaseAdmin
        .from("ads")
        .update({
          is_top_ad: false,
          top_expires_at: null,
          promotion_tier: "none",
          promotion_started_at: null,
          promotion_expires_at: null,
          updated_at: now,
        })
        .in(
          "id",
          expiredTops!.map((ad) => ad.id),
        );

      results.expiredPremiums += expiredTops!.length;
      didMutateAds = true;
      console.log(`Expired ${expiredTops!.length} TOP ads at ${now}`);
    }

    // Disable Highlighted ads where highlight_expires_at is in the past
    const { data: expiredHighlights } = await supabaseAdmin
      .from("ads")
      .select("id")
      .eq("is_highlighted", true)
      .lt("highlight_expires_at", now);

    if ((expiredHighlights?.length ?? 0) > 0) {
      await supabaseAdmin
        .from("ads")
        .update({
          is_highlighted: false,
          highlight_expires_at: null,
          promotion_tier: "none",
          promotion_started_at: null,
          promotion_expires_at: null,
          updated_at: now,
        })
        .in(
          "id",
          expiredHighlights!.map((ad) => ad.id),
        );

      results.expiredPremiums += expiredHighlights!.length;
      didMutateAds = true;
      console.log(
        `Expired ${expiredHighlights!.length} Premium ads at ${now}`,
      );
    }

    // 3. Keep Algolia index consistent with database visibility/status.
    // Remove every ad that is no longer publicly searchable.
    try {
      const { data: staleAds, error: staleFetchError } = await supabaseAdmin
        .from("ads")
        .select("id")
        .or("status.neq.active,is_hidden.eq.true");

      if (staleFetchError) {
        console.error("Error fetching stale ads for Algolia cleanup:", staleFetchError);
      } else {
        const staleIds = (staleAds ?? [])
          .map((ad) => ad.id)
          .filter((id): id is string => typeof id === "string" && id.length > 0);

        if (staleIds.length > 0) {
          const algolia = getAdminClient();
          const carsIndexName = getCarsIndexName();
          const idChunks = chunkArray(staleIds, 1000);

          for (const objectIDs of idChunks) {
            await algolia.deleteObjects({
              indexName: carsIndexName,
              objectIDs,
            });
          }

          results.removedFromAlgolia = staleIds.length;
          console.log(`Removed ${staleIds.length} stale ads from Algolia at ${now}`);
        }
      }
    } catch (algoliaError) {
      // Do not fail the whole cron if Algolia is temporarily unavailable.
      console.error("Algolia cleanup error:", algoliaError);
    }

    if (didMutateAds) {
      revalidateAdsCacheTags();
    }

    return NextResponse.json({
      message: "Cron job completed successfully",
      expiredAds: results.expiredAds,
      expiredPremiums: results.expiredPremiums,
      removedFromAlgolia: results.removedFromAlgolia,
      timestamp: now,
    });
  } catch (error) {
    if (!isExpectedPrerenderBailout(error)) {
      console.error("Cron job error:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
