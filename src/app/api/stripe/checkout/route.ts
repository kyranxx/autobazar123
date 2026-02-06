import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { CREDIT_PACKS } from "@/config/credits";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { checkIdempotencyKey, storeIdempotencyKey } from "@/lib/idempotency";

export async function POST(request: NextRequest) {
    try {
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

        const idempotencyKey = request.headers.get("idempotency-key");

        if (idempotencyKey) {
            const cached = await checkIdempotencyKey(idempotencyKey);
            if (cached) {
                return NextResponse.json(cached.response, { status: cached.statusCode });
            }
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const body = await request.json();
        const { packId, userId } = body;

        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (!pack) {
            return NextResponse.json(
                { error: "Neplatný balík kreditov" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "Používateľ nie je prihlásený" },
                { status: 401 }
            );
        }

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .single();

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
                        unit_amount: pack.price * 100,
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

        const responseBody = { sessionId: session.id, url: session.url };

        if (idempotencyKey) {
            await storeIdempotencyKey(idempotencyKey, responseBody, 200);
        }

        return NextResponse.json(responseBody);
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json(
            { error: "Chyba pri vytváraní platby" },
            { status: 500 }
        );
    }
}
