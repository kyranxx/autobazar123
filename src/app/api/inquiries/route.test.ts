import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rejectInvalidCsrfRequestMock = vi.fn();
const createClientMock = vi.fn();
const getUserMock = vi.fn();
const inquiryMaybeSingleMock = vi.fn();
const updateMaybeSingleMock = vi.fn();

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfRequest: (...args: unknown[]) =>
    rejectInvalidCsrfRequestMock(...args),
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

import { PATCH } from "./route";

function createPatchRequest(inquiryId: string, isQualified: boolean) {
  return new NextRequest("http://localhost/api/inquiries", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ inquiryId, isQualified }),
  });
}

describe("PATCH /api/inquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rejectInvalidCsrfRequestMock.mockReturnValue(null);
    getUserMock.mockResolvedValue({ data: { user: { id: "seller-1" } } });
    inquiryMaybeSingleMock.mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        ad_id: "22222222-2222-4222-8222-222222222222",
        is_qualified: false,
        ads: { seller_id: "seller-1" },
      },
      error: null,
    });
    updateMaybeSingleMock.mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        ad_id: "22222222-2222-4222-8222-222222222222",
        is_qualified: true,
      },
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: (...args: unknown[]) => getUserMock(...args),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => inquiryMaybeSingleMock(),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: () => updateMaybeSingleMock(),
            }),
          }),
        }),
      }),
    });
  });

  it("marks an inquiry as qualified for the ad seller", async () => {
    const response = await PATCH(
      createPatchRequest("11111111-1111-4111-8111-111111111111", true),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      inquiryId: "11111111-1111-4111-8111-111111111111",
      adId: "22222222-2222-4222-8222-222222222222",
      isQualified: true,
      wasQualifiedBefore: false,
    });
  });

  it("rejects qualification update when current user does not own the ad", async () => {
    inquiryMaybeSingleMock.mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        ad_id: "22222222-2222-4222-8222-222222222222",
        is_qualified: false,
        ads: { seller_id: "seller-2" },
      },
      error: null,
    });

    const response = await PATCH(
      createPatchRequest("11111111-1111-4111-8111-111111111111", true),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Forbidden" });
  });
});
