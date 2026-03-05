import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkStrictRateLimitMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

import { POST } from "./route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://autobazar123.sk/api/account/phone", {
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      origin: "https://autobazar123.sk",
      "x-forwarded-for": "203.0.113.42",
      "user-agent": "vitest",
      "accept-language": "sk-SK",
    }),
    body: JSON.stringify(body),
  });
}

describe("POST /api/account/phone security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
  });

  it("returns 429 for abuse throttling before profile mutation", async () => {
    checkStrictRateLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await POST(createRequest({ phone: "+421900000000" }));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error).toBe("Too many attempts. Please try again later.");
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("blocks cross-user style payload tampering via strict schema", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn(() => ({ update: updateMock }));

    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }) },
      from: fromMock,
    });

    const response = await POST(
      createRequest({
        phone: "+421900000000",
        userId: "attacker-user-id",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid phone payload");
    expect(fromMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(eqMock).not.toHaveBeenCalled();
  });

  it("always scopes mutation to authenticated user id", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn(() => ({ eq: eqMock }));
    const fromMock = vi.fn(() => ({ update: updateMock }));

    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }) },
      from: fromMock,
    });

    const response = await POST(createRequest({ phone: "+421900000000" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith({ phone: "+421900000000" });
    expect(eqMock).toHaveBeenCalledWith("id", "user-123");
  });
});
