"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Skeleton } from "@/components/ui/shadcn/skeleton";

interface WebappAuditSummary {
  startedAt: string;
  finishedAt: string;
  baseUrl: string;
  routeCount: number;
  failingRoutes: number;
  totalConsoleWarningsAndErrors: number;
  totalNetworkFailures: number;
  totalDevtoolsIssues: number;
  avgNavDurationMs: number;
}

interface GithubRunSummary {
  id: number;
  event: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface GithubWorkflowStatus {
  workflowFile: string;
  latestRun: GithubRunSummary | null;
  latestScheduledRun: GithubRunSummary | null;
  error: string | null;
}

interface QualityGateAlertSummary {
  fingerprint: string;
  workflowFile: string;
  repository: string;
  branch: string;
  state: "failure" | "recovered";
  level: string;
  conclusion: string;
  runId: number | null;
  runUrl: string | null;
  createdAt: string;
  source: "event_log" | "github_live";
}

interface QualityGatesResponse {
  generatedAt: string;
  webappAudit: WebappAuditSummary | null;
  githubRepository: string | null;
  githubWorkflows: GithubWorkflowStatus[];
  activeQualityAlerts: QualityGateAlertSummary[];
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("sk-SK");
}

function getRunStatusLabel(workflow: GithubWorkflowStatus): string {
  const run = workflow.latestScheduledRun || workflow.latestRun;
  if (workflow.error) {
    return "error";
  }
  if (!run) {
    return "unknown";
  }
  return run.conclusion ?? run.status;
}

function getRunStatusPillClass(status: string): string {
  if (status === "success") {
    return "bg-success/10 text-success";
  }
  if (status === "in_progress" || status === "queued") {
    return "bg-accent/10 text-accent";
  }
  if (status === "unknown") {
    return "bg-surface text-text-secondary";
  }
  return "bg-warning/10 text-warning";
}

function getAlertSourceLabel(source: "event_log" | "github_live"): string {
  return source === "event_log" ? "Webhook" : "GitHub live";
}

export function AdminQualityGates() {
  const [data, setData] = useState<QualityGatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/quality-gates", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Nemáte oprávnenie zobraziť quality gate dáta.");
        }
        throw new Error("Načítavanie quality gate dát zlyhalo.");
      }

      const payload = (await response.json()) as QualityGatesResponse;
      setData(payload);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Načítavanie quality gate dát zlyhalo.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = data?.webappAudit;
  const isPassing = summary ? summary.failingRoutes === 0 : null;
  const githubWorkflows = data?.githubWorkflows || [];
  const activeAlerts = data?.activeQualityAlerts || [];

  return (
    <Card>
      <CardHeader className="border-b border-border-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Quality Gates</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Nightly quality and accessibility monitoring in one admin panel.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void loadData();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div
            className={`rounded-xl border p-4 ${
              activeAlerts.length > 0
                ? "border-error/30 bg-error/10"
                : "border-success/30 bg-success/10"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                className={`text-sm font-semibold ${
                  activeAlerts.length > 0 ? "text-error" : "text-success"
                }`}
              >
                {activeAlerts.length > 0
                  ? `Active quality alerts: ${activeAlerts.length}`
                  : "No active quality alerts"}
              </p>
              {data?.generatedAt ? (
                <p className="text-xs text-text-secondary">
                  Updated: {formatTimestamp(data.generatedAt)}
                </p>
              ) : null}
            </div>

            {activeAlerts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.fingerprint}
                    className="rounded-lg border border-error/20 bg-background p-3 text-sm"
                  >
                    <p className="font-medium text-text-primary">
                      {alert.workflowFile} ({alert.branch})
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {alert.repository} | {alert.conclusion} |{" "}
                      {formatTimestamp(alert.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Source: {getAlertSourceLabel(alert.source)}
                    </p>
                    {alert.runUrl ? (
                      <a
                        href={alert.runUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-accent hover:text-accent-hover"
                      >
                        Open failed run
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {!loading && !error && !summary ? (
          <div className="rounded-xl border border-border-subtle bg-background-secondary p-4 text-sm text-text-secondary">
            No local webapp audit file found. Run <code>npm run audit:webapp</code> and refresh.
          </div>
        ) : null}

        {!loading && !error && summary ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isPassing ? "bg-success/10 text-success" : "bg-error/10 text-error"
                }`}
              >
                {isPassing ? "Pass" : "Fail"}
              </span>
              <span className="text-sm text-text-secondary">
                {summary.failingRoutes}/{summary.routeCount} failing routes
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Failing routes</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {summary.failingRoutes}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Console issues</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {summary.totalConsoleWarningsAndErrors}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Network failures</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {summary.totalNetworkFailures}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Avg nav (ms)</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {summary.avgNavDurationMs}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-background-secondary p-4 text-sm text-text-secondary">
              <p>
                Last audit finished:{" "}
                <span className="font-medium text-text-primary">
                  {formatTimestamp(summary.finishedAt)}
                </span>
              </p>
              <p className="mt-1">
                Audit started:{" "}
                <span className="font-medium text-text-primary">
                  {formatTimestamp(summary.startedAt)}
                </span>
              </p>
              <p className="mt-1">
                Source: <span className="font-mono text-xs">{summary.baseUrl}</span>
              </p>
            </div>
          </div>
        ) : null}

        {!loading && !error && data?.githubRepository ? (
          <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-text-primary">Nightly CI (GitHub)</p>
              <p className="text-xs text-text-muted">Repo: {data.githubRepository}</p>
            </div>
            <div className="space-y-3">
              {githubWorkflows.map((workflow) => {
                const run = workflow.latestScheduledRun || workflow.latestRun;
                const status = getRunStatusLabel(workflow);

                return (
                  <div
                    key={workflow.workflowFile}
                    className="rounded-lg border border-border-subtle bg-background p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary">
                        {workflow.workflowFile}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRunStatusPillClass(
                          status,
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                    {workflow.error ? (
                      <p className="mt-1 text-xs text-error">{workflow.error}</p>
                    ) : null}
                    {run ? (
                      <div className="mt-2 text-xs text-text-secondary">
                        <p>
                          Run: #{run.id} ({run.event})
                        </p>
                        <p>Updated: {formatTimestamp(run.updatedAt)}</p>
                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-accent hover:text-accent-hover"
                        >
                          Open run details
                        </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted">
                        No workflow run data found yet.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
