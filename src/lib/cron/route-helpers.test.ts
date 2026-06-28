import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { rejectWhenInvalidCronRequest } from "./route-helpers";

function createCronRequest(headers?: HeadersInit): NextRequest {
  return new NextRequest("https://www.autobazar123.sk/api/cron/send-alerts", {
    method: "GET",
    headers,
  });
}

describe("rejectWhenInvalidCronRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows local cron route calls without CRON_SECRET", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");

    expect(rejectWhenInvalidCronRequest(createCronRequest())).toBeNull();
  });

  it("fails closed in production when CRON_SECRET is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");

    const response = rejectWhenInvalidCronRequest(createCronRequest());

    expect(response?.status).toBe(500);
    await expect(response?.json()).resolves.toEqual({
      error: "Cron secret is not configured",
    });
  });

  it("rejects production cron calls without the configured secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "expected-secret");

    const response = rejectWhenInvalidCronRequest(
      createCronRequest({ authorization: "Bearer wrong-secret" }),
    );

    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("accepts the Vercel Authorization bearer secret in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "expected-secret");

    expect(
      rejectWhenInvalidCronRequest(
        createCronRequest({ authorization: "Bearer expected-secret" }),
      ),
    ).toBeNull();
  });

  it("accepts the manual x-cron-secret header in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "expected-secret");

    expect(
      rejectWhenInvalidCronRequest(
        createCronRequest({ "x-cron-secret": "expected-secret" }),
      ),
    ).toBeNull();
  });
});
