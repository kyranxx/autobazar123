import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkStrictRateLimitMock = vi.fn();
const createAdminClientMock = vi.fn();
const enqueuePasswordRecoveryEmailJobMock = vi.fn();
const resolveAuthRequestOriginMock = vi.fn();

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock("@/lib/email/jobs", () => ({
  enqueuePasswordRecoveryEmailJob: (...args: unknown[]) =>
    enqueuePasswordRecoveryEmailJobMock(...args),
  scheduleQueuedEmailDrain: vi.fn(),
}));

vi.mock("@/lib/auth/request-origin", () => ({
  resolveAuthRequestOrigin: (...args: unknown[]) =>
    resolveAuthRequestOriginMock(...args),
}));

import { POST } from "./route";

function createRequest(
  body: unknown,
  options?: { origin?: string; includeCsrfToken?: boolean },
): NextRequest {
  const includeCsrfToken = options?.includeCsrfToken ?? true;
  return new NextRequest("https://autobazar123.sk/api/auth/password-reset", {
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      origin: options?.origin ?? "https://autobazar123.sk",
      ...(includeCsrfToken ? { "x-csrf-token": "csrf-token" } : {}),
      "cf-connecting-ip": "198.51.100.70",
      "user-agent": "vitest",
      "accept-language": "en-US",
      ...(includeCsrfToken ? { cookie: "ab_csrf=csrf-token" } : {}),
    }),
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/password-reset security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    resolveAuthRequestOriginMock.mockReturnValue("https://autobazar123.sk");
    enqueuePasswordRecoveryEmailJobMock.mockResolvedValue({ ok: true });
  });

  it("returns 429 for abuse throttling before provider calls", async () => {
    checkStrictRateLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await POST(createRequest({ email: "user@example.com" }));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error).toBe("Too many attempts. Please try again later.");
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests before provider calls", async () => {
    const response = await POST(
      createRequest(
        { email: "user@example.com" },
        { origin: "https://attacker.example" },
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Invalid request origin.");
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects requests without a CSRF token before provider calls", async () => {
    const response = await POST(
      createRequest({ email: "user@example.com" }, { includeCsrfToken: false }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Invalid request origin.");
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("stays enumeration-safe for unknown accounts", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "User not found" },
    });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });

    const response = await POST(createRequest({ email: "missing@example.com" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(enqueuePasswordRecoveryEmailJobMock).not.toHaveBeenCalled();
  });

  it("does not leak provider internals in non-enumeration errors", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "dial tcp 10.0.0.1:5432: i/o timeout" },
    });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });

    const response = await POST(createRequest({ email: "user@example.com" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Unable to process password reset right now.");
    expect(payload.error).not.toContain("10.0.0.1");
  });
});
