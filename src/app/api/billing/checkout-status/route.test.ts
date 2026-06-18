import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const getUserMock = vi.fn();
const dealerMaybeSingleMock = vi.fn();
const actorCheckoutMaybeSingleMock = vi.fn();
const dealerCheckoutMaybeSingleMock = vi.fn();
const dealerEqMock = vi.fn();
const checkoutEqMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}));

import { GET } from "./route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const DEALER_ID = "22222222-2222-4222-8222-222222222222";
const SESSION_ID = "cs_test_123";

function createRequest(sessionId: string | null = SESSION_ID) {
  const url = new URL("http://localhost/api/billing/checkout-status");
  if (sessionId !== null) {
    url.searchParams.set("sessionId", sessionId);
  }

  return new NextRequest(url, { method: "GET" });
}

function installSupabaseClientMock() {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => getUserMock(...args),
    },
  });
}

function installAdminClientMock() {
  createAdminClientMock.mockReturnValue({
    from: (table: string) => {
      if (table === "dealers") {
        return {
          select: () => ({
            eq: (column: string, value: unknown) => {
              dealerEqMock(column, value);
              return {
                maybeSingle: () => dealerMaybeSingleMock(),
              };
            },
          }),
        };
      }

      return {
        select: () => ({
          eq: (firstColumn: string, firstValue: unknown) => {
            checkoutEqMock(firstColumn, firstValue);

            return {
              eq: (secondColumn: string, secondValue: unknown) => {
                checkoutEqMock(secondColumn, secondValue);

                return {
                  maybeSingle: () => {
                    if (secondColumn === "dealer_id") {
                      return dealerCheckoutMaybeSingleMock();
                    }

                    return actorCheckoutMaybeSingleMock();
                  },
                };
              },
            };
          },
        }),
      };
    },
  });
}

describe("GET /api/billing/checkout-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    dealerMaybeSingleMock.mockResolvedValue({
      data: { id: DEALER_ID },
      error: null,
    });
    actorCheckoutMaybeSingleMock.mockResolvedValue({
      data: {
        id: "33333333-3333-4333-8333-333333333333",
        stripe_session_id: SESSION_ID,
        checkout_kind: "private_listing_action",
        operation_type: "prolong_top",
        status: "paid",
        target_ad_id: "44444444-4444-4444-8444-444444444444",
        paid_at: "2026-05-15T10:00:00.000Z",
      },
      error: null,
    });
    dealerCheckoutMaybeSingleMock.mockResolvedValue({
      data: {
        id: "55555555-5555-4555-8555-555555555555",
        stripe_session_id: SESSION_ID,
        checkout_kind: "dealer_topup",
        operation_type: "dealer_topup",
        status: "paid",
        target_ad_id: null,
        paid_at: "2026-05-15T10:05:00.000Z",
      },
      error: null,
    });

    installSupabaseClientMock();
    installAdminClientMock();
  });

  it("requires a session id before loading auth or billing data", async () => {
    const response = await GET(createRequest(null));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Missing session id." });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("requires authentication before using the admin billing client", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("fails closed when the admin billing client is unavailable", async () => {
    createAdminClientMock.mockReturnValue(null);

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Server misconfigured." });
    expect(actorCheckoutMaybeSingleMock).not.toHaveBeenCalled();
  });

  it("returns a checkout session owned by the authenticated actor", async () => {
    const response = await GET(createRequest(` ${SESSION_ID} `));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      id: "33333333-3333-4333-8333-333333333333",
      stripe_session_id: SESSION_ID,
      checkout_kind: "private_listing_action",
      operation_type: "prolong_top",
      status: "paid",
      target_ad_id: "44444444-4444-4444-8444-444444444444",
      paid_at: "2026-05-15T10:00:00.000Z",
    });
    expect(dealerEqMock).toHaveBeenCalledWith("owner_id", USER_ID);
    expect(checkoutEqMock).toHaveBeenCalledWith("stripe_session_id", SESSION_ID);
    expect(checkoutEqMock).toHaveBeenCalledWith("actor_user_id", USER_ID);
    expect(dealerCheckoutMaybeSingleMock).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("falls back to the authenticated user's dealer checkout only by dealer id", async () => {
    actorCheckoutMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      id: "55555555-5555-4555-8555-555555555555",
      stripe_session_id: SESSION_ID,
      checkout_kind: "dealer_topup",
      operation_type: "dealer_topup",
      status: "paid",
      target_ad_id: null,
      paid_at: "2026-05-15T10:05:00.000Z",
    });
    expect(dealerEqMock).toHaveBeenCalledWith("owner_id", USER_ID);
    expect(checkoutEqMock).toHaveBeenCalledWith("dealer_id", DEALER_ID);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns pending when no actor or dealer checkout is visible to the user", async () => {
    actorCheckoutMaybeSingleMock.mockResolvedValue({ data: null, error: null });
    dealerCheckoutMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: "pending" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("does not query dealer checkout fallback when the user has no dealer", async () => {
    actorCheckoutMaybeSingleMock.mockResolvedValue({ data: null, error: null });
    dealerMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: "pending" });
    expect(dealerCheckoutMaybeSingleMock).not.toHaveBeenCalled();
  });

  it("surfaces checkout lookup failures without reporting pending", async () => {
    actorCheckoutMaybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "query failed" },
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Nepodarilo sa načítať platbu." });
    expect(dealerCheckoutMaybeSingleMock).not.toHaveBeenCalled();
  });
});
