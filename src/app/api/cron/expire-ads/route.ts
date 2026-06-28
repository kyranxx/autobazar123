import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getCarsIndexName } from "@/lib/algolia";
import {
  createCronAdminClient,
  rejectWhenInvalidCronRequest,
  revalidateAdsCacheTags,
} from "@/lib/cron/route-helpers";
import { recordFallbackActivation } from "@/lib/fallbacks/monitor";
import { isExpectedPrerenderBailout } from "@/lib/next/prerender-bailout";

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

type CronFailure = {
  code:
    | "expired_ads_fetch_failed"
    | "expired_ads_update_failed"
    | "expired_top_ads_fetch_failed"
    | "expired_top_ads_update_failed"
    | "expired_highlighted_ads_fetch_failed"
    | "expired_highlighted_ads_update_failed"
    | "algolia_stale_ads_fetch_failed"
    | "algolia_cleanup_failed";
  summary: string;
};

function getFailureStatus(failures: CronFailure[]): 500 | 502 {
  return failures.every((failure) => failure.code === "algolia_cleanup_failed")
    ? 502
    : 500;
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
    const failures: CronFailure[] = [];
    let didMutateAds = false;

    // 1. EXPIRE ADS (past 30 days)
    const { data: expiredAds, error: fetchError } = await supabaseAdmin
      .from("ads")
      .select("id, seller_id, brand, model")
      .eq("status", "active")
      .lt("expires_at", now);

    if (fetchError) {
      console.error("Error fetching expired ads:", fetchError);
      failures.push({
        code: "expired_ads_fetch_failed",
        summary: "Expired ads lookup failed",
      });
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
      } else {
        console.error("Error updating expired ads:", updateError);
        failures.push({
          code: "expired_ads_update_failed",
          summary: "Expired ads status update failed",
        });
      }
    }

    // 2. EXPIRE PREMIUMS (TOP and Premium)
    // Disable TOP ads where top_expires_at is in the past
    const { data: expiredTops, error: expiredTopsError } = await supabaseAdmin
      .from("ads")
      .select("id")
      .eq("is_top_ad", true)
      .lt("top_expires_at", now);

    if (expiredTopsError) {
      console.error("Error fetching expired TOP ads:", expiredTopsError);
      failures.push({
        code: "expired_top_ads_fetch_failed",
        summary: "Expired TOP ads lookup failed",
      });
    } else if ((expiredTops?.length ?? 0) > 0) {
      const { error: expiredTopsUpdateError } = await supabaseAdmin
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

      if (expiredTopsUpdateError) {
        console.error("Error updating expired TOP ads:", expiredTopsUpdateError);
        failures.push({
          code: "expired_top_ads_update_failed",
          summary: "Expired TOP ads update failed",
        });
      } else {
        results.expiredPremiums += expiredTops!.length;
        didMutateAds = true;
        console.log(`Expired ${expiredTops!.length} TOP ads at ${now}`);
      }
    }

    // Disable Highlighted ads where highlight_expires_at is in the past
    const { data: expiredHighlights, error: expiredHighlightsError } = await supabaseAdmin
      .from("ads")
      .select("id")
      .eq("is_highlighted", true)
      .lt("highlight_expires_at", now);

    if (expiredHighlightsError) {
      console.error(
        "Error fetching expired highlighted ads:",
        expiredHighlightsError,
      );
      failures.push({
        code: "expired_highlighted_ads_fetch_failed",
        summary: "Expired highlighted ads lookup failed",
      });
    } else if ((expiredHighlights?.length ?? 0) > 0) {
      const { error: expiredHighlightsUpdateError } = await supabaseAdmin
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

      if (expiredHighlightsUpdateError) {
        console.error(
          "Error updating expired highlighted ads:",
          expiredHighlightsUpdateError,
        );
        failures.push({
          code: "expired_highlighted_ads_update_failed",
          summary: "Expired highlighted ads update failed",
        });
      } else {
        results.expiredPremiums += expiredHighlights!.length;
        didMutateAds = true;
        console.log(
          `Expired ${expiredHighlights!.length} Premium ads at ${now}`,
        );
      }
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
        failures.push({
          code: "algolia_stale_ads_fetch_failed",
          summary: "Stale ads lookup for Algolia cleanup failed",
        });
      } else {
        const staleIds = (staleAds ?? [])
          .map((ad) => ad.id)
          .filter((id): id is string => typeof id === "string" && id.length > 0);

        if (staleIds.length > 0) {
          const algolia = getAdminClient();
          const carsIndexName = getCarsIndexName();
          const idChunks = chunkArray(staleIds, 1000);

          try {
            for (const objectIDs of idChunks) {
              await algolia.deleteObjects({
                indexName: carsIndexName,
                objectIDs,
              });
            }

            results.removedFromAlgolia = staleIds.length;
            console.log(`Removed ${staleIds.length} stale ads from Algolia at ${now}`);
          } catch (algoliaError) {
            console.error("Algolia cleanup error:", algoliaError);
            failures.push({
              code: "algolia_cleanup_failed",
              summary: "Algolia stale ad cleanup failed",
            });
            await recordFallbackActivation({
              key: "cron.expire_ads_algolia_cleanup_failed",
              summary: "Algolia stale ad cleanup failed during expire-ads cron.",
              error: algoliaError,
              metadata: {
                indexName: carsIndexName,
                staleAdCount: staleIds.length,
              },
            });
          }
        }
      }
    } catch (algoliaError) {
      console.error("Algolia cleanup error:", algoliaError);
      failures.push({
        code: "algolia_cleanup_failed",
        summary: "Algolia stale ad cleanup failed",
      });
      await recordFallbackActivation({
        key: "cron.expire_ads_algolia_cleanup_failed",
        summary: "Algolia stale ad cleanup failed during expire-ads cron.",
        error: algoliaError,
      });
    }

    if (didMutateAds) {
      revalidateAdsCacheTags();
    }

    if (failures.length > 0) {
      return NextResponse.json(
        {
          message: "Cron job completed with failures",
          degraded: true,
          failures,
          expiredAds: results.expiredAds,
          expiredPremiums: results.expiredPremiums,
          removedFromAlgolia: results.removedFromAlgolia,
          timestamp: now,
        },
        { status: getFailureStatus(failures) },
      );
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
