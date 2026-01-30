import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint disables TOP and Highlight premium features after 7 days
// Should be called hourly via Vercel Cron
export async function GET(request: NextRequest) {
    // Verify cron secret to prevent unauthorized access
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        // Initialize Supabase admin client inside the handler
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const now = new Date().toISOString();
        let topExpired = 0;
        let highlightExpired = 0;

        // Expire TOP ads
        const { data: expiredTopAds, error: topFetchError } = await supabaseAdmin
            .from("ads")
            .select("id")
            .eq("is_top_ad", true)
            .lt("top_expires_at", now);

        if (topFetchError) {
            console.error("Error fetching expired TOP ads:", topFetchError);
        } else if (expiredTopAds && expiredTopAds.length > 0) {
            const { error: topUpdateError } = await supabaseAdmin
                .from("ads")
                .update({ is_top_ad: false, top_expires_at: null, updated_at: now })
                .in("id", expiredTopAds.map((ad) => ad.id));

            if (topUpdateError) {
                console.error("Error updating TOP ads:", topUpdateError);
            } else {
                topExpired = expiredTopAds.length;
            }
        }

        // Expire Highlighted ads
        const { data: expiredHighlightAds, error: highlightFetchError } = await supabaseAdmin
            .from("ads")
            .select("id")
            .eq("is_highlighted", true)
            .lt("highlight_expires_at", now);

        if (highlightFetchError) {
            console.error("Error fetching expired highlighted ads:", highlightFetchError);
        } else if (expiredHighlightAds && expiredHighlightAds.length > 0) {
            const { error: highlightUpdateError } = await supabaseAdmin
                .from("ads")
                .update({ is_highlighted: false, highlight_expires_at: null, updated_at: now })
                .in("id", expiredHighlightAds.map((ad) => ad.id));

            if (highlightUpdateError) {
                console.error("Error updating highlighted ads:", highlightUpdateError);
            } else {
                highlightExpired = expiredHighlightAds.length;
            }
        }

        console.log(`Expired ${topExpired} TOP ads and ${highlightExpired} highlighted ads at ${now}`);

        return NextResponse.json({
            message: "Premium expiration check completed",
            topAdsExpired: topExpired,
            highlightedAdsExpired: highlightExpired,
            timestamp: now,
        });
    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
