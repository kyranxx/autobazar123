import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rejectInvalidCsrfRequestMock = vi.fn();
const checkStrictRateLimitMock = vi.fn();
const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const getUserMock = vi.fn();
const adMaybeSingleMock = vi.fn();
const adminRpcMock = vi.fn();
const getPricingConfigMock = vi.fn();
const getListingOperationPriceCentsMock = vi.fn();

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfRequest: (...args: unknown[]) =>
    rejectInvalidCsrfRequestMock(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}));

vi.mock("@/lib/pricing/server", () => ({
  getPricingConfig: (...args: unknown[]) => getPricingConfigMock(...args),
}));

vi.mock("@/lib/pricing/config", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pricing/config")>(
    "@/lib/pricing/config",
  );

  return {
    ...actual,
    getListingOperationPriceCents: (...args: unknown[]) =>
      getListingOperationPriceCentsMock(...args),
  };
});

import { POST } from "./route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const AD_ID = "33333333-3333-4333-8333-333333333333";

function createRequest(body: unknown) {
  return new NextRequest("http://localhost/api/account/ads/apply-action", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/account/ads/apply-action", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rejectInvalidCsrfRequestMock.mockReturnValue(null);
    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    adMaybeSingleMock.mockResolvedValue({
      data: { id: AD_ID, seller_id: USER_ID },
      error: null,
    });
    adminRpcMock.mockResolvedValue({
      data: { success: true, status: "active" },
      error: null,
    });
    getPricingConfigMock.mockResolvedValue({});
    getListingOperationPriceCentsMock.mockReturnValue(999);

    createClientMock.mockResolvedValue({
      auth: {
        getUser: (...args: unknown[]) => getUserMock(...args),
      },
    });
    createAdminClientMock.mockReturnValue({
      rpc: (...args: unknown[]) => adminRpcMock(...args),
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => adMaybeSingleMock(),
          }),
        }),
      }),
    });
  });

  it("requires authentication before loading listing entitlement", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      createRequest({ adId: AD_ID, operation: "prolong_top" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(adminRpcMock).not.toHaveBeenCalled();
  });

  it("rejects feature actions for another seller's listing", async () => {
    adMaybeSingleMock.mockResolvedValue({
      data: { id: AD_ID, seller_id: OTHER_USER_ID },
      error: null,
    });

    const response = await POST(
      createRequest({ adId: AD_ID, operation: "prolong_top" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Nemáte prístup k tomuto inzerátu." });
    expect(adminRpcMock).not.toHaveBeenCalled();
  });

  it("returns checkout metadata for paid listing actions", async () => {
    const response = await POST(
      createRequest({ adId: AD_ID, operation: "prolong_top" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      adId: AD_ID,
      checkoutRequired: true,
      operation: "prolong_top",
    });
    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("applies a free listing action through the private listing RPC", async () => {
    getListingOperationPriceCentsMock.mockReturnValue(0);

    const response = await POST(
      createRequest({ adId: AD_ID, operation: "prolong_basic" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      adId: AD_ID,
      status: "active",
    });
    expect(adminRpcMock).toHaveBeenCalledWith(
      "apply_private_listing_action",
      {
        p_actor_user_id: USER_ID,
        p_ad_id: AD_ID,
        p_operation: "prolong_basic",
        p_transaction_id: null,
      },
    );
  });

  it("surfaces free listing action failures without reporting success", async () => {
    getListingOperationPriceCentsMock.mockReturnValue(0);
    adminRpcMock.mockResolvedValue({
      data: { success: false, error: "action failed" },
      error: null,
    });

    const response = await POST(
      createRequest({ adId: AD_ID, operation: "prolong_basic" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "action failed" });
  });
});
