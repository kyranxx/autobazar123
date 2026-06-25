import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUserMock = vi.fn();
const requireRoleMock = vi.fn();
const assertAdminMfaAssuranceMock = vi.fn();
const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const auditInsertMock = vi.fn();
const adminFromMock = vi.fn();
const adsInsertMock = vi.fn();
const adsUpdateMock = vi.fn();
const adsEqMock = vi.fn();
const adsInMock = vi.fn();

const SELLER_ID = "11111111-1111-4111-8111-111111111111";
const BRAND_ID = "22222222-2222-4222-8222-222222222222";
const MODEL_ID = "33333333-3333-4333-8333-333333333333";
const AD_ID = "44444444-4444-4444-8444-444444444444";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock("@/lib/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => requireRoleMock(...args),
}));

vi.mock("@/lib/auth/admin-mfa", () => ({
  assertAdminMfaAssurance: (...args: unknown[]) =>
    assertAdminMfaAssuranceMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/email/jobs", () => ({
  enqueueModerationDecisionEmailJob: vi.fn(),
  enqueuePasswordRecoveryEmailJob: vi.fn(),
  scheduleQueuedEmailDrain: vi.fn(),
}));

vi.mock("@/lib/analytics/server", () => ({
  recordServerAnalyticsEvent: vi.fn(),
}));

function makeSupabaseMock() {
  return {
    auth: {
      getUser: authGetUserMock,
    },
    from: vi.fn((table: string) => {
      if (table === "admin_audit_logs") {
        return {
          insert: auditInsertMock,
        };
      }

      throw new Error(`Unexpected user-client table ${table}`);
    }),
  };
}

function makeReadSingle(data: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function makeAdminClientMock() {
  adminFromMock.mockImplementation((table: string) => {
    if (table === "profiles") {
      return makeReadSingle({
        id: SELLER_ID,
        email: "seller@example.com",
        full_name: "Seller One",
      });
    }

    if (table === "brands") {
      return makeReadSingle({
        id: BRAND_ID,
        name: "Skoda",
      });
    }

    if (table === "models") {
      return makeReadSingle({
        id: MODEL_ID,
        brand_id: BRAND_ID,
        name: "Octavia",
      });
    }

    if (table === "dealers") {
      return makeReadSingle({
        id: "55555555-5555-4555-8555-555555555555",
      });
    }

    if (table === "ads") {
      return {
        insert: adsInsertMock.mockImplementation(() => ({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: AD_ID },
            error: null,
          }),
        })),
        update: adsUpdateMock.mockImplementation(() => ({
          eq: adsEqMock.mockResolvedValue({ data: null, error: null }),
          in: adsInMock.mockResolvedValue({ data: null, error: null }),
        })),
      };
    }

    throw new Error(`Unexpected admin-client table ${table}`);
  });

  return {
    from: adminFromMock,
  };
}

describe("admin ad actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "admin-user" } },
    });
    requireRoleMock.mockResolvedValue(undefined);
    assertAdminMfaAssuranceMock.mockResolvedValue(undefined);
    auditInsertMock.mockResolvedValue({ data: null, error: null });
    createClientMock.mockReturnValue(makeSupabaseMock());
    createAdminClientMock.mockReturnValue(makeAdminClientMock());
  });

  it("creates a real draft ad for the selected seller", async () => {
    const { createAdminListingForUser } = await import("./actions");

    const created = await createAdminListingForUser({
      sellerId: SELLER_ID,
      brandId: BRAND_ID,
      modelId: MODEL_ID,
      year: 2021,
      priceEur: 12990,
      mileageKm: 85000,
      fuel: "diesel",
      transmission: "manual",
      bodyStyle: "combi",
      locationCity: "Nitra",
      description: "Kontrolný admin draft",
    });

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(adsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        seller_id: SELLER_ID,
        dealer_id: "55555555-5555-4555-8555-555555555555",
        brand_id: BRAND_ID,
        model_id: MODEL_ID,
        brand: "Skoda",
        model: "Octavia",
        status: "draft",
        photos_json: [],
        equipment_json: [],
      }),
    );
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "create_ad",
        target_type: "ad",
        target_id: AD_ID,
      }),
    );
    expect(created).toEqual({ success: true, adId: AD_ID });
  });

  it("edits any selected ad without relying on seller ownership", async () => {
    const { updateAdminListing } = await import("./actions");

    await updateAdminListing({
      adId: AD_ID,
      priceEur: 11990,
      mileageKm: 90000,
      description: "Cena po dohode",
    });

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(adsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        price_eur: 11990,
        mileage_km: 90000,
        description: "Cena po dohode",
      }),
    );
    expect(adsEqMock).toHaveBeenCalledWith("id", AD_ID);
    expect(adsEqMock).not.toHaveBeenCalledWith("seller_id", expect.any(String));
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update_ad",
        target_type: "ad",
        target_id: AD_ID,
      }),
    );
  });

  it("bulk updates status for selected ads", async () => {
    const { bulkUpdateAdminListings } = await import("./actions");

    await bulkUpdateAdminListings({
      adIds: [AD_ID, AD_ID],
      status: "active",
    });

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(adsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        published_at: expect.any(String),
        expires_at: expect.any(String),
      }),
    );
    expect(adsInMock).toHaveBeenCalledWith("id", [AD_ID]);
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "bulk_update_ads",
        target_type: "ad",
        details: expect.objectContaining({
          count: 1,
          status: "active",
        }),
      }),
    );
  });
});
