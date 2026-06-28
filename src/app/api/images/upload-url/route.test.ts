import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const rejectInvalidCsrfRequestMock = vi.fn();
const createClientMock = vi.fn();
const getUserMock = vi.fn();
const checkRateLimitMock = vi.fn();
const rejectWhenRuntimeEnvMissingMock = vi.fn();
const getTrimmedEnvMock = vi.fn();

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfRequest: (...args: unknown[]) =>
    rejectInvalidCsrfRequestMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
}));

vi.mock("@/lib/api/runtime-env", () => ({
  rejectWhenRuntimeEnvMissing: (...args: unknown[]) =>
    rejectWhenRuntimeEnvMissingMock(...args),
}));

vi.mock("@/lib/env", () => ({
  getTrimmedEnv: (...args: unknown[]) => getTrimmedEnvMock(...args),
}));

import { POST } from "./route";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function createUploadUrlRequest() {
  return new NextRequest("https://autobazar123.sk/api/images/upload-url", {
    method: "POST",
    headers: {
      origin: "https://autobazar123.sk",
      "x-csrf-token": "csrf-token",
      cookie: "ab_csrf=csrf-token",
    },
  });
}

function installSupabaseClientMock() {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => getUserMock(...args),
    },
  });
}

describe("POST /api/images/upload-url", () => {
  const fetchMock = vi.fn();
  let consoleErrorMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => undefined);

    rejectInvalidCsrfRequestMock.mockReturnValue(null);
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    checkRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    rejectWhenRuntimeEnvMissingMock.mockReturnValue(null);
    getTrimmedEnvMock.mockImplementation((key: string) => {
      if (key === "CLOUDFLARE_ACCOUNT_ID") return "cloudflare-account";
      if (key === "CLOUDFLARE_API_TOKEN") return "cloudflare-token";
      return "";
    });
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: {
            uploadURL: "https://upload.imagedelivery.net/direct-upload",
            id: "image-id",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    installSupabaseClientMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    consoleErrorMock.mockRestore();
  });

  it("rejects invalid CSRF before auth or provider work", async () => {
    rejectInvalidCsrfRequestMock.mockReturnValue(
      NextResponse.json({ error: "Invalid request origin." }, { status: 403 }),
    );

    const response = await POST(createUploadUrlRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Invalid request origin." });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires authentication before creating a Cloudflare upload URL", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await POST(createUploadUrlRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({
      error: "Unauthorized - Please login to upload images",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when Cloudflare runtime configuration is missing", async () => {
    rejectWhenRuntimeEnvMissingMock.mockReturnValue(
      NextResponse.json(
        { error: "Image upload is not configured" },
        { status: 503 },
      ),
    );

    const response = await POST(createUploadUrlRequest());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({ error: "Image upload is not configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rate limits authenticated upload URL requests before provider work", async () => {
    checkRateLimitMock.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });

    const response = await POST(createUploadUrlRequest());
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(payload).toEqual({
      error: "Too many upload attempts. Please try again later.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the Cloudflare direct upload URL without exposing the API token", async () => {
    const response = await POST(createUploadUrlRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      uploadUrl: "https://upload.imagedelivery.net/direct-upload",
      id: "image-id",
    });
    expect(checkRateLimitMock).toHaveBeenCalledWith(`image_upload:${USER_ID}`);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/accounts/cloudflare-account/images/v2/direct_upload",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer cloudflare-token",
        },
        body: expect.any(FormData),
      }),
    );
    expect(JSON.stringify(payload)).not.toContain("cloudflare-token");
  });

  it("returns a generic failure when Cloudflare rejects the direct upload request", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          errors: [{ code: 10_001, message: "token scope denied" }],
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(createUploadUrlRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Failed to create upload URL" });
    expect(JSON.stringify(payload)).not.toContain("token scope denied");
  });

  it("fails closed when Cloudflare returns a malformed success payload", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: {
            id: "image-id",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(createUploadUrlRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Failed to create upload URL" });
    expect(JSON.stringify(payload)).not.toContain("image-id");
    expect(consoleErrorMock).toHaveBeenCalledWith(
      "Cloudflare API error: malformed direct upload response",
    );
  });

  it("returns a generic failure when Cloudflare upload URL creation throws", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED cloudflare-token"));

    const response = await POST(createUploadUrlRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Failed to create upload URL" });
    expect(JSON.stringify(payload)).not.toContain("cloudflare-token");
    expect(consoleErrorMock).toHaveBeenCalledWith(
      "Cloudflare upload error: direct upload request failed",
    );
    expect(JSON.stringify(consoleErrorMock.mock.calls)).not.toContain("cloudflare-token");
  });
});
