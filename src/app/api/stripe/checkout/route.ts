import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { CREDIT_PACKS } from "@/config/credits";
import { checkStrictRateLimit } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
    try {
        // 🛑 Rate limiting - 10 requests per minute per IP
        const ip = request.headers.get("x-client-ip") ||
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            "anonymous";
        const rateLimitResult = await checkStrictRateLimit(`checkout:${ip}`);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Príliš veľa pokusov. Skúste znova neskôr." },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                        "Retry-After": "60",
                    }
                }
            );
        }

        // Initialize clients inside the handler
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const body = await request.json();
        const { packId, userId } = body;

        // Validate pack
        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (!pack) {
            return NextResponse.json(
                { error: "Neplatný balík kreditov" },
                { status: 400 }
            );
        }

        // Validate user
        if (!userId) {
            return NextResponse.json(
                { error: "Používateľ nie je prihlásený" },
                { status: 401 }
            );
        }

        // Get user email from Supabase
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .single();

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: profile?.email || undefined,
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: `${pack.credits} kreditov - ${pack.nameSk}`,
                            description: `Kredity pre Autobazar123`,
                        },
                        unit_amount: pack.price * 100, // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
                packId: pack.id,
                credits: pack.credits.toString(),
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/kredity/uspech?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/kredity?canceled=true`,
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json(
            { error: "Chyba pri vytváraní platby" },
            { status: 500 }
        );
    }
}
