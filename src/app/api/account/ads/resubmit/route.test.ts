import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rejectInvalidCsrfRequestMock = vi.fn();
const checkStrictRateLimitMock = vi.fn();
const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const getUserMock = vi.fn();
const adMaybeSingleMock = vi.fn();
const updateEqMock = vi.fn();
const rpcMock = vi.fn();

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

import { POST } from "./route";

function createRequest(adId: string) {
  return new NextRequest("http://localhost/api/account/ads/resubmit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ adId }),
  });
}

describe("POST /api/account/ads/resubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rejectInvalidCsrfRequestMock.mockReturnValue(null);
    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    getUserMock.mockResolvedValue({ data: { user: { id: "seller-1" } } });
    adMaybeSingleMock.mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        seller_id: "seller-1",
        status: "rejected",
        description: "Regular listing description",
      },
      error: null,
    });
    updateEqMock.mockResolvedValue({ error: null });
    rpcMock.mockResolvedValue({ data: false, error: null });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: (...args: unknown[]) => getUserMock(...args),
      },
      rpc: (...args: unknown[]) => rpcMock(...args),
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => adMaybeSingleMock(),
          }),
        }),
        update: () => ({
          eq: () => ({
            eq: () => updateEqMock(),
          }),
        }),
      }),
    });
    createAdminClientMock.mockReturnValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => updateEqMock(),
          }),
        }),
      }),
    });
  });

  it("resubmits a rejected ad back to pending", async () => {
    const response = await POST(
      createRequest("11111111-1111-4111-8111-111111111111"),
    );

    expect(response.status).toBe(200);
    expect(updateEqMock).toHaveBeenCalled();
  });

  it("rejects resubmitting a non-rejected ad", async () => {
    adMaybeSingleMock.mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        seller_id: "seller-1",
        status: "active",
        description: "Regular listing description",
      },
      error: null,
    });

    const response = await POST(
      createRequest("11111111-1111-4111-8111-111111111111"),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Znovu odoslať možno len zamietnutý inzerát.",
    });
  });
});
