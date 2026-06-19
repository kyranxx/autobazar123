import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import {
  getWebhookReplayDecision,
  resolveProcessingStaleWindowMs,
  shouldApplyBillingForCheckoutSession,
} from "@/lib/stripe/webhook-processing";

const webhookMocks = vi.hoisted(() => ({
  createStripeClient: vi.fn(),
  createSupabaseClient: vi.fn(),
  constructEvent: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  rpc: vi.fn(),
  updateEq: vi.fn(),
  enqueuePaymentConfirmationEmailJob: vi.fn(),
  enqueuePaymentFailureEmailJob: vi.fn(),
  scheduleQueuedEmailDrain: vi.fn(),
}));

vi.mock("@/lib/stripe/client", () => ({
  createStripeClient: (...args: unknown[]) =>
    webhookMocks.createStripeClient(...args),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) =>
    webhookMocks.createSupabaseClient(...args),
}));

vi.mock("@/lib/email/jobs", () => ({
  enqueuePaymentConfirmationEmailJob: (...args: unknown[]) =>
    webhookMocks.enqueuePaymentConfirmationEmailJob(...args),
  enqueuePaymentFailureEmailJob: (...args: unknown[]) =>
    webhookMocks.enqueuePaymentFailureEmailJob(...args),
  scheduleQueuedEmailDrain: (...args: unknown[]) =>
    webhookMocks.scheduleQueuedEmailDrain(...args),
}));

const WEBHOOK_ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

type WebhookUpdateCall = {
  table: string;
  payload: Record<string, unknown>;
  eq?: { column: string; value: unknown };
  neq?: { column: string; value: unknown };
};

let updateCalls: WebhookUpdateCall[] = [];

function createWebhookRequest({
  signature = "t=1,v1=valid",
  body = "{}",
}: {
  signature?: string | null;
  body?: string;
} = {}) {
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (signature !== null) {
    headers.set("stripe-signature", signature);
  }

  return new NextRequest("https://autobazar123.sk/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  });
}

function createCheckoutSessionEvent({
  id = "evt_checkout_paid",
  paymentStatus = "paid",
  billingCheckoutId = "billing-checkout-1",
}: {
  id?: string;
  paymentStatus?: string;
  billingCheckoutId?: string;
} = {}) {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        payment_status: paymentStatus,
        metadata: billingCheckoutId ? { billingCheckoutId } : {},
        payment_intent: "pi_test_123",
        invoice: "in_test_123",
      },
    },
  };
}

function installSupabaseWebhookMock() {
  const supabase = {
    rpc: (...args: unknown[]) => webhookMocks.rpc(...args),
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => webhookMocks.maybeSingle(),
        }),
      }),
      insert: (payload: unknown) => webhookMocks.insert(payload),
      update: (payload: Record<string, unknown>) => ({
        eq: (column: string, value: unknown) => {
          const updateCall: WebhookUpdateCall = {
            table,
            payload,
            eq: { column, value },
          };
          updateCalls.push(updateCall);

          if (table === "billing_checkout_sessions") {
            return {
              neq: (neqColumn: string, neqValue: unknown) => {
                updateCall.neq = { column: neqColumn, value: neqValue };
                return webhookMocks.updateEq();
              },
            };
          }

          return webhookMocks.updateEq();
        },
      }),
    }),
  };

  webhookMocks.createSupabaseClient.mockReturnValue(supabase);
}

beforeEach(() => {
  vi.clearAllMocks();
  updateCalls = [];

  process.env.STRIPE_SECRET_KEY = "sk_test_webhook";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

  webhookMocks.createStripeClient.mockReturnValue({
    webhooks: {
      constructEvent: (...args: unknown[]) =>
        webhookMocks.constructEvent(...args),
    },
  });
  webhookMocks.constructEvent.mockReturnValue(createCheckoutSessionEvent());
  webhookMocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  webhookMocks.insert.mockResolvedValue({ error: null });
  webhookMocks.rpc.mockResolvedValue({
    data: { success: true, duplicate: false, kind: "private_listing_action" },
    error: null,
  });
  webhookMocks.updateEq.mockResolvedValue({ error: null });
  webhookMocks.enqueuePaymentConfirmationEmailJob.mockResolvedValue({ ok: true });
  webhookMocks.enqueuePaymentFailureEmailJob.mockResolvedValue({ ok: true });

  installSupabaseWebhookMock();
});

