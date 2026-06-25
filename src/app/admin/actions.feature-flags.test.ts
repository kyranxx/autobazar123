import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUserMock = vi.fn();
const requireRoleMock = vi.fn();
const assertAdminMfaAssuranceMock = vi.fn();
const createClientMock = vi.fn();
const auditInsertMock = vi.fn();
const featureSelectMock = vi.fn();
const featureUpdateMock = vi.fn();
const featureInsertMock = vi.fn();
const featureEqMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
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

      if (table === "feature_flags") {
        return {
          select: featureSelectMock.mockImplementation(() => ({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { key: "vin_decoding", rollout_percentage: 0 },
              error: null,
            }),
          })),
          update: featureUpdateMock.mockImplementation(() => ({
            eq: featureEqMock.mockResolvedValue({ data: null, error: null }),
          })),
          insert: featureInsertMock.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "flag-id",
                key: "vin_decoding",
                enabled: false,
                description: "VIN",
                created_at: "2026-06-24T00:00:00.000Z",
                updated_at: "2026-06-24T00:00:00.000Z",
              },
              error: null,
            }),
          })),
        };
      }

      throw new Error(`Unexpected user-client table ${table}`);
    }),
  };
}

describe("admin feature flag actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "admin-user" } },
    });
    requireRoleMock.mockResolvedValue(undefined);
    assertAdminMfaAssuranceMock.mockResolvedValue(undefined);
    auditInsertMock.mockResolvedValue({ data: null, error: null });
    createClientMock.mockReturnValue(makeSupabaseMock());
  });

  it("logs feature flag toggles as feature-flag audit events", async () => {
    const { toggleFeatureFlag } = await import("./actions");

    await toggleFeatureFlag("flag-id", true);

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(featureUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        rollout_percentage: 100,
      }),
    );
    expect(featureEqMock).toHaveBeenCalledWith("id", "flag-id");
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "update_feature_flag",
        target_type: "feature_flag",
        target_id: "vin_decoding",
        details: { enabled: true },
      }),
    );
  });

  it("logs created feature flags as feature-flag audit events", async () => {
    const { createFeatureFlag } = await import("./actions");

    await createFeatureFlag("vin_decoding", "VIN");

    expect(featureInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "vin_decoding",
        name: "vin_decoding",
        description: "VIN",
      }),
    );
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "create_feature_flag",
        target_type: "feature_flag",
        target_id: "vin_decoding",
        details: { action: "created" },
      }),
    );
  });
});
