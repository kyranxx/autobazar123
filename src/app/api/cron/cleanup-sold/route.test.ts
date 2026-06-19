import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const {
  createCronAdminClientMock,
  rejectWhenInvalidCronRequestMock,
  revalidateAdsCacheTagsMock,
} = vi.hoisted(() => ({
  createCronAdminClientMock: vi.fn(),
  rejectWhenInvalidCronRequestMock: vi.fn(),
  revalidateAdsCacheTagsMock: vi.fn(),
}));

vi.mock("@/lib/cron/route-helpers", () => ({
  createCronAdminClient: createCronAdminClientMock,
  rejectWhenInvalidCronRequest: rejectWhenInvalidCronRequestMock,
  revalidateAdsCacheTags: revalidateAdsCacheTagsMock,
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
  return new NextRequest("http://localhost/api/cron/cleanup-sold", {
    method: "GET",
  });
}

function installAdminClientMock(options: {
  soldAds?: unknown[];
  fetchError?: { message: string } | null;
  updateResult?: UpdateResult;
}) {
  const updateMock = vi.fn();

  createCronAdminClientMock.mockReturnValue({
    from: (table: string) => {
      if (table !== "ads") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              lt: () =>
                Promise.resolve({
                  data: options.soldAds ?? [],
                  error: options.fetchError ?? null,
                } satisfies QueryResult),
            }),
          }),
        }),
        update: (payload: unknown) => {
          updateMock(payload);
          return {
            in: () =>
              Promise.resolve(options.updateResult ?? { error: null }),
          };
        },
      };
    },
  });

  return { updateMock };
}

describe("GET /api/cron/cleanup-sold", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rejectWhenInvalidCronRequestMock.mockReturnValue(null);
    installAdminClientMock({});
  });

  it("returns the cron auth rejection response before querying sold ads", async () => {
    rejectWhenInvalidCronRequestMock.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(createCronAdminClientMock).not.toHaveBeenCalled();
  });

  it("hides old sold ads and revalidates ad cache tags", async () => {
    const { updateMock } = installAdminClientMock({
      soldAds: [
        {
          id: "ad-1",
          brand: "Skoda",
          model: "Octavia",
          sold_at: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "ad-2",
          brand: "Volkswagen",
          model: "Golf",
          sold_at: "2026-06-02T00:00:00.000Z",
        },
      ],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      message: "Successfully hidden 2 old sold ads",
      count: 2,
      ads: [
        {
          id: "ad-1",
          title: "Skoda Octavia",
          soldAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "ad-2",
          title: "Volkswagen Golf",
          soldAt: "2026-06-02T00:00:00.000Z",
        },
      ],
    });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_hidden: true }),
    );
    expect(revalidateAdsCacheTagsMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error and does not revalidate when hiding old sold ads fails", async () => {
    installAdminClientMock({
      soldAds: [
        {
          id: "ad-1",
          brand: "Skoda",
          model: "Octavia",
          sold_at: "2026-06-01T00:00:00.000Z",
        },
      ],
      updateResult: { error: { message: "permission denied" } },
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Failed to hide sold ads" });
    expect(revalidateAdsCacheTagsMock).not.toHaveBeenCalled();
  });
});
