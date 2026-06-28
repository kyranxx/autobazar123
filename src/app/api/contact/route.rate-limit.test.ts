import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";

const rejectInvalidCsrfRequestMock = vi.fn();
const checkStrictRateLimitMock = vi.fn();
const createAdminClientMock = vi.fn();
const insertMock = vi.fn();

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfRequest: (...args: unknown[]) =>
    rejectInvalidCsrfRequestMock(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}));

import { getContactSubmitRateLimitIdentifier } from "@/lib/api/rate-limit-identifiers";
import { POST } from "./route";

function createContactRequest(body: unknown) {
  return new NextRequest("https://autobazar123.sk/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createValidContactBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "  Test User  ",
    email: "  TEST@example.com  ",
    subject: "",
    message: "  Dobry den, prosím o viac informacii.  ",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  rejectInvalidCsrfRequestMock.mockReturnValue(null);
  checkStrictRateLimitMock.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60_000,
  });
  insertMock.mockResolvedValue({ error: null });
  createAdminClientMock.mockReturnValue({
    from: (table: string) => {
      expect(table).toBe("contact_messages");
      return {
        insert: (...args: unknown[]) => insertMock(...args),
      };
    },
  });
});

describe("getContactSubmitRateLimitIdentifier", () => {
  it("uses stable request fingerprinting for contact submit throttling", () => {
    const request = new NextRequest("https://autobazar123.sk/api/contact", {
      headers: new Headers({
        "x-forwarded-for": "203.0.113.10",
        "user-agent": "Mozilla/5.0",
        "accept-language": "sk-SK",
      }),
      method: "POST",
    });

    expect(getContactSubmitRateLimitIdentifier(request)).toBe(
      createRateLimitIdentifier("contact_submit", request.headers),
    );
  });
});

describe("POST /api/contact", () => {
  it("rejects invalid contact payload before database work", async () => {
    const response = await POST(
      createContactRequest(createValidContactBody({ message: "short" })),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Neplatné údaje kontaktného formulára.",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rate-limits contact submissions before validation and insert", async () => {
    checkStrictRateLimitMock.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30_000,
    });

    const response = await POST(createContactRequest(createValidContactBody()));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(payload).toEqual({
      ok: false,
      error: "Príliš veľa pokusov. Skúste znova neskôr.",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("fails closed when the admin client is not configured", async () => {
    createAdminClientMock.mockReturnValue(null);

    const response = await POST(createContactRequest(createValidContactBody()));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Server nie je nakonfigurovaný.",
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("stores a sanitized contact message", async () => {
    const response = await POST(createContactRequest(createValidContactBody()));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      subject: "general",
      message: "Dobry den, prosím o viac informacii.",
      status: "new",
    });
  });

  it("returns a server error when contact insert fails", async () => {
    insertMock.mockResolvedValue({ error: { message: "insert failed" } });

    const response = await POST(createContactRequest(createValidContactBody()));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Nepodarilo sa odoslať správu. Skúste znova neskôr.",
    });
  });
});
