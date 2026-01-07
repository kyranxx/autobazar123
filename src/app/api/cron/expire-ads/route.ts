import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint expires ads that are past their 30-day active period
// Should be called hourly via Vercel Cron
export async function GET() {
    try {
        // Initialize Supabase admin client inside the handler
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const now = new Date().toISOString();

        // Find all active ads where expires_at is in the past
        const { data: expiredAds, error: fetchError } = await supabaseAdmin
            .from("ads")
            .select("id, seller_id, brand, model")
            .eq("status", "active")
            .lt("expires_at", now);

        if (fetchError) {
            console.error("Error fetching expired ads:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch expired ads" },
                { status: 500 }
            );
        }

        if (!expiredAds || expiredAds.length === 0) {
            return NextResponse.json({
                message: "No expired ads found",
                count: 0,
                timestamp: now,
            });
        }

        // Update all expired ads to 'expired' status
        const { error: updateError } = await supabaseAdmin
            .from("ads")
            .update({ status: "expired", updated_at: now })
            .in("id", expiredAds.map((ad) => ad.id));

        if (updateError) {
            console.error("Error updating expired ads:", updateError);
            return NextResponse.json(
                { error: "Failed to update expired ads" },
                { status: 500 }
            );
        }

        // TODO: Send notification emails to sellers about expired ads

        console.log(`Expired ${expiredAds.length} ads at ${now}`);

        return NextResponse.json({
            message: `Successfully expired ${expiredAds.length} ads`,
            count: expiredAds.length,
            ads: expiredAds.map((ad) => ({
                id: ad.id,
                title: `${ad.brand} ${ad.model}`,
            })),
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
