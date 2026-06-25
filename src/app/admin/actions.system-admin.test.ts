import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUserMock = vi.fn();
const requireRoleMock = vi.fn();
const assertAdminMfaAssuranceMock = vi.fn();
const createClientMock = vi.fn();
const auditInsertMock = vi.fn();
const revalidatePathMock = vi.fn();
const revalidateTagMock = vi.fn();
const fetchMock = vi.fn();

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
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
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

function makeJsonResponse(
  body: Record<string, unknown>,
  init: { ok?: boolean; status?: number } = {},
) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("admin system actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.autobazar123.sk");
    vi.stubGlobal("fetch", fetchMock);
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "admin-user" } },
    });
    requireRoleMock.mockResolvedValue(undefined);
    assertAdminMfaAssuranceMock.mockResolvedValue(undefined);
    auditInsertMock.mockResolvedValue({ data: null, error: null });
    createClientMock.mockReturnValue(makeSupabaseMock());
  });

  it("clears public and admin cache surfaces with MFA and audit logging", async () => {
    const { clearAdminCache } = await import("./actions");

    const result = await clearAdminCache();

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(revalidateTagMock).toHaveBeenCalledWith("ads", "max");
    expect(revalidateTagMock).toHaveBeenCalledWith("ads:featured-cars", "max");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/vysledky");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "clear_admin_cache",
        target_type: "system",
        target_id: "cache",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining("Cache"),
      }),
    );
  });

  it("syncs the Algolia search index through the protected server endpoint", async () => {
    vi.stubEnv("ALGOLIA_SYNC_SECRET", "sync-secret");
    fetchMock.mockResolvedValue(
      makeJsonResponse({ success: true, count: 57, taskIDs: [123] }),
    );
    const { syncAdminSearchIndex } = await import("./actions");

    const result = await syncAdminSearchIndex();

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.autobazar123.sk/api/algolia/sync",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer sync-secret",
        }),
      }),
    );
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "sync_search_index",
        target_type: "system",
        target_id: "algolia",
        details: expect.objectContaining({ count: 57 }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        count: 57,
        message: expect.stringContaining("57"),
      }),
    );
  });

  it("runs one known cron job manually through the protected cron route", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    fetchMock.mockResolvedValue(
      makeJsonResponse({ ok: true, processed: 3, failed: 0 }),
    );
    const { runAdminCronJob } = await import("./actions");

    const result = await runAdminCronJob("process-email-jobs");

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.autobazar123.sk/api/cron/process-email-jobs",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "x-cron-secret": "cron-secret",
        }),
      }),
    );
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "run_cron_job",
        target_type: "system",
        target_id: "process-email-jobs",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        jobId: "process-email-jobs",
        label: "Odoslanie čakajúcich e-mailov",
      }),
    );
  });
});
