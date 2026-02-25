import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit } from "@/lib/ratelimit";
import { proxy } from "./proxy";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(async () => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60_000,
  })),
}));

type MockSupabaseClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
};

const mockedCreateServerClient = vi.mocked(createServerClient);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);

function createUnauthenticatedSupabaseClient(): MockSupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  };
}

describe("proxy authenticated routes", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("NEXT_PUBLIC_DISABLE_MAINTENANCE", "true");

    mockedCreateServerClient.mockReturnValue(
      createUnauthenticatedSupabaseClient() as never,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it.each(["/ulozene", "/spravy"])(
    "redirects unauthenticated users from %s to login",
    async (pathname) => {
      const request = new NextRequest(`https://autobazar123.sk${pathname}`);
      const response = await proxy(request);
      const location = response.headers.get("location");

      expect(response.status).toBe(307);
      expect(location).toContain("/auth/login");
      expect(location).toContain(`redirect=${encodeURIComponent(pathname)}`);
    },
  );

  it("checks protected-route rate limit without fail-open override", async () => {
    const request = new NextRequest("https://autobazar123.sk/ulozene");
    await proxy(request);

    expect(mockedCheckRateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^proxy:/),
    );
  });

  it("does not include internal metadata headers on successful responses", async () => {
    const request = new NextRequest("https://autobazar123.sk/");
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
    expect(response.headers.get("X-Middleware-Applied")).toBeNull();
    expect(response.headers.get("X-Request-ID")).toBeTruthy();
  });
});