describe("POST /api/stripe/webhook", () => {
  it("fails closed when webhook configuration is missing", async () => {
    for (const key of WEBHOOK_ENV_KEYS) {
      expect(process.env[key]).toBeTruthy();
    }
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await POST(createWebhookRequest());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({ error: "Stripe webhook is not configured" });
    expect(webhookMocks.createStripeClient).not.toHaveBeenCalled();
    expect(webhookMocks.createSupabaseClient).not.toHaveBeenCalled();
  });

  it("rejects requests without a Stripe signature before processing", async () => {
    const response = await POST(createWebhookRequest({ signature: null }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Missing Stripe signature" });
    expect(webhookMocks.constructEvent).not.toHaveBeenCalled();
    expect(webhookMocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects invalid Stripe signatures before claiming an event", async () => {
    webhookMocks.constructEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const response = await POST(createWebhookRequest());
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Invalid signature" });
    expect(webhookMocks.maybeSingle).not.toHaveBeenCalled();
    expect(webhookMocks.insert).not.toHaveBeenCalled();
    expect(webhookMocks.rpc).not.toHaveBeenCalled();
  });

  it("applies a paid checkout session once and logs it as processed", async () => {
    webhookMocks.constructEvent.mockReturnValue(
      createCheckoutSessionEvent({
        id: "evt_checkout_paid_once",
        billingCheckoutId: "billing-checkout-paid",
      }),
    );

    const response = await POST(createWebhookRequest({ body: "{\"id\":\"evt\"}" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ received: true });
    expect(webhookMocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "evt_checkout_paid_once",
        event_type: "checkout.session.completed",
        status: "processing",
      }),
    );
    expect(webhookMocks.rpc).toHaveBeenCalledWith(
      "apply_billing_checkout_session",
      {
        p_checkout_session_id: "billing-checkout-paid",
        p_stripe_session_id: "cs_test_123",
        p_stripe_payment_id: "pi_test_123",
        p_invoice_url: "in_test_123",
      },
    );
    expect(updateCalls).toContainEqual(
      expect.objectContaining({
        table: "stripe_webhook_logs",
        payload: expect.objectContaining({
          status: "processed",
          error_message: expect.stringContaining("billing-checkout-paid"),
        }),
        eq: { column: "event_id", value: "evt_checkout_paid_once" },
      }),
    );
  });

  it("queues a payment confirmation email after a non-duplicate paid checkout", async () => {
    webhookMocks.rpc.mockResolvedValue({
      data: {
        success: true,
        duplicate: false,
        kind: "private_listing_action",
        transaction_id: "11111111-1111-4111-8111-111111111111",
      },
      error: null,
    });
    webhookMocks.constructEvent.mockReturnValue({
      id: "evt_checkout_paid_email",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_email",
          payment_status: "paid",
          amount_total: 499,
          currency: "eur",
          customer_email: "buyer@example.com",
          customer_details: { email: "buyer@example.com", name: "Buyer Test" },
          metadata: {
            billingCheckoutId: "billing-checkout-paid",
            billingKind: "private_listing_action",
            operation: "publish_premium",
          },
          payment_intent: "pi_test_123",
          invoice: null,
        },
      },
    });

    const response = await POST(createWebhookRequest({ body: "{\"id\":\"evt\"}" }));

    expect(response.status).toBe(200);
    expect(webhookMocks.enqueuePaymentConfirmationEmailJob).toHaveBeenCalledWith({
      userEmail: "buyer@example.com",
      userName: "Buyer Test",
      summaryLabel: "Platba",
      summaryValue: "Publikovať Premium inzerát",
      amount: 4.99,
      currency: "eur",
      transactionId: "11111111-1111-4111-8111-111111111111",
      invoiceUrl: undefined,
    });
    expect(webhookMocks.scheduleQueuedEmailDrain).toHaveBeenCalledWith({
      batchSize: 5,
      jobTypes: ["payment_confirmation"],
    });
  });

  it("returns 500 when paid checkout billing RPC fails so Stripe can retry", async () => {
    webhookMocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "Could not apply listing purchase" },
    });
    webhookMocks.constructEvent.mockReturnValue(
      createCheckoutSessionEvent({
        id: "evt_checkout_rpc_failed",
        billingCheckoutId: "billing-checkout-rpc-failed",
      }),
    );

    const response = await POST(createWebhookRequest({ body: "{\"id\":\"evt\"}" }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Webhook handler failed" });
    expect(updateCalls).toContainEqual(
      expect.objectContaining({
        table: "stripe_webhook_logs",
        payload: expect.objectContaining({
          status: "failed",
          error_message: "Checkout apply failed: Could not apply listing purchase",
        }),
        eq: { column: "event_id", value: "evt_checkout_rpc_failed" },
      }),
    );
    expect(webhookMocks.enqueuePaymentConfirmationEmailJob).not.toHaveBeenCalled();
  });

  it("returns 500 when paid checkout billing RPC returns unsuccessful so Stripe can retry", async () => {
    webhookMocks.rpc.mockResolvedValue({
      data: { success: false, error: "This ad cannot be prolonged" },
      error: null,
    });
    webhookMocks.constructEvent.mockReturnValue(
      createCheckoutSessionEvent({
        id: "evt_checkout_apply_unsuccessful",
        billingCheckoutId: "billing-checkout-apply-unsuccessful",
      }),
    );

    const response = await POST(createWebhookRequest({ body: "{\"id\":\"evt\"}" }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Webhook handler failed" });
    expect(updateCalls).toContainEqual(
      expect.objectContaining({
        table: "stripe_webhook_logs",
        payload: expect.objectContaining({
          status: "failed",
          error_message: "This ad cannot be prolonged",
        }),
        eq: { column: "event_id", value: "evt_checkout_apply_unsuccessful" },
      }),
    );
    expect(webhookMocks.enqueuePaymentConfirmationEmailJob).not.toHaveBeenCalled();
  });

  it("skips terminal duplicate events without replaying billing side effects", async () => {
    webhookMocks.constructEvent.mockReturnValue(
      createCheckoutSessionEvent({ id: "evt_duplicate_processed" }),
    );
    webhookMocks.maybeSingle.mockResolvedValue({
      data: {
        status: "processed",
        processed_at: "2026-05-15T12:00:00.000Z",
      },
      error: null,
    });

    const response = await POST(createWebhookRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ received: true, duplicate: true });
    expect(webhookMocks.insert).not.toHaveBeenCalled();
    expect(webhookMocks.rpc).not.toHaveBeenCalled();
    expect(updateCalls).toEqual([]);
  });

  it("does not apply billing for an unpaid completed checkout session", async () => {
    webhookMocks.constructEvent.mockReturnValue(
      createCheckoutSessionEvent({
        id: "evt_checkout_pending",
        paymentStatus: "unpaid",
      }),
    );

    const response = await POST(createWebhookRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ received: true });
    expect(webhookMocks.rpc).not.toHaveBeenCalled();
    expect(updateCalls).toContainEqual(
      expect.objectContaining({
        table: "stripe_webhook_logs",
        payload: expect.objectContaining({
          status: "processed",
          error_message: "Checkout completed while payment is still pending",
        }),
        eq: { column: "event_id", value: "evt_checkout_pending" },
      }),
    );
  });

  it("queues a payment failure email after an async failed checkout session", async () => {
    webhookMocks.constructEvent.mockReturnValue({
      id: "evt_checkout_async_failed_email",
      type: "checkout.session.async_payment_failed",
      data: {
        object: {
          id: "cs_test_failed",
          amount_total: 499,
          currency: "eur",
          customer_email: "buyer@example.com",
          customer_details: { email: "buyer@example.com", name: "Buyer Test" },
          metadata: {
            billingCheckoutId: "billing-checkout-failed",
            billingKind: "private_listing_action",
            operation: "publish_premium",
          },
        },
      },
    });

    const response = await POST(createWebhookRequest({ body: "{\"id\":\"evt\"}" }));

    expect(response.status).toBe(200);
    expect(updateCalls).toContainEqual(
      expect.objectContaining({
        table: "billing_checkout_sessions",
        payload: expect.objectContaining({
          status: "failed",
        }),
        eq: { column: "stripe_session_id", value: "cs_test_failed" },
        neq: { column: "status", value: "paid" },
      }),
    );
    expect(webhookMocks.enqueuePaymentFailureEmailJob).toHaveBeenCalledWith({
      userEmail: "buyer@example.com",
      userName: "Buyer Test",
      amount: 4.99,
      currency: "eur",
      failureReason: "Checkout async payment failed",
    });
    expect(webhookMocks.scheduleQueuedEmailDrain).toHaveBeenCalledWith({
      batchSize: 5,
      jobTypes: ["payment_failure"],
    });
  });
});

