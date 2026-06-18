import type Stripe from "stripe";

interface StripeWebhookLogLookup {
  status: string | null;
  processed_at: string | null;
}

type WebhookLogStatus = "processing" | "processed" | "failed" | "skipped";
type WebhookReplayDecision =
  | {
      action: "process";
      reason:
        | "new_event"
        | "retry_failed"
        | "retry_stale_processing"
        | "retry_unknown_status";
    }
  | { action: "skip"; reason: "duplicate_terminal" | "duplicate_inflight" };

const DEFAULT_PROCESSING_STALE_WINDOW_MS = 5 * 60 * 1000;

export function resolveProcessingStaleWindowMs(
  envValue: string | undefined = process.env.STRIPE_WEBHOOK_PROCESSING_STALE_SECONDS,
): number {
  if (!envValue) {
    return DEFAULT_PROCESSING_STALE_WINDOW_MS;
  }

  const parsed = Number.parseInt(envValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PROCESSING_STALE_WINDOW_MS;
  }

  return parsed * 1000;
}

function isProcessingAttemptStale(
  processedAtIso: string | null,
  now: Date,
  staleWindowMs: number,
): boolean {
  if (!processedAtIso) {
    return true;
  }

  const processedAtMs = Date.parse(processedAtIso);
  if (Number.isNaN(processedAtMs)) {
    return true;
  }

  return now.getTime() - processedAtMs >= staleWindowMs;
}

export function getWebhookReplayDecision(
  existingLog: StripeWebhookLogLookup | null,
  now: Date = new Date(),
  staleWindowMs: number = DEFAULT_PROCESSING_STALE_WINDOW_MS,
): WebhookReplayDecision {
  if (!existingLog?.status) {
    return { action: "process", reason: "new_event" };
  }

  const status = existingLog.status as WebhookLogStatus;

  if (status === "processed" || status === "skipped") {
    return { action: "skip", reason: "duplicate_terminal" };
  }

  if (status === "failed") {
    return { action: "process", reason: "retry_failed" };
  }

  if (status === "processing") {
    if (isProcessingAttemptStale(existingLog.processed_at, now, staleWindowMs)) {
      return { action: "process", reason: "retry_stale_processing" };
    }

    return { action: "skip", reason: "duplicate_inflight" };
  }

  return { action: "process", reason: "retry_unknown_status" };
}

export function shouldApplyBillingForCheckoutSession(
  eventType: string,
  paymentStatus: Stripe.Checkout.Session.PaymentStatus | null | undefined,
): boolean {
  if (eventType === "checkout.session.async_payment_succeeded") {
    return true;
  }

  if (eventType === "checkout.session.completed") {
    return paymentStatus === "paid";
  }

  return false;
}
