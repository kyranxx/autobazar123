import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { algoliaDeleteObjectsMock, getAdminClientMock } = vi.hoisted(() => ({
  algoliaDeleteObjectsMock: vi.fn(),
  getAdminClientMock: vi.fn(),
}));

const {
  createCronAdminClientMock,
  rejectWhenInvalidCronRequestMock,
  revalidateAdsCacheTagsMock,
} = vi.hoisted(() => ({
  createCronAdminClientMock: vi.fn(),
  rejectWhenInvalidCronRequestMock: vi.fn(),
  revalidateAdsCacheTagsMock: vi.fn(),
}));

const { recordFallbackActivationMock } = vi.hoisted(() => ({
  recordFallbackActivationMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/algolia", () => ({
  getAdminClient: getAdminClientMock,
  getCarsIndexName: () => "ads",
}));

vi.mock("@/lib/cron/route-helpers", () => ({
  createCronAdminClient: createCronAdminClientMock,
  rejectWhenInvalidCronRequest: rejectWhenInvalidCronRequestMock,
  revalidateAdsCacheTags: revalidateAdsCacheTagsMock,
}));

vi.mock("@/lib/fallbacks/monitor", () => ({
  recordFallbackActivation: recordFallbackActivationMock,
}));

import { GET } from "./route";

type QueryResult = {
  data?: unknown[] | null;
  error?: { message: string } | null;
};

type UpdateResult = {
  error?: { message: string } | null;
};

function createRequest(): NextRequest {
  return new NextRequest("http://localhost/api/cron/expire-ads", {
    method: "GET",
  });
}

function installAdminClientMock(options: {
  selectResults: QueryResult[];
  updateResults?: UpdateResult[];
}) {
  const selectResults = [...options.selectResults];
  const updateResults = [...(options.updateResults ?? [])];

  createCronAdminClientMock.mockReturnValue({
    from: (table: string) => {
      expect(table).toBe("ads");

      return {
        select: () => ({
          eq: () => ({
            lt: () => Promise.resolve(selectResults.shift() ?? { data: [], error: null }),
          }),
          or: () => Promise.resolve(selectResults.shift() ?? { data: [], error: null }),
        }),
        update: () => ({
          in: () => Promise.resolve(updateResults.shift() ?? { error: null }),
        }),
      };
    },
  });
}

describe("GET /api/cron/expire-ads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rejectWhenInvalidCronRequestMock.mockReturnValue(null);
    getAdminClientMock.mockReturnValue({
      deleteObjects: (...args: unknown[]) => algoliaDeleteObjectsMock(...args),
    });
  });

  it("returns a degraded response and records fallback telemetry when Algolia cleanup fails", async () => {
    const algoliaError = new Error("Algolia unavailable");
    algoliaDeleteObjectsMock.mockRejectedValue(algoliaError);
    installAdminClientMock({
      selectResults: [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [{ id: "ad-stale-1" }], error: null },
      ],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({
      message: "Cron job completed with failures",
      degraded: true,
      failures: [
        {
          code: "algolia_cleanup_failed",
          summary: "Algolia stale ad cleanup failed",
        },
      ],
    });
    expect(recordFallbackActivationMock).toHaveBeenCalledWith({
      key: "cron.expire_ads_algolia_cleanup_failed",
      summary: "Algolia stale ad cleanup failed during expire-ads cron.",
      error: algoliaError,
      metadata: {
        indexName: "ads",
        staleAdCount: 1,
      },
    });
  });

  it("does not report success when expired ads cannot be updated", async () => {
    installAdminClientMock({
      selectResults: [
        { data: [{ id: "ad-expired-1" }], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ],
      updateResults: [{ error: { message: "update failed" } }],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toMatchObject({
      message: "Cron job completed with failures",
      degraded: true,
      failures: [
        {
          code: "expired_ads_update_failed",
          summary: "Expired ads status update failed",
        },
      ],
    });
    expect(revalidateAdsCacheTagsMock).not.toHaveBeenCalled();
  });
});
