import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DEFAULT_PRICING_CONFIG_V1 } from "@/lib/pricing/config";

const checkoutMocks = vi.hoisted(() => ({
  rejectInvalidCsrfRequest: vi.fn(),
  checkStrictRateLimit: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getUser: vi.fn(),
  createStripeClient: vi.fn(),
  stripeSessionCreate: vi.fn(),
  stripeSessionExpire: vi.fn(),
  checkIdempotencyKey: vi.fn(),
  storeIdempotencyKey: vi.fn(),
  getPricingConfig: vi.fn(),
  profileMaybeSingle: vi.fn(),
  dealerMaybeSingle: vi.fn(),
  adMaybeSingle: vi.fn(),
  checkoutSingle: vi.fn(),
  updateEq: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfRequest: (...args: unknown[]) =>
    checkoutMocks.rejectInvalidCsrfRequest(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) =>
    checkoutMocks.checkStrictRateLimit(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => checkoutMocks.createClient(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: (...args: unknown[]) =>
    checkoutMocks.createAdminClient(...args),
}));

vi.mock("@/lib/stripe/client", () => ({
  createStripeClient: (...args: unknown[]) =>
    checkoutMocks.createStripeClient(...args),
}));

vi.mock("@/lib/idempotency", () => ({
  checkIdempotencyKey: (...args: unknown[]) =>
    checkoutMocks.checkIdempotencyKey(...args),
  storeIdempotencyKey: (...args: unknown[]) =>
    checkoutMocks.storeIdempotencyKey(...args),
}));

vi.mock("@/lib/pricing/server", () => ({
  getPricingConfig: (...args: unknown[]) =>
    checkoutMocks.getPricingConfig(...args),
}));

import { POST } from "./route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const AD_ID = "33333333-3333-4333-8333-333333333333";
const DEALER_ID = "44444444-4444-4444-8444-444444444444";

type InsertCall = {
  table: string;
  payload: Record<string, unknown>;
};

type UpdateCall = {
  table: string;
  payload: Record<string, unknown>;
  eq: { column: string; value: unknown };
};

let insertCalls: InsertCall[] = [];
let updateCalls: UpdateCall[] = [];

function createCheckoutRequest(body: unknown) {
  return new NextRequest("https://autobazar123.sk/api/stripe/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "checkout-test-key",
    },
    body: JSON.stringify(body),
  });
}

