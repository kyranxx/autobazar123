import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getAnonClientMock } = vi.hoisted(() => ({
  getAnonClientMock: vi.fn(),
}));

const { recordFallbackActivationMock } = vi.hoisted(() => ({
  recordFallbackActivationMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase/anon", () => ({
  getAnonClient: getAnonClientMock,
}));

vi.mock("@/lib/algolia", () => ({
  transformCarToAlgoliaRecord: vi.fn((value) => value),
}));

vi.mock("@/lib/fallbacks/monitor", () => ({
  recordFallbackActivation: recordFallbackActivationMock,
}));

import { GET } from "./route";

describe("GET /api/search/catalog", () => {
  beforeEach(() => {
    getAnonClientMock.mockReset();
    recordFallbackActivationMock.mockClear();
  });

  it("fails open with empty records when Supabase lookup fails", async () => {
    getAnonClientMock.mockImplementation(() => {
      throw new Error("boom");
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/api/search/catalog"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ records: [], degraded: true });
    expect(response.headers.get("Cache-Control")).toContain("max-age=30");
  });

  it("skips fallback telemetry for expected prerender bailouts", async () => {
    getAnonClientMock.mockImplementation(() => {
      const error = new Error("During prerendering, fetch() rejects when the prerender is complete.");
      Object.assign(error, { digest: "NEXT_PRERENDER_INTERRUPTED" });
      throw error;
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/api/search/catalog?fallbackReason=search.algolia_unavailable"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ records: [], degraded: true });
    expect(recordFallbackActivationMock).toHaveBeenCalledTimes(1);
    expect(recordFallbackActivationMock).toHaveBeenCalledWith({
      key: "search.algolia_unavailable",
      summary: "Algolia runtime search failed; fallback catalog search served from API.",
    });
  });
});
