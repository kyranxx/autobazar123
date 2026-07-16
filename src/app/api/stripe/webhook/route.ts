import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createStripeClient } from "@/lib/stripe/client";
import { getTrimmedEnv } from "@/lib/env";
import { getDeploymentMarketCode, type MarketCode } from "@/config/markets";
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

type StripeWebhookJson =
  | string
  | number
  | boolean
  | null
  | { [key: string]: StripeWebhookJson | undefined }
  | StripeWebhookJson[];

type StripeWebhookDatabase = {
  public: {
    Tables: {
      billing_checkout_sessions: {
        Row: {
          id: string;
          status: string | null;
          stripe_payment_id: string | null;
          stripe_session_id: string | null;
          updated_at: string | null;
        };
        Insert: never;
        Update: {
          status?: string;
          stripe_payment_id?: string | null;
          stripe_session_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_transactions: {
        Row: {
          id: string;
          stripe_session_id: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      stripe_webhook_logs: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          status: string;
          session_id: string | null;
          user_id: string | null;
          error_message: string | null;
          metadata: StripeWebhookJson | null;
          processed_at: string | null;
        };
        Insert: {
          event_id: string;
          event_type: string;
          status: string;
          session_id?: string | null;
          user_id?: string | null;
          error_message?: string | null;
          metadata?: unknown;
          processed_at?: string | null;
        };
        Update: {
          event_type?: string;
          status?: string;
          session_id?: string | null;
          user_id?: string | null;
          error_message?: string | null;
          metadata?: unknown;
          processed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      apply_billing_checkout_session: {
        Args: {
          p_checkout_session_id: string;
          p_stripe_session_id: string;
          p_stripe_payment_id?: string | null;
          p_invoice_url?: string | null;
        };
        Returns: {
          success?: boolean;
          duplicate?: boolean;
          kind?: string;
          transaction_id?: string;
          error?: string;
        } | null;
      };
    };
  };
};

type SupabaseAdminClient = SupabaseClient<StripeWebhookDatabase>;

function getStripeEventMarketBoundary(event: Stripe.Event): {
  required: boolean;
  marketCode: string | null;
} {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        required: true,
        marketCode: session.metadata?.marketCode ?? null,
      };
    }
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      return {
        required: true,
        marketCode: paymentIntent.metadata?.marketCode ?? null,
      };
    }
    default:
      return { required: false, marketCode: null };
  }
}

function matchesDeploymentMarket(
  event: Stripe.Event,
  deploymentMarketCode: MarketCode,
): boolean {
  const boundary = getStripeEventMarketBoundary(event);
  return !boundary.required || boundary.marketCode === deploymentMarketCode;
}

