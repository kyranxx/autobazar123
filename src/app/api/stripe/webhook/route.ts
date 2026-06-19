import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createStripeClient } from "@/lib/stripe/client";
import { getTrimmedEnv } from "@/lib/env";
import {
  getWebhookReplayDecision,
  resolveProcessingStaleWindowMs,
  shouldApplyBillingForCheckoutSession,
} from "@/lib/stripe/webhook-processing";
import {
  enqueuePaymentConfirmationEmailJob,
  enqueuePaymentFailureEmailJob,
  scheduleQueuedEmailDrain,
} from "@/lib/email/jobs";
interface StripeWebhookLogLookup {
  status: string | null;
  processed_at: string | null;
}

export async function POST(request: NextRequest) {
  const stripeSecretKey = getTrimmedEnv("STRIPE_SECRET_KEY");
  const supabaseUrl = getTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRole = getTrimmedEnv("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = getTrimmedEnv("STRIPE_WEBHOOK_SECRET");

  if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRole || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const stripe = createStripeClient(stripeSecretKey);
  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRole,
  );

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

    const staleWindowMs = resolveProcessingStaleWindowMs();
    const shouldProcess = await claimWebhookEventForProcessing(
      supabaseAdmin,
      event,
      staleWindowMs,
    );

    if (!shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
          const session = event.data.object as Stripe.Checkout.Session;
          const metadata = session.metadata || {};
          const billingCheckoutId = metadata.billingCheckoutId;

          if (!shouldApplyBillingForCheckoutSession(event.type, session.payment_status)) {
            await logWebhookEvent(
              supabaseAdmin,
              event.id,
              "processed",
              "Checkout completed while payment is still pending",
            );
            break;
          }

          if (!billingCheckoutId) {
            await logWebhookEvent(
              supabaseAdmin,
              event.id,
              "failed",
              "Missing metadata in checkout session",
            );
            break;
          }

          const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
            "apply_billing_checkout_session",
            {
              p_checkout_session_id: billingCheckoutId,
              p_stripe_session_id: session.id,
              p_stripe_payment_id:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : null,
              p_invoice_url:
                typeof session.invoice === "string" ? session.invoice : null,
            },
          );

          if (rpcError) {
            await logWebhookEvent(
              supabaseAdmin,
              event.id,
              "failed",
              `Checkout apply failed: ${rpcError.message}`,
            );
            return NextResponse.json(
              { error: "Webhook handler failed" },
              { status: 500 },
            );
          }

          const checkoutResult = rpcData as
            | {
                success?: boolean;
                duplicate?: boolean;
                kind?: string;
                transaction_id?: string;
                error?: string;
              }
            | null;

          if (!checkoutResult?.success) {
            await logWebhookEvent(
              supabaseAdmin,
              event.id,
              "failed",
              checkoutResult?.error || "Checkout apply returned unsuccessful result",
            );
            return NextResponse.json(
              { error: "Webhook handler failed" },
              { status: 500 },
            );
          }

          if (checkoutResult.duplicate) {
            await logWebhookEvent(
              supabaseAdmin,
              event.id,
              "skipped",
              "Payment already processed",
            );
            break;
          }

          const customerEmail =
            session.customer_details?.email || session.customer_email || null;

          if (customerEmail && checkoutResult.transaction_id) {
            const enqueueResult = await enqueuePaymentConfirmationEmailJob({
              userEmail: customerEmail,
              userName: session.customer_details?.name || undefined,
              summaryLabel: "Platba",
              summaryValue: getCheckoutSummaryValue(metadata),
              amount: (session.amount_total ?? 0) / 100,
              currency: session.currency || "eur",
              invoiceUrl: getInvoiceUrl(session),
              transactionId: checkoutResult.transaction_id,
            });

            if (!enqueueResult.ok) {
              console.warn(
                "Failed to queue payment confirmation email:",
                enqueueResult.error,
              );
            } else {
              scheduleQueuedEmailDrain({
                batchSize: 5,
                jobTypes: ["payment_confirmation"],
              });
            }
          }

          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "processed",
            `Applied billing checkout ${billingCheckoutId} (${checkoutResult.kind || "unknown"})`,
          );
          break;
        }

        case "checkout.session.async_payment_failed": {
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.id) {
            await supabaseAdmin
              .from("billing_checkout_sessions")
              .update({
                status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_session_id", session.id)
              .neq("status", "paid");
          }

          await queuePaymentFailureEmailForCheckoutSession(
            session,
            "Checkout async payment failed",
          );

          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "processed",
            "Checkout async payment failed",
          );
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.id) {
            await supabaseAdmin
              .from("billing_checkout_sessions")
              .update({
                status: "expired",
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_session_id", session.id)
              .neq("status", "paid");
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

          await supabaseAdmin
            .from("billing_checkout_sessions")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_payment_id", paymentIntent.id)
            .neq("status", "paid");

          await queuePaymentFailureEmail({
            userEmail: paymentIntent.receipt_email || null,
            amountCents: paymentIntent.amount,
            currency: paymentIntent.currency,
            failureReason: reason,
          });

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
    } catch (processingError) {
      const processingErrorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Unknown processing error";
      await logWebhookEvent(
        supabaseAdmin,
        event.id,
        "failed",
        `Unhandled webhook processing error: ${processingErrorMessage}`,
      );
      throw processingError;
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
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);

  if (error) {
    console.warn("Failed to update webhook log:", error);
  }
}

async function lookupWebhookLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any>>,
  eventId: string,
): Promise<StripeWebhookLogLookup | null> {
  const { data, error } = await supabase
    .from("stripe_webhook_logs")
    .select("status, processed_at")
    .eq("event_id", eventId)
    .maybeSingle<StripeWebhookLogLookup>();

  if (error) {
    console.warn("Failed to lookup webhook duplicate state:", error);
  }

  return data;
}

