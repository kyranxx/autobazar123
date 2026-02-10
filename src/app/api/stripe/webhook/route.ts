import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  sendPaymentConfirmationEmail,
  sendPaymentFailureEmail,
  sendInvoiceEmail,
} from "@/lib/email/send-payment-confirmation";

export async function POST(request: NextRequest) {
  // Initialize clients inside the handler
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

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Log webhook event for debugging
    const { error: logError } = await supabaseAdmin
      .from("stripe_webhook_logs")
      .insert({
        event_id: event.id,
        event_type: event.type,
        status: "processing",
        metadata: event.data,
      });

    if (logError) {
      console.warn("Failed to log webhook event:", logError);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, packId, credits } = session.metadata || {};

        if (!userId || !credits) {
          console.error("Missing metadata in checkout session");
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "failed",
            "Missing metadata in checkout session",
          );
          break;
        }

        // Idempotency check using stripe_session_id (unique constraint)
        const { data: existingTx, error: checkError } = await supabaseAdmin
          .from("credit_transactions")
          .select("id, payment_status")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
          console.error("Error checking existing transaction:", checkError);
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "failed",
            `Idempotency check failed: ${checkError.message}`,
          );
          break;
        }

        if (existingTx) {
          console.log(
            `Payment ${session.id} already processed (status: ${existingTx.payment_status}), skipping`,
          );
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "skipped",
            "Payment already processed",
          );
          break;
        }

        const creditsToAdd = parseInt(credits, 10);

        // Get user profile and email
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from("profiles")
          .select("credit_balance, email, full_name")
          .eq("id", userId)
          .single();

        if (fetchError) {
          console.error("Failed to fetch user profile:", fetchError);
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "failed",
            `Failed to fetch profile: ${fetchError.message}`,
          );
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
          await logWebhookEvent(
            supabaseAdmin,
            event.id,
            "failed",
            `Failed to update balance: ${updateError.message}`,
          );
          break;
        }

        // Calculate amount from session
        const amount = (session.amount_total || 0) / 100; // Stripe amount is in cents

        // Record the transaction with invoice URL and metadata
        const { data: txData, error: txError } = await supabaseAdmin
          .from("credit_transactions")
          .insert({
            user_id: userId,
            action_type: "top_up",
            amount: creditsToAdd,
            description: `Kúpa kreditov - ${packId}`,
            stripe_payment_id: session.payment_intent as string,
            stripe_session_id: session.id,
            invoice_url: session.invoice as string | undefined,
            payment_status: "succeeded",
          })
          .select()
          .single();

        if (txError) {
          // If unique constraint violation, payment was already processed
          if (txError.code === "23505") {
            console.log(
              `Payment ${session.id} already processed (constraint), skipping`,
            );
            await logWebhookEvent(
              supabaseAdmin,
              event.id,
              "skipped",
              "Duplicate payment (constraint)",
            );
          } else {
            console.error("Failed to record transaction:", txError);
            await logWebhookEvent(
              supabaseAdmin,
              event.id,
              "failed",
              `Failed to insert transaction: ${txError.message}`,
            );
          }
          break;
        }

        // Send confirmation email with invoice
        if (profile?.email) {
          const emailResult = await sendPaymentConfirmationEmail({
            userEmail: profile.email,
            userName: profile.full_name || undefined,
            credits: creditsToAdd,
            amount,
            currency: session.currency || "eur",
            invoiceUrl: session.invoice as string | undefined,
            transactionId: txData.id,
          });

          if (emailResult.success) {
            console.log(`✓ Confirmation email sent to ${profile.email}`);
          } else {
            console.warn(
              `✗ Failed to send confirmation email: ${emailResult.error}`,
            );
          }

          // If invoice URL available, send separate invoice email
          if (session.invoice) {
            const invoiceResult = await sendInvoiceEmail(
              profile.email,
              profile.full_name || undefined,
              session.invoice as string,
              txData.id,
            );

            if (invoiceResult.success) {
              console.log(`✓ Invoice email sent to ${profile.email}`);
            }
          }
        }

        console.log(
          `✓ Successfully processed payment: ${creditsToAdd} credits to user ${userId}`,
        );
        await logWebhookEvent(
          supabaseAdmin,
          event.id,
          "processed",
          `Added ${creditsToAdd} credits to user ${userId}`,
        );
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session expired: ${session.id}`);

        // Mark transaction as failed if it exists
        if (session.id) {
          await supabaseAdmin
            .from("credit_transactions")
            .update({
              payment_status: "failed",
              failure_reason: "Checkout session expired",
            })
            .eq("stripe_session_id", session.id)
            .is("payment_status", null); // Only update if not already processed
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
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`✓ Payment intent succeeded: ${paymentIntent.id}`);
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

        console.log(`✗ Payment failed: ${paymentIntent.id} - ${reason}`);

        // Find and update transaction
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
          // Update transaction status
          await supabaseAdmin
            .from("credit_transactions")
            .update({
              payment_status: "failed",
              failure_reason: reason,
            })
            .eq("id", profile.id);

          // Send failure email
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
        console.log(`Unhandled event type: ${event.type}`);
        await logWebhookEvent(
          supabaseAdmin,
          event.id,
          "skipped",
          `Unhandled event type`,
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

/**
 * Helper function to log webhook events
 */
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
