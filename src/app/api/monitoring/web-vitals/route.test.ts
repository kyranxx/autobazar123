import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkRateLimitMock, createAdminClientMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { POST } from "./route";

const validPayload = {
  id: "metric-1",
  name: "LCP",
  value: 1250,
  route: "/",
};

describe("POST /api/monitoring/web-vitals", () => {
  beforeEach(() => {
    checkRateLimitMock.mockReset();
    createAdminClientMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ success: true });
    createAdminClientMock.mockReturnValue(null);
  });

  it("accepts same-origin requests for the live deployment alias", async () => {
    const response = await POST(
      new NextRequest("https://autobazar123.vercel.app/api/monitoring/web-vitals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://autobazar123.vercel.app",
        },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(204);
  });

  it("rejects cross-origin requests outside the allowlist", async () => {
    const response = await POST(
      new NextRequest("https://autobazar123.vercel.app/api/monitoring/web-vitals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example.com",
        },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("quietly drops rate-limited metrics without surfacing browser errors", async () => {
    checkRateLimitMock.mockResolvedValue({ success: false });

    const response = await POST(
      new NextRequest("https://autobazar123.vercel.app/api/monitoring/web-vitals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://autobazar123.vercel.app",
        },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(204);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });
});