function createAdminMock() {
  return {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => checkoutMocks.profileMaybeSingle(),
            }),
          }),
        };
      }

      if (table === "dealers") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => checkoutMocks.dealerMaybeSingle(),
            }),
          }),
        };
      }

      if (table === "ads") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => checkoutMocks.adMaybeSingle(),
            }),
          }),
        };
      }

      if (table === "billing_checkout_sessions") {
        return {
          insert: (payload: Record<string, unknown>) => {
            insertCalls.push({ table, payload });
            return {
              select: () => ({
                single: () => checkoutMocks.checkoutSingle(),
              }),
            };
          },
          update: (payload: Record<string, unknown>) => ({
            eq: (column: string, value: unknown) => {
              updateCalls.push({ table, payload, eq: { column, value } });
              return checkoutMocks.updateEq();
            },
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCalls = [];
    updateCalls = [];

    process.env.STRIPE_SECRET_KEY = "sk_test_checkout";
    process.env.NEXT_PUBLIC_APP_URL = "https://autobazar123.sk";

    checkoutMocks.rejectInvalidCsrfRequest.mockReturnValue(null);
    checkoutMocks.checkStrictRateLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    checkoutMocks.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
    });
    checkoutMocks.createClient.mockResolvedValue({
      auth: {
        getUser: (...args: unknown[]) => checkoutMocks.getUser(...args),
      },
    });
    checkoutMocks.createAdminClient.mockReturnValue(createAdminMock());
    checkoutMocks.checkIdempotencyKey.mockResolvedValue(null);
    checkoutMocks.storeIdempotencyKey.mockResolvedValue(undefined);
    checkoutMocks.getPricingConfig.mockResolvedValue(DEFAULT_PRICING_CONFIG_V1);
    checkoutMocks.profileMaybeSingle.mockResolvedValue({
      data: { email: "seller@example.com", full_name: "Test Seller" },
      error: null,
    });
    checkoutMocks.dealerMaybeSingle.mockResolvedValue({
      data: { id: DEALER_ID, name: "Test Dealer" },
      error: null,
    });
    checkoutMocks.adMaybeSingle.mockResolvedValue({
      data: { id: AD_ID, seller_id: USER_ID, status: "draft" },
      error: null,
    });
    checkoutMocks.checkoutSingle.mockResolvedValue({
      data: { id: "billing-checkout-1" },
      error: null,
    });
    checkoutMocks.updateEq.mockResolvedValue({ error: null });
    checkoutMocks.stripeSessionCreate.mockResolvedValue({
      id: "cs_test_checkout",
      url: "https://checkout.stripe.test/session",
    });
    checkoutMocks.stripeSessionExpire.mockResolvedValue({
      id: "cs_test_checkout",
      status: "expired",
    });
    checkoutMocks.createStripeClient.mockReturnValue({
      checkout: {
        sessions: {
          create: (...args: unknown[]) =>
            checkoutMocks.stripeSessionCreate(...args),
          expire: (...args: unknown[]) =>
            checkoutMocks.stripeSessionExpire(...args),
        },
      },
    });
  });

  it("creates a dealer topup checkout only for the current dealer owner", async () => {
    const response = await POST(
      createCheckoutRequest({
        type: "dealer_topup",
        packageId: "dealer_300",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      sessionId: "cs_test_checkout",
      url: "https://checkout.stripe.test/session",
    });
    expect(insertCalls).toContainEqual({
      table: "billing_checkout_sessions",
      payload: expect.objectContaining({
        actor_user_id: USER_ID,
        dealer_id: DEALER_ID,
        actor_type: "dealer",
        checkout_kind: "dealer_topup",
        operation_type: "dealer_300",
        resolved_price_cents: 30000,
        bonus_cents: 4500,
      }),
    });
    expect(checkoutMocks.stripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          billingKind: "dealer_topup",
          billingCheckoutId: "billing-checkout-1",
          actorUserId: USER_ID,
          dealerId: DEALER_ID,
          packageId: "dealer_300",
        }),
        success_url:
          "https://autobazar123.sk/platba/uspech?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://autobazar123.sk/dealer",
      }),
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(updateCalls).toContainEqual(
      expect.objectContaining({
        table: "billing_checkout_sessions",
        payload: expect.objectContaining({
          stripe_session_id: "cs_test_checkout",
        }),
        eq: { column: "id", value: "billing-checkout-1" },
      }),
    );
    expect(checkoutMocks.storeIdempotencyKey).toHaveBeenCalledWith(
      expect.any(String),
      payload,
      200,
    );
  });

  it("does not return a dealer checkout URL when storing the Stripe session id fails", async () => {
    checkoutMocks.updateEq.mockResolvedValueOnce({
      error: { message: "database unavailable" },
    });

    const response = await POST(
      createCheckoutRequest({
        type: "dealer_topup",
        packageId: "dealer_300",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toEqual({ error: "Nepodarilo sa potvrdiť platbu." });
    expect(checkoutMocks.stripeSessionCreate).toHaveBeenCalledOnce();
    expect(checkoutMocks.stripeSessionExpire).toHaveBeenCalledWith(
      "cs_test_checkout",
    );
    expect(checkoutMocks.storeIdempotencyKey).not.toHaveBeenCalled();
  });

  it("rejects private listing checkouts for another seller's ad", async () => {
    checkoutMocks.adMaybeSingle.mockResolvedValue({
      data: { id: AD_ID, seller_id: OTHER_USER_ID, status: "draft" },
      error: null,
    });

    const response = await POST(
      createCheckoutRequest({
        type: "private_listing_action",
        adId: AD_ID,
        operation: "prolong_top",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Nemáte prístup k tomuto inzerátu." });
    expect(checkoutMocks.stripeSessionCreate).not.toHaveBeenCalled();
    expect(insertCalls).toEqual([]);
    expect(checkoutMocks.storeIdempotencyKey).not.toHaveBeenCalled();
  });

  it("creates a private listing action checkout for an owned paid listing action", async () => {
    const response = await POST(
      createCheckoutRequest({
        type: "private_listing_action",
        adId: AD_ID,
        operation: "prolong_top",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      sessionId: "cs_test_checkout",
      url: "https://checkout.stripe.test/session",
    });
    expect(insertCalls).toContainEqual({
      table: "billing_checkout_sessions",
      payload: expect.objectContaining({
        actor_user_id: USER_ID,
        actor_type: "private",
        checkout_kind: "private_listing_action",
        target_ad_id: AD_ID,
        operation_type: "prolong_top",
        resolved_price_cents: 999,
        metadata: {
          adId: AD_ID,
          status: "draft",
        },
      }),
    });
    expect(checkoutMocks.stripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          billingKind: "private_listing_action",
          billingCheckoutId: "billing-checkout-1",
          actorUserId: USER_ID,
          adId: AD_ID,
          operation: "prolong_top",
        }),
        success_url:
          "https://autobazar123.sk/platba/uspech?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://autobazar123.sk/moj-ucet?tab=ads",
      }),
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(checkoutMocks.storeIdempotencyKey).toHaveBeenCalledWith(
      expect.any(String),
      payload,
      200,
    );
  });

  it("does not return a private listing checkout URL when storing the Stripe session id fails", async () => {
    checkoutMocks.updateEq.mockResolvedValueOnce({
      error: { message: "database unavailable" },
    });

    const response = await POST(
      createCheckoutRequest({
        type: "private_listing_action",
        adId: AD_ID,
        operation: "prolong_top",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toEqual({ error: "Nepodarilo sa potvrdiť platbu." });
    expect(checkoutMocks.stripeSessionCreate).toHaveBeenCalledOnce();
    expect(checkoutMocks.stripeSessionExpire).toHaveBeenCalledWith(
      "cs_test_checkout",
    );
    expect(checkoutMocks.storeIdempotencyKey).not.toHaveBeenCalled();
  });
});
