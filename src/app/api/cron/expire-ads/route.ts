import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint:
// 1. Expires ads that are past their 30-day active period
// 2. Disables TOP/Highlight features after 7 days
// Should be called daily via Vercel Cron
export async function GET(_request: NextRequest) {
  try {
    // Initialize Supabase admin client inside the handler
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const now = new Date().toISOString();
    const results: { expiredAds: number; expiredPremiums: number } = {
      expiredAds: 0,
      expiredPremiums: 0,
    };

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
        console.log(`Expired ${expiredAds!.length} ads at ${now}`);
      }
    }

    // 2. EXPIRE PREMIUMS (TOP and Highlight)
    // Disable TOP ads where top_expires_at is in the past
    const { data: expiredTops } = await supabaseAdmin
      .from("ads")
      .select("id")
      .eq("is_top_ad", true)
      .lt("top_expires_at", now);

    if ((expiredTops?.length ?? 0) > 0) {
      await supabaseAdmin
        .from("ads")
        .update({ is_top_ad: false, top_expires_at: null, updated_at: now })
        .in(
          "id",
          expiredTops!.map((ad) => ad.id),
        );

      results.expiredPremiums += expiredTops!.length;
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
          updated_at: now,
        })
        .in(
          "id",
          expiredHighlights!.map((ad) => ad.id),
        );

      results.expiredPremiums += expiredHighlights!.length;
      console.log(
        `Expired ${expiredHighlights!.length} Highlighted ads at ${now}`,
      );
    }

    return NextResponse.json({
      message: "Cron job completed successfully",
      expiredAds: results.expiredAds,
      expiredPremiums: results.expiredPremiums,
      timestamp: now,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