async function markWebhookAsProcessing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any>>,
  event: Stripe.Event,
) {
  const { error } = await supabase
    .from("stripe_webhook_logs")
    .update({
      event_type: event.type,
      status: "processing",
      error_message: null,
      metadata: event.data,
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", event.id);

  if (error) {
    console.warn("Failed to set webhook event to processing:", error);
  }
}

async function insertWebhookAsProcessing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any>>,
  event: Stripe.Event,
) {
  return supabase.from("stripe_webhook_logs").insert({
    event_id: event.id,
    event_type: event.type,
    status: "processing",
    metadata: event.data,
    processed_at: new Date().toISOString(),
  });
}

async function claimWebhookEventForProcessing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any>>,
  event: Stripe.Event,
  staleWindowMs: number,
): Promise<boolean> {
  const initialLog = await lookupWebhookLog(supabase, event.id);
  const initialDecision = getWebhookReplayDecision(
    initialLog,
    new Date(),
    staleWindowMs,
  );

  if (initialDecision.action === "skip") {
    return false;
  }

  if (initialDecision.reason === "new_event") {
    const { error } = await insertWebhookAsProcessing(supabase, event);

    if (error?.code !== "23505" && error) {
      console.warn("Failed to log webhook event:", error);
      return true;
    }

    if (error?.code === "23505") {
      const retryLog = await lookupWebhookLog(supabase, event.id);
      const retryDecision = getWebhookReplayDecision(
        retryLog,
        new Date(),
        staleWindowMs,
      );

      if (retryDecision.action === "skip") {
        return false;
      }

      await markWebhookAsProcessing(supabase, event);
      return true;
    }

    return true;
  }

  await markWebhookAsProcessing(supabase, event);
  return true;
}

function getCheckoutSummaryValue(metadata: Stripe.Metadata): string {
  switch (metadata.operation) {
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
    default:
      return metadata.packageLabel || "Platobná operácia";
  }
}

function getInvoiceUrl(session: Stripe.Checkout.Session): string | undefined {
  const invoice = session.invoice;

  if (invoice && typeof invoice !== "string" && "hosted_invoice_url" in invoice) {
    return invoice.hosted_invoice_url || undefined;
  }

  return undefined;
}

async function queuePaymentFailureEmailForCheckoutSession(
  session: Stripe.Checkout.Session,
  failureReason: string,
) {
  await queuePaymentFailureEmail({
    userEmail: session.customer_details?.email || session.customer_email || null,
    userName: session.customer_details?.name || undefined,
    amountCents: session.amount_total,
    currency: session.currency,
    failureReason,
  });
}

async function queuePaymentFailureEmail(input: {
  userEmail: string | null;
  userName?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  failureReason: string;
}) {
  if (!input.userEmail) {
    return;
  }

  const enqueueResult = await enqueuePaymentFailureEmailJob({
    userEmail: input.userEmail,
    userName: input.userName ?? undefined,
    amount: (input.amountCents ?? 0) / 100,
    currency: input.currency || "eur",
    failureReason: input.failureReason,
  });

  if (!enqueueResult.ok) {
    console.warn(
      "Failed to queue payment failure email:",
      enqueueResult.error,
    );
    return;
  }

  scheduleQueuedEmailDrain({
    batchSize: 5,
    jobTypes: ["payment_failure"],
  });
}
