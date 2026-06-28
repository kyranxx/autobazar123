import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rejectInvalidCsrfRequestMock = vi.fn();
const checkStrictRateLimitMock = vi.fn();
const createClientMock = vi.fn();
const getUserMock = vi.fn();
const dealerMaybeSingleMock = vi.fn();
const requestsLimitMock = vi.fn();
const existingPendingMaybeSingleMock = vi.fn();
const insertRequestSingleMock = vi.fn();
const dealerEqMock = vi.fn();
const requestEqMock = vi.fn();

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

import { GET, POST } from "./route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const DEALER_ID = "22222222-2222-4222-8222-222222222222";

function createPostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/account/dealer-verification", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function installSupabaseClientMock() {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => getUserMock(...args),
    },
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
          eq: (column: string, value: unknown) => {
            requestEqMock(column, value);

            return {
              eq: (secondColumn: string, secondValue: unknown) => {
                requestEqMock(secondColumn, secondValue);
                return {
                  maybeSingle: () => existingPendingMaybeSingleMock(),
                };
              },
              order: (orderColumn: string, options: unknown) => ({
                limit: (limit: number) =>
                  requestsLimitMock({ orderColumn, options, limit }),
              }),
            };
          },
        }),
        insert: (payload: unknown) => ({
          select: (columns: string) => ({
            single: () => insertRequestSingleMock(payload, columns),
          }),
        }),
      };
    },
  });
}

describe("/api/account/dealer-verification", () => {
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
    dealerMaybeSingleMock.mockResolvedValue({
      data: { id: DEALER_ID, is_verified: false },
      error: null,
    });
    requestsLimitMock.mockResolvedValue({
      data: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          request_note: "Documents attached.",
          status: "pending",
          admin_note: null,
          created_at: "2026-05-15T10:00:00.000Z",
          reviewed_at: null,
        },
      ],
      error: null,
    });
    existingPendingMaybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    });
    insertRequestSingleMock.mockResolvedValue({
      data: {
        id: "44444444-4444-4444-8444-444444444444",
        request_note: "Please verify us.",
        status: "pending",
        admin_note: null,
        created_at: "2026-05-15T10:05:00.000Z",
        reviewed_at: null,
      },
      error: null,
    });

    installSupabaseClientMock();
  });

  it("requires authentication before loading dealer verification state", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(dealerMaybeSingleMock).not.toHaveBeenCalled();
    expect(requestsLimitMock).not.toHaveBeenCalled();
  });

  it("loads only the authenticated user's dealer verification requests", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      dealerId: DEALER_ID,
      isVerified: false,
      requests: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          request_note: "Documents attached.",
          status: "pending",
          admin_note: null,
          created_at: "2026-05-15T10:00:00.000Z",
          reviewed_at: null,
        },
      ],
    });
    expect(dealerEqMock).toHaveBeenCalledWith("owner_id", USER_ID);
    expect(requestEqMock).toHaveBeenCalledWith("dealer_id", DEALER_ID);
    expect(requestsLimitMock).toHaveBeenCalledWith({
      orderColumn: "created_at",
      options: { ascending: false },
      limit: 5,
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects verification creation when the user has no dealer profile", async () => {
    dealerMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await POST(
      createPostRequest({ requestNote: "Please verify us." }),
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ error: "Dealer profile not found." });
    expect(insertRequestSingleMock).not.toHaveBeenCalled();
  });

  it("rejects verification creation for an already verified dealer", async () => {
    dealerMaybeSingleMock.mockResolvedValue({
      data: { id: DEALER_ID, is_verified: true },
      error: null,
    });

    const response = await POST(
      createPostRequest({ requestNote: "Please verify us." }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Dealer is already verified." });
    expect(existingPendingMaybeSingleMock).not.toHaveBeenCalled();
    expect(insertRequestSingleMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate pending verification requests", async () => {
    existingPendingMaybeSingleMock.mockResolvedValue({
      data: { id: "33333333-3333-4333-8333-333333333333" },
      error: null,
    });

    const response = await POST(
      createPostRequest({ requestNote: "Please verify us." }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "A verification request is already pending.",
    });
    expect(requestEqMock).toHaveBeenCalledWith("dealer_id", DEALER_ID);
    expect(requestEqMock).toHaveBeenCalledWith("status", "pending");
    expect(insertRequestSingleMock).not.toHaveBeenCalled();
  });

  it("creates a pending verification request for the authenticated dealer owner", async () => {
    const response = await POST(
      createPostRequest({ requestNote: "  Please verify us.  " }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      request: {
        id: "44444444-4444-4444-8444-444444444444",
        request_note: "Please verify us.",
        status: "pending",
        admin_note: null,
        created_at: "2026-05-15T10:05:00.000Z",
        reviewed_at: null,
      },
    });
    expect(dealerEqMock).toHaveBeenCalledWith("owner_id", USER_ID);
    expect(insertRequestSingleMock).toHaveBeenCalledWith(
      {
        dealer_id: DEALER_ID,
        requester_user_id: USER_ID,
        request_note: "Please verify us.",
        status: "pending",
      },
      "id, request_note, status, admin_note, created_at, reviewed_at",
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
