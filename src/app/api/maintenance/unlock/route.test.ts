import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkStrictRateLimitMock = vi.fn();
const createRateLimitIdentifierMock = vi.fn();
const rejectInvalidCsrfRequestMock = vi.fn();
const createMaintenanceBypassTokenMock = vi.fn();
const resolveMaintenanceBypassSecretMock = vi.fn();
const maybeSingleMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@/lib/request-fingerprint", () => ({
  createRateLimitIdentifier: (...args: unknown[]) =>
    createRateLimitIdentifierMock(...args),
}));

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfRequest: (...args: unknown[]) =>
    rejectInvalidCsrfRequestMock(...args),
}));

vi.mock("@/lib/security/maintenance-bypass", () => ({
  createMaintenanceBypassToken: (...args: unknown[]) =>
    createMaintenanceBypassTokenMock(...args),
  resolveMaintenanceBypassSecret: (...args: unknown[]) =>
    resolveMaintenanceBypassSecretMock(...args),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

import { POST } from "./route";

function createRequest(password: string): NextRequest {
  return new NextRequest("http://localhost/api/maintenance/unlock", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/maintenance/unlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 10,
      reset: Date.now() + 60_000,
    });
    createRateLimitIdentifierMock.mockReturnValue("maintenance_unlock:test");
    rejectInvalidCsrfRequestMock.mockReturnValue(null);
    createMaintenanceBypassTokenMock.mockResolvedValue("signed-token");
    resolveMaintenanceBypassSecretMock.mockReturnValue("bypass-secret");

    maybeSingleMock.mockResolvedValue({
      data: { value: "pepsicola" },
      error: null,
    });

    createClientMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => maybeSingleMock(),
          }),
        }),
      }),
    });

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  });

  it("accepts the maintenance password and sets bypass cookie", async () => {
    const response = await POST(createRequest("pepsicola"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(response.headers.get("set-cookie")).toContain(
      "maintenance_bypass=signed-token",
    );
  });

  it("trims the configured password before validation", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { value: "  pepsicola  " },
      error: null,
    });

    const response = await POST(createRequest("pepsicola"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
  });

  it("rejects invalid passwords", async () => {
    const response = await POST(createRequest("not-it"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({
      ok: false,
      error: "Invalid password.",
    });
  });
});
