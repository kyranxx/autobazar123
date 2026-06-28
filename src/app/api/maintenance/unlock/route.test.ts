import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkStrictRateLimitMock = vi.fn();
const createRateLimitIdentifierMock = vi.fn();
const rejectInvalidCsrfRequestMock = vi.fn();
const createMaintenanceBypassTokenMock = vi.fn();
const resolveMaintenanceBypassSecretMock = vi.fn();

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

    vi.stubEnv("MAINTENANCE_UNLOCK_PASSWORD", "launch-unlock-secret");
  });

  it("accepts the maintenance password and sets bypass cookie", async () => {
    const response = await POST(createRequest("launch-unlock-secret"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(response.headers.get("set-cookie")).toContain(
      "maintenance_bypass=signed-token",
    );
  });

  it("trims the configured env password before validation", async () => {
    vi.stubEnv("MAINTENANCE_UNLOCK_PASSWORD", "  launch-unlock-secret  ");

    const response = await POST(createRequest("launch-unlock-secret"));
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

  it("returns 503 when the maintenance password is not configured", async () => {
    vi.stubEnv("MAINTENANCE_UNLOCK_PASSWORD", "");

    const response = await POST(createRequest("launch-unlock-secret"));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      ok: false,
      error: "Maintenance bypass is not configured.",
    });
  });

  it("does not accept the legacy MAINTENANCE_PASSWORD alias", async () => {
    vi.stubEnv("MAINTENANCE_UNLOCK_PASSWORD", "");
    vi.stubEnv("MAINTENANCE_PASSWORD", "legacy-unlock-secret");

    const response = await POST(createRequest("legacy-unlock-secret"));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      ok: false,
      error: "Maintenance bypass is not configured.",
    });
  });

  it("fails closed when rate limiting is unavailable", async () => {
    checkStrictRateLimitMock.mockRejectedValueOnce(new Error("redis down"));

    const response = await POST(createRequest("launch-unlock-secret"));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      ok: false,
      error: "Rate limiting is temporarily unavailable.",
    });
  });
});
