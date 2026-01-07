import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint hides sold ads after 4 days (they stay visible for "Recently Sold" feed)
// Should be called daily at 6am via Vercel Cron
export async function GET() {
    try {
        // Initialize Supabase admin client inside the handler
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const now = new Date();
        const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
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
                { status: 500 }
            );
        }

        if (!oldSoldAds || oldSoldAds.length === 0) {
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
            .in("id", oldSoldAds.map((ad) => ad.id));

        if (updateError) {
            console.error("Error hiding sold ads:", updateError);
            return NextResponse.json(
                { error: "Failed to hide sold ads" },
                { status: 500 }
            );
        }

        console.log(`Hidden ${oldSoldAds.length} old sold ads at ${nowIso}`);

        return NextResponse.json({
            message: `Successfully hidden ${oldSoldAds.length} old sold ads`,
            count: oldSoldAds.length,
            ads: oldSoldAds.map((ad) => ({
                id: ad.id,
                title: `${ad.brand} ${ad.model}`,
                soldAt: ad.sold_at,
            })),
            timestamp: nowIso,
        });
    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
