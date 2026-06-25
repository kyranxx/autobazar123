import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUserMock = vi.fn();
const requireRoleMock = vi.fn();
const limitMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: authGetUserMock,
    },
    from: vi.fn((table: string) => {
      if (table !== "system_logs") {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: limitMock,
              })),
            })),
          })),
        })),
      };
    }),
  }),
}));

vi.mock("@/lib/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => requireRoleMock(...args),
}));

function makeAnalyticsRow(
  id: string,
  eventName: string,
  payload: Record<string, unknown>,
  pagePath = "/",
) {
  return {
    id,
    created_at: new Date().toISOString(),
    metadata: {
      eventName,
      pagePath,
      payload,
    },
  };
}

describe("admin analytics actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "admin-user" } },
    });
    requireRoleMock.mockResolvedValue(undefined);
  });

  it("returns owner-friendly labels and searched words instead of raw event names", async () => {
    limitMock.mockResolvedValue({
      data: [
        makeAnalyticsRow("search-1", "search_query_submitted", {
          query: "BMW",
          resultCount: 12,
        }),
        makeAnalyticsRow("search-2", "search_query_submitted", {
          query: "bmw",
          resultCount: 9,
        }),
        makeAnalyticsRow("search-3", "search_query_submitted", {
          query: "Audi",
          resultCount: 5,
        }),
        makeAnalyticsRow("cta-1", "homepage_cta_clicked", {
          surface: "home_seller_panel",
          cta: "sell_car",
        }),
        makeAnalyticsRow("listing-1", "listing_viewed", {
          source: "featured",
          adId: "ad-1",
        }),
      ],
      error: null,
    });

    const { getHomepageAnalyticsDashboard } = await import("./analytics-actions");

    const dashboard = await getHomepageAnalyticsDashboard();

    expect(dashboard.summary.searches7d).toBe(3);
    expect(dashboard.eventBreakdown.map((row) => row.label)).toEqual([
      "Vyhľadávanie z úvodnej stránky",
      "Klik na hlavné tlačidlo",
      "Otvorený odporúčaný inzerát",
    ]);
    expect(dashboard.ctaBreakdown).toEqual([
      { label: "Panel pre predajcov / Predať auto", count: 1 },
    ]);
    expect(dashboard.searchBreakdown).toEqual([
      { label: "bmw", count: 2 },
      { label: "audi", count: 1 },
    ]);
    expect(JSON.stringify(dashboard)).not.toContain("search_query_submitted");
    expect(JSON.stringify(dashboard)).not.toContain("homepage_cta_clicked");
    expect(JSON.stringify(dashboard)).not.toContain("listing_viewed");
  });
});
