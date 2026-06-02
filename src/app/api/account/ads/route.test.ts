import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rejectInvalidCsrfRequestMock = vi.fn();
const checkStrictRateLimitMock = vi.fn();
const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const getUserMock = vi.fn();
const brandMaybeSingleMock = vi.fn();
const modelMaybeSingleMock = vi.fn();
const ownedAdMaybeSingleMock = vi.fn();
const dealerMaybeSingleMock = vi.fn();
const insertAdSingleMock = vi.fn();
const updateAdEqSellerMock = vi.fn();
const deleteAdEqSellerMock = vi.fn();
const adminRpcMock = vi.fn();
const getPricingConfigMock = vi.fn();
const getListingOperationPriceCentsMock = vi.fn();

vi.mock("@/lib/security/csrf", () => ({
  rejectInvalidCsrfRequest: (...args: unknown[]) =>
    rejectInvalidCsrfRequestMock(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkStrictRateLimit: (...args: unknown[]) => checkStrictRateLimitMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}));

vi.mock("@/lib/pricing/server", () => ({
  getPricingConfig: (...args: unknown[]) => getPricingConfigMock(...args),
}));

vi.mock("@/lib/pricing/config", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pricing/config")>(
    "@/lib/pricing/config",
  );

  return {
    ...actual,
    getListingOperationPriceCents: (...args: unknown[]) =>
      getListingOperationPriceCentsMock(...args),
  };
});

import { PATCH, POST } from "./route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const AD_ID = "33333333-3333-4333-8333-333333333333";
const BRAND_ID = "44444444-4444-4444-8444-444444444444";
const MODEL_ID = "55555555-5555-4555-8555-555555555555";
const DEALER_ID = "66666666-6666-4666-8666-666666666666";

const photoUrl = "https://imagedelivery.net/account/image/public";

function createValidListing(overrides: Record<string, unknown> = {}) {
  return {
    brandId: BRAND_ID,
    modelId: MODEL_ID,
    vin: null,
    year: 2020,
    priceEur: 12000,
    mileageKm: 90000,
    fuel: "petrol",
    transmission: "manual",
    bodyStyle: "suv",
    powerKw: 110,
    engineVolumeCm3: 1598,
    generation: null,
    driveType: "front",
    color: "blue",
    locationCity: "Bratislava",
    locationDistrict: null,
    description: "Vehicle ready for sale.",
    stkValidUntil: null,
    isBoughtInSk: true,
    isVatDeductible: false,
    hasServiceBook: true,
    fullServiceHistory: false,
    originalityCheck: false,
    garageKept: false,
    notCrashed: true,
    isImported: false,
    photoUrls: [photoUrl],
    equipment: ["ABS"],
    ...overrides,
  };
}

function createPostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/account/ads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createPatchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/account/ads", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function installSupabaseClientMock() {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => getUserMock(...args),
    },
    from: (table: string) => {
      if (table === "brands") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => brandMaybeSingleMock(),
            }),
          }),
        };
      }

      if (table === "models") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => modelMaybeSingleMock(),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => ownedAdMaybeSingleMock(),
          }),
        }),
      };
    },
  });
}

function installAdminClientMock() {
  createAdminClientMock.mockReturnValue({
    rpc: (...args: unknown[]) => adminRpcMock(...args),
    from: (table: string) => {
      if (table === "dealers") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: () => dealerMaybeSingleMock(),
                }),
              }),
            }),
          }),
        };
      }

      return {
        insert: (payload: unknown) => ({
          select: (columns: string) => ({
            single: () => insertAdSingleMock(payload, columns),
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: (firstColumn: string, firstValue: unknown) => ({
            eq: (secondColumn: string, secondValue: unknown) =>
              updateAdEqSellerMock(payload, {
                first: { column: firstColumn, value: firstValue },
                second: { column: secondColumn, value: secondValue },
              }),
          }),
        }),
        delete: () => ({
          eq: (firstColumn: string, firstValue: unknown) => ({
            eq: (secondColumn: string, secondValue: unknown) =>
              deleteAdEqSellerMock({
                first: { column: firstColumn, value: firstValue },
                second: { column: secondColumn, value: secondValue },
              }),
          }),
        }),
      };
    },
  });
}