describe("resolveProcessingStaleWindowMs", () => {
  it("uses default stale window when env value is missing", () => {
    expect(resolveProcessingStaleWindowMs(undefined)).toBe(300000);
  });

  it("uses configured stale window when env value is valid", () => {
    expect(resolveProcessingStaleWindowMs("45")).toBe(45000);
  });

  it("falls back to default for invalid stale window values", () => {
    expect(resolveProcessingStaleWindowMs("0")).toBe(300000);
    expect(resolveProcessingStaleWindowMs("not-a-number")).toBe(300000);
  });
});

describe("getWebhookReplayDecision", () => {
  const now = new Date("2026-02-24T12:00:00.000Z");
  const staleWindowMs = 5 * 60 * 1000;

  it("processes brand new events", () => {
    expect(getWebhookReplayDecision(null, now, staleWindowMs)).toEqual({
      action: "process",
      reason: "new_event",
    });
  });

  it("skips terminal duplicate events", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processed",
          processed_at: "2026-02-24T11:59:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "skip", reason: "duplicate_terminal" });

    expect(
      getWebhookReplayDecision(
        {
          status: "skipped",
          processed_at: "2026-02-24T11:59:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "skip", reason: "duplicate_terminal" });
  });

  it("retries previously failed events", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "failed",
          processed_at: "2026-02-24T11:59:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_failed" });
  });

  it("treats fresh processing rows as in-flight duplicates", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "2026-02-24T11:57:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "skip", reason: "duplicate_inflight" });
  });

  it("retries stale processing rows after interrupted first attempt", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "2026-02-24T11:50:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_stale_processing" });
  });

  it("retries processing rows with missing or invalid processed_at", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: null,
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_stale_processing" });

    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "not-a-date",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_stale_processing" });
  });

  it("treats stale-window boundary as retryable", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "2026-02-24T11:55:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_stale_processing" });
  });

  it("keeps future processing rows as in-flight duplicates", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "2026-02-24T12:02:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "skip", reason: "duplicate_inflight" });
  });

  it("retries unknown statuses to recover out-of-order transitions", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "queued",
          processed_at: "2026-02-24T11:59:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_unknown_status" });
  });
});

describe("shouldApplyBillingForCheckoutSession", () => {
  it("applies billing updates for paid completed sessions", () => {
    expect(
      shouldApplyBillingForCheckoutSession("checkout.session.completed", "paid"),
    ).toBe(true);
  });

  it("defers billing updates for unpaid completed sessions", () => {
    expect(
      shouldApplyBillingForCheckoutSession("checkout.session.completed", "unpaid"),
    ).toBe(false);
  });

  it("applies billing updates for async success events", () => {
    expect(
      shouldApplyBillingForCheckoutSession(
        "checkout.session.async_payment_succeeded",
        "unpaid",
      ),
    ).toBe(true);
  });

  it("does not apply billing updates for unrelated events", () => {
    expect(
      shouldApplyBillingForCheckoutSession("payment_intent.succeeded", "paid"),
    ).toBe(false);
  });
});
