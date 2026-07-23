import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkStrictRateLimit } from "@/lib/ratelimit";
import { checkIdempotencyKey, storeIdempotencyKey } from "@/lib/idempotency";
import {
  buildScopedCheckoutIdempotencyKey,
  getCheckoutRateLimitIdentifier,
  resolveCheckoutIdempotencyKey,
} from "@/lib/stripe/checkout-request";
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
import { getTrimmedEnv } from "@/lib/env";
import { getEmailBrandName } from "@/lib/email/email-market";

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

function buildSuccessUrl(appUrl: string) {
  return `${appUrl}/platba/uspech?session_id={CHECKOUT_SESSION_ID}`;
}

function buildCancelUrl(appUrl: string, destination: string) {
  return `${appUrl}${destination}`;
}

function buildPaymentIntentData(
  metadata: Record<string, string>,
  receiptEmail?: string | null,
) {
  return {
    ...(receiptEmail ? { receipt_email: receiptEmail } : {}),
    metadata: {
      ...metadata,
      ...(receiptEmail ? { customerEmail: receiptEmail } : {}),
    },
  };
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
type StripeClient = ReturnType<typeof createStripeClient>;

async function attachStripeSessionId(
  admin: AdminClient,
  checkoutId: string,
  sessionId: string,
) {
  const { error } = await admin
    .from("billing_checkout_sessions")
    .update({
      stripe_session_id: sessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId);

  if (!error) {
    return true;
  }

  console.error("Failed to store Stripe checkout session id", {
    checkoutId,
    sessionId,
    error,
  });
  return false;
}

async function expireUnlinkedStripeSession(
  stripe: StripeClient,
  checkoutId: string,
  sessionId: string,
) {
  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    console.error("Failed to expire unlinked Stripe checkout session", {
      checkoutId,
      sessionId,
      error,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const scopedIdempotencyKey = buildScopedCheckoutIdempotencyKey({
      idempotencyKey,
      userId: user.id,
      body: parsed.data,
    });

    const cached = await checkIdempotencyKey(scopedIdempotencyKey);
    if (cached) {
      return NextResponse.json(cached.response, {
        status: cached.statusCode,
      });
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

      const checkoutMetadata = {
        billingKind: "dealer_topup",
        billingCheckoutId: checkoutRow.id,
        actorUserId: user.id,
        dealerId: dealer.id,
        packageId: topupPackage.id,
      };

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
          metadata: checkoutMetadata,
          payment_intent_data: buildPaymentIntentData(
            checkoutMetadata,
            profile?.email,
          ),
          customer_creation: "if_required",
          success_url: buildSuccessUrl(appUrl),
          cancel_url: buildCancelUrl(appUrl, "/dealer"),
        },
        { idempotencyKey: scopedIdempotencyKey },
      );

      const storedSessionId = await attachStripeSessionId(
        admin,
        checkoutRow.id,
        session.id,
      );

      if (!storedSessionId) {
        await expireUnlinkedStripeSession(stripe, checkoutRow.id, session.id);
        return NextResponse.json(
          { error: "Nepodarilo sa potvrdiť platbu." },
          { status: 502 },
        );
      }

      const responseBody = { sessionId: session.id, url: session.url };
      await storeIdempotencyKey(scopedIdempotencyKey, responseBody, 200);
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

    const checkoutMetadata = {
      billingKind: "private_listing_action",
      billingCheckoutId: checkoutRow.id,
      actorUserId: user.id,
      adId: ad.id,
      operation,
    };

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
                description: `${getEmailBrandName()} - inzerát na 28 dní`,
              },
              unit_amount: resolvedPriceCents,
            },
            quantity: 1,
          },
        ],
        metadata: checkoutMetadata,
        payment_intent_data: buildPaymentIntentData(
          checkoutMetadata,
          profile?.email,
        ),
        customer_creation: "if_required",
        success_url: buildSuccessUrl(appUrl),
        cancel_url: buildCancelUrl(appUrl, "/moj-ucet?tab=ads"),
      },
      { idempotencyKey: scopedIdempotencyKey },
    );

    const storedSessionId = await attachStripeSessionId(
      admin,
      checkoutRow.id,
      session.id,
    );

    if (!storedSessionId) {
      await expireUnlinkedStripeSession(stripe, checkoutRow.id, session.id);
      return NextResponse.json(
        { error: "Nepodarilo sa potvrdiť platbu." },
        { status: 502 },
      );
    }

    const responseBody = { sessionId: session.id, url: session.url };
    await storeIdempotencyKey(scopedIdempotencyKey, responseBody, 200);
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
