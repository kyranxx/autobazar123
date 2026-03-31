import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { checkIdempotencyKey, storeIdempotencyKey } from "@/lib/idempotency";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { rejectInvalidCsrfRequest } from "@/lib/security/csrf";
import { createStripeClient } from "@/lib/stripe/client";
import {
  getDealerTopupPackage,
  getListingOperationPriceCents,
  parseDealerTopupId,
  type DealerTopupPackageId,
  type ListingActionOperation,
} from "@/lib/pricing/config";
import { getPricingConfig } from "@/lib/pricing/server";
import { assertRuntimeEnvConfigured, getTrimmedEnv } from "@/lib/env";

const DealerTopupCheckoutSchema = z
  .object({
    type: z.literal("dealer_topup"),
    packageId: z.string().trim().min(1),
  })
  .strict();

const PrivateListingActionSchema = z
  .object({
    type: z.literal("private_listing_action"),
    adId: z.string().uuid(),
    operation: z.enum([
      "publish_basic",
      "publish_premium",
      "publish_top",
      "prolong_basic",
      "prolong_premium",
      "prolong_top",
    ]),
  })
  .strict();

const CheckoutBodySchema = z.discriminatedUnion("type", [
  DealerTopupCheckoutSchema,
  PrivateListingActionSchema,
]);

export function getCheckoutRateLimitIdentifier(request: NextRequest): string {
  return createRateLimitIdentifier("checkout", request.headers);
}

export function resolveCheckoutIdempotencyKey(request: NextRequest): string | null {
  const rawHeader = request.headers.get("idempotency-key");
  const idempotencyKey = rawHeader?.trim();

  if (!idempotencyKey || idempotencyKey.length > 255) {
    return null;
  }

  return idempotencyKey;
}

function buildSuccessUrl(appUrl: string) {
  return `${appUrl}/platba/uspech?session_id={CHECKOUT_SESSION_ID}`;
}

function buildCancelUrl(appUrl: string, destination: string) {
  return `${appUrl}${destination}`;
}