describe("/api/account/ads", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rejectInvalidCsrfRequestMock.mockReturnValue(null);
    checkStrictRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    getUserMock.mockResolvedValue({ data: { user: { id: USER_ID } } });
    brandMaybeSingleMock.mockResolvedValue({
      data: { id: BRAND_ID, name: "Skoda" },
      error: null,
    });
    modelMaybeSingleMock.mockResolvedValue({
      data: { id: MODEL_ID, name: "Octavia", brand_id: BRAND_ID },
      error: null,
    });
    ownedAdMaybeSingleMock.mockResolvedValue({
      data: { id: AD_ID, seller_id: USER_ID },
      error: null,
    });
    dealerMaybeSingleMock.mockResolvedValue({
      data: { id: DEALER_ID },
      error: null,
    });
    insertAdSingleMock.mockResolvedValue({
      data: { id: AD_ID },
      error: null,
    });
    updateAdEqSellerMock.mockResolvedValue({ error: null });
    deleteAdEqSellerMock.mockResolvedValue({ error: null });
    adminRpcMock.mockResolvedValue({
      data: { success: true, status: "active", auto_published: true },
      error: null,
    });
    getPricingConfigMock.mockResolvedValue({});
    getListingOperationPriceCentsMock.mockReturnValue(499);

    installSupabaseClientMock();
    installAdminClientMock();
  });

  it("requires authentication before creating a listing", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      createPostRequest({
        listing: createValidListing(),
        operation: "publish_basic",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(insertAdSingleMock).not.toHaveBeenCalled();
  });

  it("creates a paid draft listing with server-resolved brand and model names", async () => {
    const response = await POST(
      createPostRequest({
        listing: createValidListing(),
        operation: "publish_premium",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      adId: AD_ID,
      checkoutRequired: true,
      operation: "publish_premium",
    });
    expect(insertAdSingleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        seller_id: USER_ID,
        dealer_id: DEALER_ID,
        brand_id: BRAND_ID,
        model_id: MODEL_ID,
        brand: "Skoda",
        model: "Octavia",
        status: "draft",
      }),
      "id",
    );
    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("auto-publishes a free listing through the private listing RPC", async () => {
    getListingOperationPriceCentsMock.mockReturnValue(0);

    const response = await POST(
      createPostRequest({
        listing: createValidListing(),
        operation: "publish_basic",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      adId: AD_ID,
      status: "active",
      autoPublished: true,
    });
    expect(adminRpcMock).toHaveBeenCalledWith(
      "apply_private_listing_action",
      {
        p_actor_user_id: USER_ID,
        p_ad_id: AD_ID,
        p_operation: "publish_basic",
        p_transaction_id: null,
      },
    );
    expect(deleteAdEqSellerMock).not.toHaveBeenCalled();
  });

  it("deletes the draft when free auto-publish fails", async () => {
    getListingOperationPriceCentsMock.mockReturnValue(0);
    adminRpcMock.mockResolvedValue({
      data: { success: false, error: "publish failed" },
      error: null,
    });

    const response = await POST(
      createPostRequest({
        listing: createValidListing(),
        operation: "publish_basic",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "publish failed" });
    expect(deleteAdEqSellerMock).toHaveBeenCalledWith({
      first: { column: "id", value: AD_ID },
      second: { column: "seller_id", value: USER_ID },
    });
  });

  it("quick-edits only an owned listing", async () => {
    const response = await PATCH(
      createPatchRequest({
        mode: "quick",
        quickEdit: {
          adId: AD_ID,
          priceEur: 13000,
          mileageKm: 92000,
          description: "Updated listing description.",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, adId: AD_ID });
    expect(updateAdEqSellerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        price_eur: 13000,
        mileage_km: 92000,
        description: "Updated listing description.",
      }),
      {
        first: { column: "id", value: AD_ID },
        second: { column: "seller_id", value: USER_ID },
      },
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects quick-editing another user's listing", async () => {
    ownedAdMaybeSingleMock.mockResolvedValue({
      data: { id: AD_ID, seller_id: OTHER_USER_ID },
      error: null,
    });

    const response = await PATCH(
      createPatchRequest({
        mode: "quick",
        quickEdit: {
          adId: AD_ID,
          priceEur: 13000,
          mileageKm: 92000,
          description: "Updated listing description.",
        },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "Forbidden" });
    expect(updateAdEqSellerMock).not.toHaveBeenCalled();
  });
});
