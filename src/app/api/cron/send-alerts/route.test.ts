import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  createCronAdminClientMock,
  rejectWhenInvalidCronRequestMock,
} = vi.hoisted(() => ({
  createCronAdminClientMock: vi.fn(),
  rejectWhenInvalidCronRequestMock: vi.fn(),
}));

const {
  sendSavedAdAlertEmailMock,
  sendSavedSearchAlertEmailMock,
} = vi.hoisted(() => ({
  sendSavedAdAlertEmailMock: vi.fn(),
  sendSavedSearchAlertEmailMock: vi.fn(),
}));

vi.mock("@/lib/cron/route-helpers", () => ({
  createCronAdminClient: createCronAdminClientMock,
  rejectWhenInvalidCronRequest: rejectWhenInvalidCronRequestMock,
}));

vi.mock("@/lib/email/send-marketplace-alerts", () => ({
  sendSavedAdAlertEmail: (...args: unknown[]) =>
    sendSavedAdAlertEmailMock(...args),
  sendSavedSearchAlertEmail: (...args: unknown[]) =>
    sendSavedSearchAlertEmailMock(...args),
}));

vi.mock("@/lib/site-url", () => ({
  getBaseUrl: () => "http://localhost:3000",
}));

import { GET } from "./route";
import type { SavedSearchFilters } from "@/lib/search/saved-searches";

type QueryResult = {
  data?: unknown[] | null;
  error?: { message: string } | null;
};

type UpdateResult = {
  error?: { message: string } | null;
};

const emptySavedSearchFilters: SavedSearchFilters = {
  q: "",
  brand: [],
  model: "",
  fuel: "",
  transmission: "",
  bodyStyle: "",
  location: "",
  hasServiceBook: false,
  notCrashed: false,
  boughtInSk: false,
};

function createRequest(): NextRequest {
  return new NextRequest("http://localhost/api/cron/send-alerts", {
    method: "GET",
  });
}

function createTwoEqQuery(result: QueryResult | UpdateResult) {
  let eqCalls = 0;
  const query = {
    eq: () => {
      eqCalls += 1;
      return eqCalls >= 2 ? Promise.resolve(result) : query;
    },
  };

  return query;
}

function createListingsQuery(result: QueryResult) {
  const query = {
    gt: () => query,
    order: () => query,
    limit: () => query,
    eq: () => query,
    in: () => query,
    ilike: () => query,
    gte: () => query,
    lte: () => query,
    or: () => query,
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };

  return query;
}

function installAdminClientMock(options: {
  savedAdAlerts?: unknown[];
  savedSearches?: unknown[];
  listings?: unknown[];
  savedAdUpdateResult?: UpdateResult;
  savedSearchUpdateResult?: UpdateResult;
}) {
  const savedAdUpdateMock = vi.fn();
  const savedSearchUpdateMock = vi.fn();

  createCronAdminClientMock.mockReturnValue({
    from: (table: string) => {
      if (table === "saved_ad_alert_preferences") {
        return {
          select: () =>
            createTwoEqQuery({
              data: options.savedAdAlerts ?? [],
              error: null,
            }),
          update: (payload: unknown) => {
            savedAdUpdateMock(payload);
            return createTwoEqQuery(
              options.savedAdUpdateResult ?? { error: null },
            );
          },
        };
      }

      if (table === "saved_searches") {
        return {
          select: () =>
            createTwoEqQuery({
              data: options.savedSearches ?? [],
              error: null,
            }),
          update: (payload: unknown) => {
            savedSearchUpdateMock(payload);
            return {
              eq: () =>
                Promise.resolve(options.savedSearchUpdateResult ?? { error: null }),
            };
          },
        };
      }

      if (table === "ads") {
        return {
          select: () =>
            createListingsQuery({
              data: options.listings ?? [],
              error: null,
            }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  });

  return {
    savedAdUpdateMock,
    savedSearchUpdateMock,
  };
}

describe("GET /api/cron/send-alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rejectWhenInvalidCronRequestMock.mockReturnValue(null);
    sendSavedAdAlertEmailMock.mockResolvedValue({ success: true });
    sendSavedSearchAlertEmailMock.mockResolvedValue({ success: true });
  });

  it("returns degraded when a saved-ad alert email fails", async () => {
    sendSavedAdAlertEmailMock.mockResolvedValue({
      success: false,
      error: "Resend error: Unauthorized",
    });
    const { savedAdUpdateMock } = installAdminClientMock({
      savedAdAlerts: [
        {
          user_id: "user-1",
          ad_id: "ad-1",
          notify_price_drop: true,
          notify_status_change: false,
          notify_email: true,
          paused: false,
          last_alerted_price_eur: 12_000,
          last_alerted_status: "active",
          profiles: { email: "buyer@example.com", full_name: "Buyer" },
          ads: {
            id: "ad-1",
            brand: "Skoda",
            model: "Octavia",
            year: 2020,
            price_eur: 11_500,
            status: "active",
          },
        },
      ],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({
      ok: false,
      degraded: true,
      savedAdEmailsSent: 0,
      savedSearchEmailsSent: 0,
      failures: [
        {
          code: "saved_ad_alert_email_failed",
          summary: "Saved ad alert email failed",
          error: "Resend error: Unauthorized",
        },
      ],
    });
    expect(savedAdUpdateMock).not.toHaveBeenCalled();
  });

  it("returns degraded when a saved-search alert email fails", async () => {
    sendSavedSearchAlertEmailMock.mockResolvedValue({
      success: false,
      error: "RESEND_API_KEY not configured",
    });
    const { savedSearchUpdateMock } = installAdminClientMock({
      savedSearches: [
        {
          id: "search-1",
          label: "Octavia",
          query_string: "brand=Skoda",
          filters_json: emptySavedSearchFilters,
          notify_email: true,
          paused: false,
          last_notified_listing_created_at: null,
          created_at: "2026-06-18T00:00:00.000Z",
          profiles: { email: "buyer@example.com", full_name: "Buyer" },
        },
      ],
      listings: [
        {
          id: "ad-2",
          brand: "Skoda",
          model: "Octavia",
          year: 2021,
          price_eur: 13_000,
          location_city: "Bratislava",
          created_at: "2026-06-19T00:00:00.000Z",
        },
      ],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({
      ok: false,
      degraded: true,
      savedAdEmailsSent: 0,
      savedSearchEmailsSent: 0,
      failures: [
        {
          code: "saved_search_alert_email_failed",
          summary: "Saved search alert email failed",
          error: "RESEND_API_KEY not configured",
        },
      ],
    });
    expect(savedSearchUpdateMock).not.toHaveBeenCalled();
  });
});
