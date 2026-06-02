import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const isCurrentUserSiteAdminMock = vi.fn();
const createAdminClientMock = vi.fn();
const healthSelectLimitMock = vi.fn();

vi.mock("@/lib/auth/site-admin", () => ({
  isCurrentUserSiteAdmin: (...args: unknown[]) =>
    isCurrentUserSiteAdminMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}));

import { GET } from "./route";

function createRequest(): NextRequest {
  return new NextRequest("https://autobazar123.sk/api/health", {
    method: "GET",
  });
}

function installAdminClientMock() {
  createAdminClientMock.mockReturnValue({
    from: (table: string) => {
      expect(table).toBe("ads");

      return {
        select: (columns: string) => {
          expect(columns).toBe("id");

          return {
            limit: (limit: number) => healthSelectLimitMock(limit),
          };
        },
      };
    },
  });
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_health");
    vi.stubEnv("RESEND_API_KEY", "re_health");

    isCurrentUserSiteAdminMock.mockResolvedValue(false);
    healthSelectLimitMock.mockResolvedValue({ error: null });
    installAdminClientMock();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a minimal healthy public response without leaking check details", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("healthy");
    expect(typeof payload.timestamp).toBe("string");
    expect(payload.checks).toBeUndefined();
    expect(payload.uptime).toBeUndefined();
    expect(healthSelectLimitMock).toHaveBeenCalledWith(1);
  });

  it("returns detailed healthy checks for admins", async () => {
    isCurrentUserSiteAdminMock.mockResolvedValue(true);

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      status: "healthy",
      checks: {
        database: { status: "ok" },
        api: { status: "ok" },
        stripe: { status: "ok" },
        email: { status: "ok" },
      },
    });
    expect(typeof payload.timestamp).toBe("string");
    expect(typeof payload.checks.database.latency).toBe("number");
    expect(typeof payload.checks.api.latency).toBe("number");
    expect(typeof payload.uptime).toBe("number");
  });

  it("reports degraded when optional providers are unconfigured but the database is healthy", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ status: "degraded" });
    expect(payload.checks).toBeUndefined();
  });

  it("returns admin degraded details for unconfigured optional providers", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    isCurrentUserSiteAdminMock.mockResolvedValue(true);

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      status: "degraded",
      checks: {
        database: { status: "ok" },
        stripe: { status: "unconfigured" },
        email: { status: "unconfigured" },
      },
    });
  });

  it("returns unhealthy when the database probe fails", async () => {
    healthSelectLimitMock.mockResolvedValue({
      error: { message: "database unavailable" },
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({ status: "unhealthy" });
    expect(payload.checks).toBeUndefined();
  });

  it("returns detailed unhealthy checks for admins when the admin client is unavailable", async () => {
    isCurrentUserSiteAdminMock.mockResolvedValue(true);
    createAdminClientMock.mockReturnValue(null);

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      status: "unhealthy",
      checks: {
        database: { status: "unavailable", latency: 0 },
        api: { status: "ok" },
        stripe: { status: "ok" },
        email: { status: "ok" },
      },
    });
  });

  it("returns minimal unhealthy response when health evaluation throws", async () => {
    isCurrentUserSiteAdminMock.mockRejectedValue(new Error("auth failure"));

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({ status: "unhealthy" });
    expect(payload.checks).toBeUndefined();
  });
});
