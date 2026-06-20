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
  return new NextRequest("https://autobazar123.sk/api/auth/register", {
    method: "POST",
    headers: new Headers({
      "content-type": "application/json",
      origin: options?.origin ?? "https://autobazar123.sk",
      ...(includeCsrfToken ? { "x-csrf-token": "csrf-token" } : {}),
      "cf-connecting-ip": "198.51.100.71",
      "user-agent": "vitest",
      "accept-language": "sk-SK",
      ...(includeCsrfToken ? { cookie: "ab_csrf=csrf-token" } : {}),
    }),
    body: JSON.stringify(body),
  });
}

function validRegistrationPayload() {
  return {
    email: " New.User@Example.com ",
    password: "correct-horse-battery-123",
    fullName: "  Jana Testova  ",
    dealerInterest: true,
  };
}

describe("POST /api/auth/register", () => {
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

    const response = await POST(createRequest(validRegistrationPayload()));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error).toBe("Too many attempts. Please try again later.");
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests before provider calls", async () => {
    const response = await POST(
      createRequest(validRegistrationPayload(), {
        origin: "https://attacker.example",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Invalid request origin.");
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects invalid registration payloads before provider calls", async () => {
    const response = await POST(
      createRequest({
        email: "not-an-email",
        password: "short",
        fullName: "",
        role: "admin",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid registration payload");
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("stays enumeration-safe for already registered emails", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "User already registered" },
    });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });

    const response = await POST(createRequest(validRegistrationPayload()));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, alreadyRegistered: true });
    expect(enqueueRegistrationConfirmationEmailJobMock).not.toHaveBeenCalled();
    expect(scheduleQueuedEmailDrainMock).not.toHaveBeenCalled();
  });

  it("generates a signup link and queues a confirmation email", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: {
        properties: {
          action_link: "https://auth.autobazar123.test/confirm",
          hashed_token: "hashed-confirm-token",
        },
      },
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });

    const response = await POST(createRequest(validRegistrationPayload()));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, alreadyRegistered: false });
    expect(generateLinkMock).toHaveBeenCalledWith({
      type: "signup",
      email: "new.user@example.com",
      password: "correct-horse-battery-123",
      options: {
        redirectTo: "https://autobazar123.sk/auth/callback",
        data: {
          full_name: "Jana Testova",
          dealer_interest: true,
        },
      },
    });
    expect(enqueueRegistrationConfirmationEmailJobMock).toHaveBeenCalledWith({
      email: "new.user@example.com",
      fullName: "Jana Testova",
      confirmationUrl:
        "https://autobazar123.sk/auth/callback?token_hash=hashed-confirm-token&type=email",
    });
    expect(scheduleQueuedEmailDrainMock).toHaveBeenCalledWith({
      batchSize: 5,
      jobTypes: ["auth_register_confirmation"],
    });
  });

  it("fails closed when the provider does not return a confirmation token", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: { properties: {} },
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock } },
    });

    const response = await POST(createRequest(validRegistrationPayload()));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Registration token was not generated");
    expect(enqueueRegistrationConfirmationEmailJobMock).not.toHaveBeenCalled();
    expect(scheduleQueuedEmailDrainMock).not.toHaveBeenCalled();
  });

  it("surfaces queue failure without scheduling delivery drain", async () => {
    const generateLinkMock = vi.fn().mockResolvedValue({
      data: {
        properties: {
          action_link: "https://auth.autobazar123.test/confirm",
          hashed_token: "hashed-confirm-token",
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

    const response = await POST(createRequest(validRegistrationPayload()));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toBe("queue unavailable");
    expect(scheduleQueuedEmailDrainMock).not.toHaveBeenCalled();
  });
});