export async function POST(request: NextRequest) {
  const stripeSecretKey = getTrimmedEnv("STRIPE_SECRET_KEY");
  const supabaseUrl = getTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRole = getTrimmedEnv("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = getTrimmedEnv("STRIPE_WEBHOOK_SECRET");
  const deploymentMarketCode = getDeploymentMarketCode();

  if (
    !stripeSecretKey ||
    !supabaseUrl ||
    !supabaseServiceRole ||
    !webhookSecret ||
    !deploymentMarketCode
  ) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const stripe = createStripeClient(stripeSecretKey);
  const supabaseAdmin = createClient<StripeWebhookDatabase>(
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

    if (!matchesDeploymentMarket(event, deploymentMarketCode)) {
      const boundary = getStripeEventMarketBoundary(event);
      console.error("Stripe webhook rejected by market boundary", {
        eventId: event.id,
        eventType: event.type,
        deploymentMarketCode,
        eventMarketCode: boundary.marketCode,
      });
      return NextResponse.json({ received: true, ignored: true });
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

          if (
            !shouldApplyBillingForCheckoutSession(
              event.type,
              session.payment_status,
            )
          ) {
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

          const checkoutResult = rpcData as {
            success?: boolean;
            duplicate?: boolean;
            kind?: string;
            transaction_id?: string;
            error?: string;
          } | null;

          if (!checkoutResult?.success) {
            await logWebhookEvent(
              supabaseAdmin,
              event.id,
              "failed",
              checkoutResult?.error ||
                "Checkout apply returned unsuccessful result",
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
          const paymentTransactionId =
            checkoutResult.transaction_id ||
            (customerEmail
              ? await lookupBillingTransactionIdByStripeSession(
                  supabaseAdmin,
                  session.id,
                )
              : null);
          let paymentEmailState = customerEmail
            ? "skipped:missing_transaction_id"
            : "skipped:no_customer_email";

          if (customerEmail && paymentTransactionId) {
            const enqueueResult = await enqueuePaymentConfirmationEmailJob({
              userEmail: customerEmail,
              userName: session.customer_details?.name || undefined,
              summaryLabel: "Platba",
              summaryValue: getCheckoutSummaryValue(metadata),
              amount: (session.amount_total ?? 0) / 100,
              currency: session.currency || "eur",
              invoiceUrl: getInvoiceUrl(session),
              transactionId: paymentTransactionId,
            });

            if (!enqueueResult.ok) {
              paymentEmailState = "queue_failed";
              console.warn(
                "Failed to queue payment confirmation email:",
                enqueueResult.error,
              );
            } else {
              paymentEmailState = "queued";
              scheduleQueuedEmailDrain({
                batchSize: 5,
                jobTypes: ["payment_confirmation"],
              });
            }
          } else if (customerEmail) {
            console.warn(
              "Payment confirmation email skipped because no billing transaction id was available.",
            );
          }

          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "processed",
            `Applied billing checkout ${billingCheckoutId} (${checkoutResult.kind || "unknown"}); payment_confirmation_email=${paymentEmailState}`,
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
          const billingCheckoutId =
            typeof paymentIntent.metadata?.billingCheckoutId === "string"
              ? paymentIntent.metadata.billingCheckoutId
              : null;
          const failureEmail =
            paymentIntent.receipt_email ||
            paymentIntent.metadata?.customerEmail ||
            null;

          const failedCheckoutUpdate = supabaseAdmin
            .from("billing_checkout_sessions")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            });

          if (billingCheckoutId) {
            await failedCheckoutUpdate
              .eq("id", billingCheckoutId)
              .neq("status", "paid");
          } else {
            await failedCheckoutUpdate
              .eq("stripe_payment_id", paymentIntent.id)
              .neq("status", "paid");
          }

          await queuePaymentFailureEmail({
            userEmail: failureEmail,
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
  supabase: SupabaseAdminClient,
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

async function lookupBillingTransactionIdByStripeSession(
  supabase: SupabaseAdminClient,
  stripeSessionId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("billing_transactions")
    .select("id")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle<{ id: string }>();

  if (error) {
    console.warn(
      "Failed to lookup billing transaction for payment confirmation email:",
      error.message,
    );
    return null;
  }

  return data?.id ?? null;
}

async function lookupWebhookLog(
  supabase: SupabaseAdminClient,
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
  supabase: SupabaseAdminClient,
  event: Stripe.Event,
) {
  const logContext = getWebhookLogContext(event);
  const { error } = await supabase
    .from("stripe_webhook_logs")
    .update({
      event_type: event.type,
      status: "processing",
      session_id: logContext.sessionId,
      user_id: logContext.userId,
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
  supabase: SupabaseAdminClient,
  event: Stripe.Event,
) {
  const logContext = getWebhookLogContext(event);
  return supabase.from("stripe_webhook_logs").insert({
    event_id: event.id,
    event_type: event.type,
    status: "processing",
    session_id: logContext.sessionId,
    user_id: logContext.userId,
    metadata: event.data,
    processed_at: new Date().toISOString(),
  });
}

function getWebhookLogContext(event: Stripe.Event): {
  sessionId: string | null;
  userId: string | null;
} {
  if (event.type.startsWith("checkout.session.")) {
    const session = event.data.object as Stripe.Checkout.Session;
    return {
      sessionId: typeof session.id === "string" ? session.id : null,
      userId:
        typeof session.metadata?.actorUserId === "string"
          ? session.metadata.actorUserId
          : null,
    };
  }

  if (event.type.startsWith("payment_intent.")) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    return {
      sessionId: null,
      userId:
        typeof paymentIntent.metadata?.actorUserId === "string"
          ? paymentIntent.metadata.actorUserId
          : null,
    };
  }

  return { sessionId: null, userId: null };
}

async function claimWebhookEventForProcessing(
  supabase: SupabaseAdminClient,
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

  if (
    invoice &&
    typeof invoice !== "string" &&
    "hosted_invoice_url" in invoice
  ) {
    return invoice.hosted_invoice_url || undefined;
  }

  return undefined;
}

async function queuePaymentFailureEmailForCheckoutSession(
  session: Stripe.Checkout.Session,
  failureReason: string,
) {
  await queuePaymentFailureEmail({
    userEmail:
      session.customer_details?.email || session.customer_email || null,
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
    console.warn("Failed to queue payment failure email:", enqueueResult.error);
    return;
  }

  scheduleQueuedEmailDrain({
    batchSize: 5,
    jobTypes: ["payment_failure"],
  });
}
