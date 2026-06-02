import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const rejectInvalidCsrfTokenRequestMock = vi.fn();
const checkStrictRateLimitMock = vi.fn();
const createClientMock = vi.fn();
const getUserMock = vi.fn();
const updateUserMock = vi.fn();
const getSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfTokenRequest: (...args: unknown[]) =>
    rejectInvalidCsrfTokenRequestMock(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

import { POST } from "./route";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://autobazar123.sk/api/account/password", {
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      origin: "https://autobazar123.sk",
      "x-csrf-token": "csrf-token",
      cookie: "ab_csrf=csrf-token",
      "cf-connecting-ip": "198.51.100.81",
      "user-agent": "vitest",
    }),
    body: JSON.stringify(body),
  });
}

function installSupabaseClientMock() {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => getUserMock(...args),
      updateUser: (...args: unknown[]) => updateUserMock(...args),
      getSession: (...args: unknown[]) => getSessionMock(...args),
      admin: {
        signOut: (...args: unknown[]) => signOutMock(...args),
      },
    },
  });
}

describe("POST /api/account/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rejectInvalidCsrfTokenRequestMock.mockReturnValue(null);
    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    updateUserMock.mockResolvedValue({ error: null });
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: "current-session-token" } },
    });
    signOutMock.mockResolvedValue({ error: null });

    installSupabaseClientMock();
  });

  it("rejects invalid CSRF before rate limiting or Supabase work", async () => {
    rejectInvalidCsrfTokenRequestMock.mockReturnValue(
      NextResponse.json({ error: "Invalid request origin." }, { status: 403 }),
    );

    const response = await POST(createRequest({ password: "secret1234" }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Invalid request origin." });
    expect(checkStrictRateLimitMock).not.toHaveBeenCalled();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("rate limits before loading the authenticated user", async () => {
    checkStrictRateLimitMock.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await POST(createRequest({ password: "secret1234" }));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload).toEqual({
      error: "Too many attempts. Please try again later.",
    });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("requires an authenticated user before parsing the password update", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await POST(createRequest({ password: "secret1234" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("rejects invalid password payloads before updating auth state", async () => {
    const response = await POST(createRequest({ password: "short" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Password must be at least 8 characters",
    });
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("does not report success when Supabase rejects the password update", async () => {
    updateUserMock.mockResolvedValue({ error: { message: "provider timeout" } });

    const response = await POST(createRequest({ password: "secret1234" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Unable to update password right now." });
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("updates the current user's password and revokes other sessions", async () => {
    const response = await POST(createRequest({ password: "secret1234" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(updateUserMock).toHaveBeenCalledWith({
      password: "secret1234",
    });
    expect(signOutMock).toHaveBeenCalledWith("current-session-token", "others");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("succeeds without a revocation call when no current session token exists", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const response = await POST(createRequest({ password: "secret1234" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(updateUserMock).toHaveBeenCalledWith({
      password: "secret1234",
    });
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
