import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  sendInvoiceEmail,
  sendPaymentConfirmationEmail,
  sendPaymentFailureEmail,
} from "@/lib/email/send-payment-confirmation";

interface ProcessStripeTopUpResult {
  success: boolean;
  duplicate: boolean;
  transaction_id?: string;
  new_balance?: number;
  error?: string;
}
interface StripeWebhookLogLookup {
  status: string | null;
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { data: existingLog, error: lookupError } = await supabaseAdmin
      .from("stripe_webhook_logs")
      .select("status")
      .eq("event_id", event.id)
      .maybeSingle<StripeWebhookLogLookup>();

    if (lookupError) {
      console.warn("Failed to lookup webhook duplicate state:", lookupError);
    }

    if (existingLog?.status && existingLog.status !== "failed") {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (existingLog?.status === "failed") {
      const { error: resetError } = await supabaseAdmin
        .from("stripe_webhook_logs")
        .update({
          status: "processing",
          error_message: null,
          metadata: event.data,
        })
        .eq("event_id", event.id);

      if (resetError) {
        console.warn("Failed to reset failed webhook log for retry:", resetError);
      }
    } else {
      const { error: logError } = await supabaseAdmin
        .from("stripe_webhook_logs")
        .insert({
          event_id: event.id,
          event_type: event.type,
          status: "processing",
          metadata: event.data,
        });

      if (logError?.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
      }

      if (logError) {
        console.warn("Failed to log webhook event:", logError);
      }
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, packId, credits } = session.metadata || {};

        if (!userId || !credits) {
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "failed",
            "Missing metadata in checkout session",
          );
          break;
        }

        const creditsToAdd = Number.parseInt(credits, 10);
        if (!Number.isInteger(creditsToAdd) || creditsToAdd <= 0) {
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "failed",
            "Invalid credits value in checkout metadata",
          );
          break;
        }

        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
          "process_stripe_credit_topup",
          {
            p_user_id: userId,
            p_stripe_session_id: session.id,
            p_stripe_payment_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            p_pack_id: packId || "unknown",
            p_credits: creditsToAdd,
            p_invoice_url:
              typeof session.invoice === "string" ? session.invoice : null,
          },
        );

        if (rpcError) {
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "failed",
            `Atomic top-up failed: ${rpcError.message}`,
          );
          break;
        }

        const topUpResult = rpcData as ProcessStripeTopUpResult | null;
        if (!topUpResult?.success) {
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "failed",
            topUpResult?.error || "Atomic top-up returned unsuccessful result",
          );
          break;
        }

        if (topUpResult.duplicate) {
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "skipped",
            "Payment already processed",
          );
          break;
        }

        const amount = (session.amount_total || 0) / 100;
        const transactionId = topUpResult.transaction_id;

        const { data: profile, error: fetchError } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .maybeSingle();

        if (fetchError) {
          console.warn(
            `Could not load profile for payment notification (${userId}): ${fetchError.message}`,
          );
        }

        if (profile?.email && transactionId) {
          const emailResult = await sendPaymentConfirmationEmail({
            userEmail: profile.email,
            userName: profile.full_name || undefined,
            credits: creditsToAdd,
            amount,
            currency: session.currency || "eur",
            invoiceUrl: session.invoice as string | undefined,
            transactionId,
          });

          if (!emailResult.success) {
            console.warn(
              `Failed to send confirmation email: ${emailResult.error}`,
            );
          }

          if (session.invoice) {
            await sendInvoiceEmail(
              profile.email,
              profile.full_name || undefined,
              session.invoice as string,
              transactionId,
            );
          }
        }

        await logWebhookEvent(
          supabaseAdmin,
          event.id,
          "processed",
          `Added ${creditsToAdd} credits to user ${userId} atomically`,
        );
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.id) {
          await supabaseAdmin
            .from("credit_transactions")
            .update({
              payment_status: "failed",
              failure_reason: "Checkout session expired",
            })
            .eq("stripe_session_id", session.id)
            .is("payment_status", null);
        }

        await logWebhookEvent(
          supabaseAdmin,
          event.id,
          "processed",
          "Session expired",
        );
        break;
      }

      case "payment_intent.succeeded": {
        await logWebhookEvent(
          supabaseAdmin,
          event.id,
          "processed",
          "Payment intent succeeded",
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const reason =
          paymentIntent.last_payment_error?.message || "Unknown reason";

        const { data: profile } = await supabaseAdmin
          .from("credit_transactions")
          .select(
            `
            id,
            user_id,
            amount,
            profiles:user_id (email, full_name)
          `,
          )
          .eq("stripe_payment_id", paymentIntent.id)
          .maybeSingle();

        if (profile) {
          await supabaseAdmin
            .from("credit_transactions")
            .update({
              payment_status: "failed",
              failure_reason: reason,
            })
            .eq("id", profile.id);

          const profileData = Array.isArray(profile.profiles)
            ? profile.profiles[0]
            : profile.profiles;

          if (profileData?.email) {
            await sendPaymentFailureEmail({
              userEmail: profileData.email,
              userName: profileData.full_name || undefined,
              amount: profile.amount || 0,
              currency: "eur",
              failureReason: reason,
              transactionId: profile.id,
            });
          }
        }

        await logWebhookEvent(
          supabaseAdmin,
          event.id,
          "processed",
          `Payment failed: ${reason}`,
        );
        break;
      }

      default:
        await logWebhookEvent(
          supabaseAdmin,
          event.id,
          "skipped",
          "Unhandled event type",
        );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook Error:", errorMessage);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function logWebhookEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any>>,
  eventId: string,
  status: string,
  errorMessage?: string,
) {
  const { error } = await supabase
    .from("stripe_webhook_logs")
    .update({
      status,
      error_message: errorMessage,
    })
    .eq("event_id", eventId);

  if (error) {
    console.warn("Failed to update webhook log:", error);
  }
}
