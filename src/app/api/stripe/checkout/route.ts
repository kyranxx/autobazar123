import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS } from "@/config/credits";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { checkIdempotencyKey, storeIdempotencyKey } from "@/lib/idempotency";

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRole || !appUrl) {
      return NextResponse.json(
        { error: "Platby sú dočasne nedostupné. Skúste to prosím neskôr." },
        { status: 503 },
      );
    }

    const ip =
      request.headers.get("x-client-ip") ||
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
          },
        },
      );
    }

    const idempotencyKey = request.headers.get("idempotency-key");

    if (idempotencyKey) {
      const cached = await checkIdempotencyKey(idempotencyKey);
      if (cached) {
        return NextResponse.json(cached.response, {
          status: cached.statusCode,
        });
      }
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Používateľ nie je prihlásený" },
        { status: 401 },
      );
    }

    const userId = user.id;

    const stripe = new Stripe(stripeSecretKey);
    const supabaseAdmin = createAdminClient(
      supabaseUrl,
      supabaseServiceRole,
    );

    const body = await request.json();
    const { packId } = body;

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json(
        { error: "Neplatný balík kreditov" },
        { status: 400 },
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, is_dealer")
      .eq("id", userId)
      .single();

    // Get dealer info if user is a dealer
    let dealerName = "";
    if (profile?.is_dealer) {
      const { data: dealerData } = await supabaseAdmin
        .from("dealers")
        .select("business_name")
        .eq("owner_id", userId)
        .maybeSingle();

      dealerName = dealerData?.business_name || "";
    }

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
        customer_name: profile?.full_name || "Unknown",
        customer_email: profile?.email || "unknown",
        business_name: dealerName || "N/A",
      },
      // Add customer metadata for future support
      customer_creation: "if_required",
      success_url: `${appUrl}/kredity/uspech?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/kredity?canceled=true`,
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
      { status: 500 },
    );
  }
}