export async function POST(request: NextRequest) {
  try {
    assertRuntimeEnvConfigured("stripeCheckout");

    const csrfError = rejectInvalidCsrfRequest(request);
    if (csrfError) {
      return csrfError;
    }

    const stripeSecretKey = getTrimmedEnv("STRIPE_SECRET_KEY");
    const appUrl = getTrimmedEnv("NEXT_PUBLIC_APP_URL");

    if (!stripeSecretKey || !appUrl) {
      return NextResponse.json(
        { error: "Platby sú dočasne nedostupné. Skúste to prosím neskôr." },
        { status: 503 },
      );
    }

    const rateLimitResult = await checkStrictRateLimit(
      getCheckoutRateLimitIdentifier(request),
    );

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

    const idempotencyKey = resolveCheckoutIdempotencyKey(request);
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: "Missing or invalid idempotency key" },
        { status: 400 },
      );
    }

    const cached = await checkIdempotencyKey(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached.response, {
        status: cached.statusCode,
      });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    if (!admin) {
      return NextResponse.json(
        { error: "Server nie je nakonfigurovaný." },
        { status: 500 },
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Používateľ nie je prihlásený" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = CheckoutBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná platobná požiadavka." },
        { status: 400 },
      );
    }

    const config = await getPricingConfig();
    const stripe = createStripeClient(stripeSecretKey);

    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (parsed.data.type === "dealer_topup") {
      const { data: dealer } = await admin
        .from("dealers")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!dealer?.id) {
        return NextResponse.json(
          { error: "Dealer účet sa nenašiel." },
          { status: 404 },
        );
      }

      const packageId = parseDealerTopupId(
        parsed.data.packageId,
        "dealer_100" satisfies DealerTopupPackageId,
      );
      const topupPackage = getDealerTopupPackage(config, packageId);

      if (!topupPackage) {
        return NextResponse.json(
          { error: "Neplatný balík dobitia." },
          { status: 400 },
        );
      }

      const { data: checkoutRow, error: checkoutInsertError } = await admin
        .from("billing_checkout_sessions")
        .insert({
          actor_user_id: user.id,
          dealer_id: dealer.id,
          actor_type: "dealer",
          checkout_kind: "dealer_topup",
          operation_type: topupPackage.id,
          resolved_price_cents: topupPackage.priceCents,
          bonus_cents: topupPackage.bonusCents,
          metadata: {
            packageId: topupPackage.id,
            packageLabel: topupPackage.label,
          },
        })
        .select("id")
        .single();

      if (checkoutInsertError || !checkoutRow?.id) {
        return NextResponse.json(
          { error: "Nepodarilo sa pripraviť platbu." },
          { status: 500 },
        );
      }

      const session = await stripe.checkout.sessions.create(
        {
          payment_method_types: ["card"],
          mode: "payment",
          customer_email: profile?.email || undefined,
          line_items: [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: `Dobiť zostatok ${topupPackage.label}`,
                  description: `${dealer.name} - bonus ${topupPackage.bonusCents / 100} €`,
                },
                unit_amount: topupPackage.priceCents,
              },
              quantity: 1,
            },
          ],
          metadata: {
            billingKind: "dealer_topup",
            billingCheckoutId: checkoutRow.id,
            actorUserId: user.id,
            dealerId: dealer.id,
            packageId: topupPackage.id,
          },
          customer_creation: "if_required",
          success_url: buildSuccessUrl(appUrl),
          cancel_url: buildCancelUrl(appUrl, "/dealer"),
        },
        { idempotencyKey },
      );

      await admin
        .from("billing_checkout_sessions")
        .update({
          stripe_session_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkoutRow.id);

      const responseBody = { sessionId: session.id, url: session.url };
      await storeIdempotencyKey(idempotencyKey, responseBody, 200);
      return NextResponse.json(responseBody);
    }

    const { data: ad } = await admin
      .from("ads")
      .select("id, seller_id, status")
      .eq("id", parsed.data.adId)
      .maybeSingle();

    if (!ad?.id) {
      return NextResponse.json(
        { error: "Inzerát sa nenašiel." },
        { status: 404 },
      );
    }

    if (ad.seller_id !== user.id) {
      return NextResponse.json(
        { error: "Nemáte prístup k tomuto inzerátu." },
        { status: 403 },
      );
    }

    const operation = parsed.data.operation satisfies ListingActionOperation;
    const resolvedPriceCents = getListingOperationPriceCents(config, operation);

    if (resolvedPriceCents <= 0) {
      return NextResponse.json(
        { error: "Táto akcia momentálne nevyžaduje platbu." },
        { status: 400 },
      );
    }

    const { data: checkoutRow, error: checkoutInsertError } = await admin
      .from("billing_checkout_sessions")
      .insert({
        actor_user_id: user.id,
        actor_type: "private",
        checkout_kind: "private_listing_action",
        target_ad_id: ad.id,
        operation_type: operation,
        resolved_price_cents: resolvedPriceCents,
        metadata: {
          adId: ad.id,
          status: ad.status,
        },
      })
      .select("id")
      .single();

    if (checkoutInsertError || !checkoutRow?.id) {
      return NextResponse.json(
        { error: "Nepodarilo sa pripraviť platbu." },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: profile?.email || undefined,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: getListingActionLabel(operation),
                description: "Autobazar123 - inzerát na 28 dní",
              },
              unit_amount: resolvedPriceCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          billingKind: "private_listing_action",
          billingCheckoutId: checkoutRow.id,
          actorUserId: user.id,
          adId: ad.id,
          operation,
        },
        customer_creation: "if_required",
        success_url: buildSuccessUrl(appUrl),
        cancel_url: buildCancelUrl(appUrl, "/moj-ucet?tab=ads"),
      },
      { idempotencyKey },
    );

    await admin
      .from("billing_checkout_sessions")
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkoutRow.id);

    const responseBody = { sessionId: session.id, url: session.url };
    await storeIdempotencyKey(idempotencyKey, responseBody, 200);
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Chyba pri vytváraní platby" },
      { status: 500 },
    );
  }
}

function getListingActionLabel(operation: ListingActionOperation) {
  switch (operation) {
    case "publish_premium":
      return "Publikovať Premium inzerát";
    case "publish_top":
      return "Publikovať Exclusive inzerát";
    case "prolong_basic":
      return "Predĺžiť inzerát";
    case "prolong_premium":
      return "Predĺžiť Premium inzerát";
    case "prolong_top":
      return "Predĺžiť Exclusive inzerát";
    case "publish_basic":
    default:
      return "Publikovať inzerát";
  }
}
