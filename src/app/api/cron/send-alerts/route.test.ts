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

type MutationResult = QueryResult;

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

function createQuery(result: QueryResult | MutationResult) {
  const query = {
    select: () => Promise.resolve(result),
    gt: () => query,
    order: () => query,
    limit: () => query,
    eq: () => query,
    is: () => query,
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
  savedAdUpdateResults?: MutationResult[];
  savedSearchUpdateResults?: MutationResult[];
}) {
  const savedAdUpdateMock = vi.fn();
  const savedSearchUpdateMock = vi.fn();
  const savedAdUpdateResults = [...(options.savedAdUpdateResults ?? [])];
  const savedSearchUpdateResults = [...(options.savedSearchUpdateResults ?? [])];
  const nextSavedAdUpdateResult = () =>
    savedAdUpdateResults.shift() ?? { data: [{ id: "saved-ad-claim" }], error: null };
  const nextSavedSearchUpdateResult = () =>
    savedSearchUpdateResults.shift() ?? { data: [{ id: "saved-search-claim" }], error: null };

  createCronAdminClientMock.mockReturnValue({
    from: (table: string) => {
      if (table === "saved_ad_alert_preferences") {
        return {
          select: () =>
            createQuery({
              data: options.savedAdAlerts ?? [],
              error: null,
            }),
          update: (payload: unknown) => {
            savedAdUpdateMock(payload);
            return createQuery(nextSavedAdUpdateResult());
          },
        };
      }

      if (table === "saved_searches") {
        return {
          select: () =>
            createQuery({
              data: options.savedSearches ?? [],
              error: null,
            }),
          update: (payload: unknown) => {
            savedSearchUpdateMock(payload);
            return createQuery(nextSavedSearchUpdateResult());
          },
        };
      }

      if (table === "ads") {
        return {
          select: () =>
            createQuery({
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
          last_alerted_at: "2026-06-18T00:00:00.000Z",
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
      savedAdUpdateResults: [
        { data: [{ user_id: "user-1", ad_id: "ad-1" }], error: null },
        { error: null },
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
    expect(savedAdUpdateMock).toHaveBeenCalledTimes(2);
    expect(savedAdUpdateMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        last_alerted_price_eur: 11_500,
        last_alerted_status: "active",
      }),
    );
    expect(savedAdUpdateMock).toHaveBeenNthCalledWith(
      2,
      {
        last_alerted_price_eur: 12_000,
        last_alerted_status: "active",
        last_alerted_at: "2026-06-18T00:00:00.000Z",
      },
    );
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
      savedSearchUpdateResults: [
        { data: [{ id: "search-1" }], error: null },
        { error: null },
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
    expect(savedSearchUpdateMock).toHaveBeenCalledTimes(2);
    expect(savedSearchUpdateMock).toHaveBeenNthCalledWith(
      1,
      { last_notified_listing_created_at: "2026-06-19T00:00:00.000Z" },
    );
    expect(savedSearchUpdateMock).toHaveBeenNthCalledWith(
      2,
      { last_notified_listing_created_at: null },
    );
  });

  it("rolls back a saved-ad claim when the alert sender throws", async () => {
    sendSavedAdAlertEmailMock.mockRejectedValue(new Error("Template render failed"));
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
          last_alerted_at: "2026-06-18T00:00:00.000Z",
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
      savedAdUpdateResults: [
        { data: [{ user_id: "user-1", ad_id: "ad-1" }], error: null },
        { error: null },
      ],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.failures).toEqual([
      {
        code: "saved_ad_alert_email_failed",
        summary: "Saved ad alert email failed",
        error: "Template render failed",
      },
    ]);
    expect(savedAdUpdateMock).toHaveBeenCalledTimes(2);
    expect(savedAdUpdateMock).toHaveBeenNthCalledWith(
      2,
      {
        last_alerted_price_eur: 12_000,
        last_alerted_status: "active",
        last_alerted_at: "2026-06-18T00:00:00.000Z",
      },
    );
  });

  it("rolls back a saved-search claim when the alert sender throws", async () => {
    sendSavedSearchAlertEmailMock.mockRejectedValue(new Error("Template render failed"));
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
      savedSearchUpdateResults: [
        { data: [{ id: "search-1" }], error: null },
        { error: null },
      ],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.failures).toEqual([
      {
        code: "saved_search_alert_email_failed",
        summary: "Saved search alert email failed",
        error: "Template render failed",
      },
    ]);
    expect(savedSearchUpdateMock).toHaveBeenCalledTimes(2);
    expect(savedSearchUpdateMock).toHaveBeenNthCalledWith(
      2,
      { last_notified_listing_created_at: null },
    );
  });

  it("skips a saved-ad alert when another cron invocation already claimed it", async () => {
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
          last_alerted_at: null,
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
      savedAdUpdateResults: [{ data: [], error: null }],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      savedAdEmailsSent: 0,
      savedSearchEmailsSent: 0,
    });
    expect(savedAdUpdateMock).toHaveBeenCalledTimes(1);
    expect(sendSavedAdAlertEmailMock).not.toHaveBeenCalled();
  });

  it("skips a saved-search alert when another cron invocation already claimed it", async () => {
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
      savedSearchUpdateResults: [{ data: [], error: null }],
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      savedAdEmailsSent: 0,
      savedSearchEmailsSent: 0,
    });
    expect(savedSearchUpdateMock).toHaveBeenCalledTimes(1);
    expect(sendSavedSearchAlertEmailMock).not.toHaveBeenCalled();
  });

  it("passes a deterministic idempotency key for saved-ad alerts", async () => {
    installAdminClientMock({
      savedAdAlerts: [
        {
          user_id: "user-1",
          ad_id: "ad-1",
          notify_price_drop: true,
          notify_status_change: true,
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
            status: "sold",
          },
        },
      ],
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(sendSavedAdAlertEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey:
          "saved-ad-alert/user-1/ad-1/price-12000-to-11500/status-active-to-sold",
      }),
    );
  });

  it("passes a deterministic idempotency key for saved-search alerts", async () => {
    installAdminClientMock({
      savedSearches: [
        {
          id: "search-1",
          label: "Octavia",
          query_string: "brand=Skoda",
          filters_json: emptySavedSearchFilters,
          notify_email: true,
          paused: false,
          last_notified_listing_created_at: "2026-06-18T00:00:00.000Z",
          created_at: "2026-06-17T00:00:00.000Z",
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
          created_at: "2026-06-19T10:00:00.000Z",
        },
        {
          id: "ad-3",
          brand: "Skoda",
          model: "Octavia",
          year: 2022,
          price_eur: 14_000,
          location_city: "Košice",
          created_at: "2026-06-19T09:00:00.000Z",
        },
      ],
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(sendSavedSearchAlertEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey:
          "saved-search-alert/search-1/since-2026-06-18T00%3A00%3A00.000Z/newest-2026-06-19T10%3A00%3A00.000Z",
      }),
    );
  });
});
