import { describe, expect, it } from "vitest";
import { _internal } from "./route-internals";

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
});
