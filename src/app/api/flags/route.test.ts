import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const getFlagsForClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/feature-flags", () => ({
  getFlagsForClient: (...args: unknown[]) => getFlagsForClientMock(...args),
}));

import { GET } from "./route";

describe("GET /api/flags cache boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user-specific flags with private no-store cache headers", async () => {
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    createClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    getFlagsForClientMock.mockResolvedValue({
      someFeature: true,
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ flags: { someFeature: true } });
    expect(getFlagsForClientMock).toHaveBeenCalledWith("user-123");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("cache-control")).toContain("must-revalidate");
  });

  it("keeps private no-store cache headers when flag resolution fails", async () => {
    createClientMock.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Failed to fetch feature flags");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("cache-control")).toContain("must-revalidate");
  });
});

