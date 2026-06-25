import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _internal } from "./route-internals";

const isCurrentUserSiteAdminMock = vi.fn();

vi.mock("@/lib/auth/site-admin", () => ({
  isCurrentUserSiteAdmin: () => isCurrentUserSiteAdminMock(),
}));

describe("admin quality gates parser", () => {
  it("parses valid webapp audit summary payload", () => {
    const parsed = _internal.parseWebappAuditSummary({
      summary: {
        startedAt: "2026-03-04T10:00:00.000Z",
        finishedAt: "2026-03-04T10:05:00.000Z",
        baseUrl: "http://localhost:3000",
        routeCount: 76,
        failingRoutes: 0,
        totalConsoleWarningsAndErrors: 0,
        totalNetworkFailures: 0,
        totalDevtoolsIssues: 0,
        avgNavDurationMs: 1200,
      },
    });

    expect(parsed).toEqual({
      startedAt: "2026-03-04T10:00:00.000Z",
      finishedAt: "2026-03-04T10:05:00.000Z",
      baseUrl: "http://localhost:3000",
      routeCount: 76,
      failingRoutes: 0,
      totalConsoleWarningsAndErrors: 0,
      totalNetworkFailures: 0,
      totalDevtoolsIssues: 0,
      avgNavDurationMs: 1200,
    });
  });

  it("returns null for malformed payload", () => {
    expect(
      _internal.parseWebappAuditSummary({
        summary: { finishedAt: "2026-03-04T10:05:00.000Z" },
      }),
    ).toBeNull();
  });

  it("parses quality gate failure log rows", () => {
    const parsed = _internal.parseQualityGateAlertLog({
      level: "error",
      message: "quality_gate_failure",
      request_id: "quality-gate:owner/repo:accessibility-quality-gate.yml:main",
      created_at: "2026-03-04T02:15:00.000Z",
      metadata: {
        workflowFile: "accessibility-quality-gate.yml",
        repository: "owner/repo",
        branch: "main",
        conclusion: "failure",
        runId: 1234,
        runUrl: "https://github.com/owner/repo/actions/runs/1234",
      },
    });

    expect(parsed).toEqual({
      fingerprint: "quality-gate:owner/repo:accessibility-quality-gate.yml:main",
      workflowFile: "accessibility-quality-gate.yml",
      repository: "owner/repo",
      branch: "main",
      state: "failure",
      level: "error",
      conclusion: "failure",
      runId: 1234,
      runUrl: "https://github.com/owner/repo/actions/runs/1234",
      createdAt: "2026-03-04T02:15:00.000Z",
      source: "event_log",
    });
  });

  it("returns only active alerts after collapse", () => {
    const active = _internal.collapseActiveQualityAlerts([
      {
        level: "error",
        message: "quality_gate_failure",
        request_id: "quality-gate:owner/repo:accessibility-quality-gate.yml:main",
        created_at: "2026-03-04T02:15:00.000Z",
        metadata: {
          workflowFile: "accessibility-quality-gate.yml",
          repository: "owner/repo",
          branch: "main",
          conclusion: "failure",
        },
      },
      {
        level: "info",
        message: "quality_gate_recovered",
        request_id: "quality-gate:owner/repo:accessibility-quality-gate.yml:main",
        created_at: "2026-03-04T03:15:00.000Z",
        metadata: {
          workflowFile: "accessibility-quality-gate.yml",
          repository: "owner/repo",
          branch: "main",
          conclusion: "success",
        },
      },
      {
        level: "error",
        message: "quality_gate_failure",
        request_id: "quality-gate:owner/repo:performance-budget-gate.yml:main",
        created_at: "2026-03-04T03:30:00.000Z",
        metadata: {
          workflowFile: "performance-budget-gate.yml",
          repository: "owner/repo",
          branch: "main",
          conclusion: "failure",
        },
      },
    ]);

    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({
      workflowFile: "performance-budget-gate.yml",
      state: "failure",
    });
  });

  it("derives active alerts from live github workflow statuses", () => {
    const derived = _internal.deriveLiveActiveQualityAlerts("owner/repo", [
      {
        workflowFile: "accessibility-quality-gate.yml",
        latestRun: {
          id: 40,
          event: "schedule",
          status: "completed",
          conclusion: "failure",
          headBranch: "main",
          htmlUrl: "https://github.com/owner/repo/actions/runs/40",
          createdAt: "2026-03-04T02:00:00.000Z",
          updatedAt: "2026-03-04T02:10:00.000Z",
        },
        latestScheduledRun: null,
        error: null,
      },
      {
        workflowFile: "performance-budget-gate.yml",
        latestRun: {
          id: 41,
          event: "schedule",
          status: "completed",
          conclusion: "success",
          headBranch: "main",
          htmlUrl: "https://github.com/owner/repo/actions/runs/41",
          createdAt: "2026-03-04T03:00:00.000Z",
          updatedAt: "2026-03-04T03:10:00.000Z",
        },
        latestScheduledRun: null,
        error: null,
      },
    ]);

    expect(derived).toHaveLength(1);
    expect(derived[0]).toMatchObject({
      workflowFile: "accessibility-quality-gate.yml",
      source: "github_live",
      state: "failure",
      runId: 40,
    });
  });

  it("prefers event-log alerts when merging with github live fallback", () => {
    const merged = _internal.mergeActiveQualityAlerts(
      [
        {
          fingerprint: "quality-gate:owner/repo:accessibility-quality-gate.yml:main",
          workflowFile: "accessibility-quality-gate.yml",
          repository: "owner/repo",
          branch: "main",
          state: "failure",
          level: "error",
          conclusion: "failure",
          runId: 900,
          runUrl: "https://github.com/owner/repo/actions/runs/900",
          createdAt: "2026-03-04T02:15:00.000Z",
          source: "event_log",
        },
      ],
      [
        {
          fingerprint: "quality-gate:owner/repo:accessibility-quality-gate.yml:main",
          workflowFile: "accessibility-quality-gate.yml",
          repository: "owner/repo",
          branch: "main",
          state: "failure",
          level: "error",
          conclusion: "failure",
          runId: 901,
          runUrl: "https://github.com/owner/repo/actions/runs/901",
          createdAt: "2026-03-04T03:15:00.000Z",
          source: "github_live",
        },
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      source: "event_log",
      runId: 900,
    });
  });

  it("resolves repository from Vercel git metadata when explicit GitHub env is absent", () => {
    expect(
      _internal.resolveGithubRepository({
        VERCEL_GIT_REPO_OWNER: "kyranxx",
        VERCEL_GIT_REPO_SLUG: "autobazar123",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("kyranxx/autobazar123");
  });

  it("resolves dispatch config from explicit repository, token, and ref", () => {
    expect(
      _internal.resolveQualityGateDispatchConfig({
        GITHUB_REPOSITORY: "owner/repo",
        QUALITY_GATE_DISPATCH_TOKEN: "ghp_test",
        QUALITY_GATE_DISPATCH_REF: "master",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({
      ok: true,
      repository: "owner/repo",
      token: "ghp_test",
      ref: "master",
      workflows: [
        "accessibility-quality-gate.yml",
        "performance-budget-gate.yml",
      ],
    });
  });

  it("explains missing GitHub dispatch configuration", () => {
    expect(
      _internal.resolveQualityGateDispatchConfig({
        GITHUB_REPOSITORY: "owner/repo",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({
      ok: false,
      error:
        "GitHub token na spustenie kontrol nie je nastavený.",
    });
  });

  it("summarizes quality gate setup for the admin UI", () => {
    expect(
      _internal.resolveQualityGateAdminStatus({
        GITHUB_REPOSITORY: "owner/repo",
        QUALITY_GATE_DISPATCH_TOKEN: "ghp_test",
        QUALITY_GATE_DISPATCH_REF: "master",
        QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES: "owner/repo",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({
      repository: "owner/repo",
      manualRunAvailable: true,
      manualRunRef: "master",
      manualRunError: null,
      alertIngestAvailable: true,
    });

    expect(
      _internal.resolveQualityGateAdminStatus({
        GITHUB_REPOSITORY: "owner/repo",
      } as unknown as NodeJS.ProcessEnv),
    ).toMatchObject({
      repository: "owner/repo",
      manualRunAvailable: false,
      manualRunRef: null,
      manualRunError: "GitHub token na spustenie kontrol nie je nastavený.",
      alertIngestAvailable: false,
    });
  });
});

describe("admin quality gates route actions", () => {
  const originalEnv = process.env;
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn().mockResolvedValue({}),
    });
    isCurrentUserSiteAdminMock.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  it("rejects manual quality-gate runs for non-admin users", async () => {
    isCurrentUserSiteAdminMock.mockResolvedValue(false);
    const { POST } = await import("./route");

    const response = await POST();

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("dispatches configured GitHub quality workflows for admins", async () => {
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.QUALITY_GATE_DISPATCH_TOKEN = "ghp_test";
    process.env.QUALITY_GATE_DISPATCH_REF = "master";
    const { POST } = await import("./route");

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      repository: "owner/repo",
      ref: "master",
      workflows: [
        {
          workflowFile: "accessibility-quality-gate.yml",
          status: "queued",
        },
        {
          workflowFile: "performance-budget-gate.yml",
          status: "queued",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/actions/workflows/accessibility-quality-gate.yml/dispatches",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ref: "master" }),
      }),
    );
  });
});
