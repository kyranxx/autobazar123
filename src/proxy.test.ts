import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit } from "@/lib/ratelimit";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
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
  from?: () => {
    select: () => {
      eq: () => {
        maybeSingle: () => Promise<{
          data: { value: string };
          error: null;
        }>;
      };
    };
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

function createAuthenticatedSupabaseClient(userId = "user-123"): MockSupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: userId } } }),
    },
  };
}

function createMaintenanceEnabledSupabaseClient(): MockSupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { value: "true" },
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe("proxy catalog search behavior", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("NEXT_PUBLIC_DISABLE_MAINTENANCE", "true");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("keeps brand, model, and location filters on the catalog route", async () => {
    const request = new NextRequest(
      "https://autobazar123.sk/vysledky?brand=Ford&model=Kuga&location=Bratislava",
    );
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps single-brand catalog URLs on /vysledky even with marketing params", async () => {
    const request = new NextRequest(
      "https://autobazar123.sk/vysledky?brand=Skoda&utm_source=x&utm_campaign=y",
    );
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps multi-select brand filters on the catalog route", async () => {
    const request = new NextRequest(
      "https://autobazar123.sk/vysledky?brand=Ford&brand=Volvo",
    );
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps mixed filters and free-text queries on the catalog route", async () => {
    const request = new NextRequest(
      "https://autobazar123.sk/vysledky?brand=Ford&model=Kuga&fuel=diesel&q=best-deal-today",
    );
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});

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

  it("uses a request fingerprint identifier for protected-route rate limiting", async () => {
    const request = new NextRequest("https://autobazar123.sk/ulozene", {
      headers: new Headers({
        "cf-connecting-ip": "198.51.100.44",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "accept-language": "sk-SK",
      }),
    });
    await proxy(request);

    expect(mockedCheckRateLimit).toHaveBeenCalledWith(
      createRateLimitIdentifier("proxy", request.headers),
    );
  });

  it("uses authenticated user id for protected-route rate limiting when available", async () => {
    mockedCreateServerClient.mockReturnValue(
      createAuthenticatedSupabaseClient("user-456") as never,
    );

    const request = new NextRequest("https://autobazar123.sk/ulozene");
    await proxy(request);

    expect(mockedCheckRateLimit).toHaveBeenCalledWith(
      "proxy:user:user-456",
    );
  });

  it("does not consume protected-route rate limit budget for prefetch requests", async () => {
    const request = new NextRequest("https://autobazar123.sk/ulozene", {
      headers: new Headers({
        "next-router-prefetch": "1",
        purpose: "prefetch",
      }),
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(mockedCheckRateLimit).not.toHaveBeenCalled();
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

describe("proxy faceted search crawl controls", () => {
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

  it("adds noindex robots header for faceted search query variants", async () => {
    const request = new NextRequest(
      "https://autobazar123.sk/vysledky?brand=Ford&brand=Volvo",
    );

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, follow");
  });

  it("does not add faceted noindex robots header for base search page", async () => {
    const request = new NextRequest("https://autobazar123.sk/vysledky");

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });
});

describe("proxy maintenance host bypass", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("NEXT_PUBLIC_DISABLE_MAINTENANCE", "false");
    mockedCreateServerClient.mockReturnValue(
      createMaintenanceEnabledSupabaseClient() as never,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("keeps the Vercel production alias open during maintenance mode", async () => {
    const request = new NextRequest("https://autobazar123.vercel.app/");

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still redirects the primary production domain to maintenance mode", async () => {
    const request = new NextRequest("https://www.autobazar123.sk/");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.autobazar123.sk/maintenance",
    );
  });
});
