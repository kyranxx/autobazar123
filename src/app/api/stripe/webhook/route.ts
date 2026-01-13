import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    // Initialize clients inside the handler
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing Stripe signature" },
                { status: 400 }
            );
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const { userId, packId, credits } = session.metadata || {};

                if (!userId || !credits) {
                    console.error("Missing metadata in checkout session");
                    break;
                }

                const creditsToAdd = parseInt(credits, 10);

                // Get current balance
                const { data: profile, error: fetchError } = await supabaseAdmin
                    .from("profiles")
                    .select("credit_balance")
                    .eq("id", userId)
                    .single();

                if (fetchError) {
                    console.error("Failed to fetch user profile:", fetchError);
                    break;
                }

                const currentBalance = profile?.credit_balance || 0;
                const newBalance = currentBalance + creditsToAdd;

                // Update credit balance
                const { error: updateError } = await supabaseAdmin
                    .from("profiles")
                    .update({ credit_balance: newBalance })
                    .eq("id", userId);

                if (updateError) {
                    console.error("Failed to update credit balance:", updateError);
                    break;
                }

                // Record the transaction
                await supabaseAdmin.from("credit_transactions").insert({
                    user_id: userId,
                    action_type: "top_up",
                    amount: creditsToAdd,
                    description: `Kúpa kreditov - ${packId}`,
                    stripe_payment_id: session.id,
                });

                console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`);
                break;
            }
            case "payment_intent.succeeded": {
                console.log("Payment intent succeeded");
                break;
            }
            case "payment_intent.payment_failed": {
                console.log("Payment failed");
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
