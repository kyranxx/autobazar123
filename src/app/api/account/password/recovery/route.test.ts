import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const rejectInvalidCsrfTokenRequestMock = vi.fn();
const checkStrictRateLimitMock = vi.fn();
const createPublicClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const verifyOtpMock = vi.fn();
const updateUserByIdMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfTokenRequest: (...args: unknown[]) =>
    rejectInvalidCsrfTokenRequestMock(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createPublicClientMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

import { POST } from "./route";
import { parseRecoveryPasswordBody } from "./route-helpers";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://autobazar123.sk/api/account/password/recovery", {
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      origin: "https://autobazar123.sk",
      "x-csrf-token": "csrf-token",
      cookie: "ab_csrf=csrf-token",
      "cf-connecting-ip": "198.51.100.80",
      "user-agent": "vitest",
    }),
    body: JSON.stringify(body),
  });
}

function installPublicClientMock() {
  createPublicClientMock.mockReturnValue({
    auth: {
      verifyOtp: (...args: unknown[]) => verifyOtpMock(...args),
      admin: {
        signOut: (...args: unknown[]) => signOutMock(...args),
      },
    },
  });
}

function installAdminClientMock() {
  createAdminClientMock.mockReturnValue({
    auth: {
      admin: {
        updateUserById: (...args: unknown[]) => updateUserByIdMock(...args),
      },
    },
  });
}

describe("parseRecoveryPasswordBody", () => {
  it("returns the parsed body for a valid recovery request", () => {
    expect(
      parseRecoveryPasswordBody({
        password: "secret1234",
        tokenHash: " hash-123 ",
      }),
    ).toEqual({
      password: "secret1234",
      tokenHash: "hash-123",
    });
  });

  it("rejects missing or short password payloads", () => {
    expect(
      parseRecoveryPasswordBody({
        password: "1234567",
        tokenHash: "hash-123",
      }),
    ).toBeNull();

    expect(
      parseRecoveryPasswordBody({
        tokenHash: "hash-123",
      }),
    ).toBeNull();
  });

  it("rejects missing token hashes", () => {
    expect(
      parseRecoveryPasswordBody({
        password: "secret1234",
      }),
    ).toBeNull();
  });
});

describe("POST /api/account/password/recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    rejectInvalidCsrfTokenRequestMock.mockReturnValue(null);
    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    verifyOtpMock.mockResolvedValue({
      data: {
        user: { id: USER_ID },
        session: { access_token: "recovery-access-token" },
      },
      error: null,
    });
    updateUserByIdMock.mockResolvedValue({ error: null });
    signOutMock.mockResolvedValue({ error: null });

    installPublicClientMock();
    installAdminClientMock();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects invalid CSRF before rate limiting or provider calls", async () => {
    rejectInvalidCsrfTokenRequestMock.mockReturnValue(
      NextResponse.json({ error: "Invalid request origin." }, { status: 403 }),
    );

    const response = await POST(
      createRequest({ password: "secret1234", tokenHash: "hash-123" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Invalid request origin." });
    expect(checkStrictRateLimitMock).not.toHaveBeenCalled();
    expect(createPublicClientMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rate limits before parsing the recovery token", async () => {
    checkStrictRateLimitMock.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await POST(
      createRequest({ password: "secret1234", tokenHash: "hash-123" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload).toEqual({
      error: "Too many attempts. Please try again later.",
    });
    expect(createPublicClientMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects invalid payloads before provider calls", async () => {
    const response = await POST(
      createRequest({ password: "short", tokenHash: "hash-123" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Recovery token and password are required",
    });
    expect(createPublicClientMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("fails closed when public Supabase env is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const response = await POST(
      createRequest({ password: "secret1234", tokenHash: "hash-123" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Server not configured" });
    expect(createPublicClientMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects invalid or expired recovery tokens", async () => {
    verifyOtpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "expired" },
    });

    const response = await POST(
      createRequest({ password: "secret1234", tokenHash: "hash-123" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Recovery link is invalid or expired" });
    expect(createPublicClientMock).toHaveBeenCalledWith(
      "https://supabase.example",
      "anon-key",
      { auth: { persistSession: false } },
    );
    expect(verifyOtpMock).toHaveBeenCalledWith({
      token_hash: "hash-123",
      type: "recovery",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("fails closed when the admin client is unavailable", async () => {
    createAdminClientMock.mockReturnValue(null);

    const response = await POST(
      createRequest({ password: "secret1234", tokenHash: "hash-123" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "Server not configured for recovery password update",
    });
    expect(updateUserByIdMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("updates the verified user's password and revokes the recovery session", async () => {
    const response = await POST(
      createRequest({ password: "secret1234", tokenHash: " hash-123 " }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(verifyOtpMock).toHaveBeenCalledWith({
      token_hash: "hash-123",
      type: "recovery",
    });
    expect(updateUserByIdMock).toHaveBeenCalledWith(USER_ID, {
      password: "secret1234",
    });
    expect(signOutMock).toHaveBeenCalledWith("recovery-access-token", "global");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("does not report success when the password update fails", async () => {
    updateUserByIdMock.mockResolvedValue({
      error: { message: "provider timeout" },
    });

    const response = await POST(
      createRequest({ password: "secret1234", tokenHash: "hash-123" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Unable to update password right now." });
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("succeeds without a revocation call when no recovery session token is returned", async () => {
    verifyOtpMock.mockResolvedValue({
      data: {
        user: { id: USER_ID },
        session: null,
      },
      error: null,
    });

    const response = await POST(
      createRequest({ password: "secret1234", tokenHash: "hash-123" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(updateUserByIdMock).toHaveBeenCalledWith(USER_ID, {
      password: "secret1234",
    });
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
