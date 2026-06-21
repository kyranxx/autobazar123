import { NextRequest, NextResponse } from "next/server";
import {
  createCronAdminClient,
  rejectWhenInvalidCronRequest,
  revalidateAdsCacheTags,
} from "@/lib/cron/route-helpers";
import { isExpectedPrerenderBailout } from "@/lib/next/prerender-bailout";

// This endpoint hides sold ads after 4 days (they stay visible for "Recently Sold" feed)
// Should be called daily via Vercel Cron; keep the schedule in sync with vercel.json.
export async function GET(request: NextRequest) {
  try {
    // rejectWhenInvalidCronRequest centralizes the CRON_SECRET and Unauthorized checks.
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

    const now = new Date();
    const fourDaysAgo = new Date(
      now.getTime() - 4 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const nowIso = now.toISOString();

    // Find all sold ads where sold_at is more than 4 days ago and still visible
    const { data: oldSoldAds, error: fetchError } = await supabaseAdmin
      .from("ads")
      .select("id, brand, model, sold_at")
      .eq("status", "sold")
      .eq("is_hidden", false)
      .lt("sold_at", fourDaysAgo);

    if (fetchError) {
      console.error("Error fetching old sold ads:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch sold ads" },
        { status: 500 },
      );
    }

    if ((oldSoldAds?.length ?? 0) === 0) {
      return NextResponse.json({
        message: "No old sold ads to hide",
        count: 0,
        timestamp: nowIso,
      });
    }

    // Hide old sold ads
    const { error: updateError } = await supabaseAdmin
      .from("ads")
      .update({ is_hidden: true, updated_at: nowIso })
      .in(
        "id",
        oldSoldAds!.map((ad) => ad.id),
      );

    if (updateError) {
      console.error("Error hiding sold ads:", updateError);
      return NextResponse.json(
        { error: "Failed to hide sold ads" },
        { status: 500 },
      );
    }

    revalidateAdsCacheTags();

    console.log(`Hidden ${oldSoldAds!.length} old sold ads at ${nowIso}`);

    return NextResponse.json({
      message: `Successfully hidden ${oldSoldAds!.length} old sold ads`,
      count: oldSoldAds!.length,
      ads: oldSoldAds!.map((ad) => ({
        id: ad.id,
        title: `${ad.brand} ${ad.model}`,
        soldAt: ad.sold_at,
      })),
      timestamp: nowIso,
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
