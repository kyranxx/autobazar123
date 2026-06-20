import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkStrictRateLimitMock = vi.fn();
const createAdminClientMock = vi.fn();
const enqueueRegistrationConfirmationEmailJobMock = vi.fn();
const scheduleQueuedEmailDrainMock = vi.fn();
const resolveAuthRequestOriginMock = vi.fn();

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock("@/lib/email/jobs", () => ({
  enqueueRegistrationConfirmationEmailJob: (...args: unknown[]) =>
    enqueueRegistrationConfirmationEmailJobMock(...args),
  scheduleQueuedEmailDrain: (...args: unknown[]) =>
    scheduleQueuedEmailDrainMock(...args),
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
  return new NextRequest("https://autobazar123.sk/api/auth/register/resend", {
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      origin: options?.origin ?? "https://autobazar123.sk",
      ...(includeCsrfToken ? { "x-csrf-token": "csrf-token" } : {}),
      "cf-connecting-ip": "198.51.100.72",
      "user-agent": "vitest",
      "accept-language": "sk-SK",
      ...(includeCsrfToken ? { cookie: "ab_csrf=csrf-token" } : {}),
    }),
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    resolveAuthRequestOriginMock.mockReturnValue("https://autobazar123.sk");
    enqueueRegistrationConfirmationEmailJobMock.mockResolvedValue({ ok: true });
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

  it("rejects invalid payloads before provider calls", async () => {
    const response = await POST(
      createRequest({
        email: "user@example.com",
        userId: "attacker-controlled",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid email payload");
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("generates a magic link and queues a confirmation email", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: {
        user: {
          user_metadata: {
            full_name: "Jana Testova",
          },
        },
        properties: {
          action_link: "https://auth.autobazar123.test/confirm",
          hashed_token: "hashed-resend-token",
        },
      },
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });

    const response = await POST(createRequest({ email: " User@Example.com " }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(generateLinkMock).toHaveBeenCalledWith({
      type: "magiclink",
      email: "user@example.com",
      options: {
        redirectTo: "https://autobazar123.sk/auth/callback",
      },
    });
    expect(enqueueRegistrationConfirmationEmailJobMock).toHaveBeenCalledWith({
      email: "user@example.com",
      fullName: "Jana Testova",
      confirmationUrl:
        "https://autobazar123.sk/auth/callback?token_hash=hashed-resend-token&type=email",
    });
    expect(scheduleQueuedEmailDrainMock).toHaveBeenCalledWith({
      batchSize: 5,
      jobTypes: ["auth_register_confirmation"],
    });
  });

  it("fails closed when the provider does not return a confirmation token", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: {
        user: { user_metadata: {} },
        properties: {},
      },
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });

    const response = await POST(createRequest({ email: "user@example.com" }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Confirmation token was not generated");
    expect(enqueueRegistrationConfirmationEmailJobMock).not.toHaveBeenCalled();
    expect(scheduleQueuedEmailDrainMock).not.toHaveBeenCalled();
  });

  it("surfaces queue failure without scheduling delivery drain", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: {
        user: { user_metadata: {} },
        properties: {
          action_link: "https://auth.autobazar123.test/confirm",
          hashed_token: "hashed-resend-token",
        },
      },
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });
    enqueueRegistrationConfirmationEmailJobMock.mockResolvedValueOnce({
      ok: false,
      error: "queue unavailable",
    });

    const response = await POST(createRequest({ email: "user@example.com" }));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toBe("queue unavailable");
    expect(scheduleQueuedEmailDrainMock).not.toHaveBeenCalled();
  });
});
