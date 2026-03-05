import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type QualityGateAlertState = "failure" | "recovered";
type QualityGateAlertSource = "event_log" | "github_live";

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

interface QualityGatesPayload {
  generatedAt: string;
  webappAudit: WebappAuditSummary | null;
  githubRepository: string | null;
  githubWorkflows: GithubWorkflowStatus[];
  activeQualityAlerts: QualityGateAlertSummary[];
}

interface GithubRunSummary {
  id: number;
  event: string;
  status: string;
  conclusion: string | null;
  headBranch: string;
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
  state: QualityGateAlertState;
  level: string;
  conclusion: string;
  runId: number | null;
  runUrl: string | null;
  createdAt: string;
  source: QualityGateAlertSource;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function toAlertFingerprint(
  repository: string,
  workflowFile: string,
  branch: string,
): string {
  return `quality-gate:${repository}:${workflowFile}:${branch}`;
}

function toAlertLevelFromConclusion(conclusion: string): string {
  if (conclusion === "cancelled" || conclusion === "neutral" || conclusion === "skipped") {
    return "warn";
  }
  return "error";
}

function isActiveFailureConclusion(conclusion: string): boolean {
  const normalized = conclusion.trim().toLowerCase();
  return [
    "failure",
    "timed_out",
    "cancelled",
    "action_required",
    "stale",
    "startup_failure",
  ].includes(normalized);
}

function parseWebappAuditSummary(raw: unknown): WebappAuditSummary | null {
  const record = toRecord(raw);
  if (!record) {
    return null;
  }

  const summary = toRecord(record.summary);
  if (!summary) {
    return null;
  }

  const startedAt = toString(summary.startedAt);
  const finishedAt = toString(summary.finishedAt);
  const baseUrl = toString(summary.baseUrl);
  const routeCount = toNumber(summary.routeCount);
  const failingRoutes = toNumber(summary.failingRoutes);
  const totalConsoleWarningsAndErrors = toNumber(summary.totalConsoleWarningsAndErrors);
  const totalNetworkFailures = toNumber(summary.totalNetworkFailures);
  const totalDevtoolsIssues = toNumber(summary.totalDevtoolsIssues);
  const avgNavDurationMs = toNumber(summary.avgNavDurationMs);

  if (
    !startedAt ||
    !finishedAt ||
    !baseUrl ||
    routeCount === null ||
    failingRoutes === null ||
    totalConsoleWarningsAndErrors === null ||
    totalNetworkFailures === null ||
    totalDevtoolsIssues === null ||
    avgNavDurationMs === null
  ) {
    return null;
  }

  return {
    startedAt,
    finishedAt,
    baseUrl,
    routeCount,
    failingRoutes,
    totalConsoleWarningsAndErrors,
    totalNetworkFailures,
    totalDevtoolsIssues,
    avgNavDurationMs,
  };
}

function toAlertStateFromMessage(message: string): QualityGateAlertState | null {
  if (message === "quality_gate_failure") {
    return "failure";
  }
  if (message === "quality_gate_recovered") {
    return "recovered";
  }
  return null;
}

function parseQualityGateAlertLog(raw: unknown): QualityGateAlertSummary | null {
  const log = toRecord(raw);
  if (!log) {
    return null;
  }

  const message = toString(log.message);
  const state = message ? toAlertStateFromMessage(message) : null;
  const fingerprint = toString(log.request_id);
  const level = toString(log.level);
  const createdAt = toString(log.created_at);
  const metadata = toRecord(log.metadata);

  if (!state || !fingerprint || !level || !createdAt || !metadata) {
    return null;
  }

  const workflowFile = toString(metadata.workflowFile) ?? toString(metadata.workflow);
  const repository = toString(metadata.repository);
  if (!workflowFile || !repository) {
    return null;
  }

  const branch = toString(metadata.branch) ?? "main";
  const conclusion =
    toString(metadata.conclusion) ?? (state === "failure" ? "failure" : "success");

  return {
    fingerprint,
    workflowFile,
    repository,
    branch,
    state,
    level,
    conclusion,
    runId: toNumber(metadata.runId),
    runUrl: toString(metadata.runUrl),
    createdAt,
    source: "event_log",
  };
}

function collapseActiveQualityAlerts(rawLogs: unknown[]): QualityGateAlertSummary[] {
  const parsedLogs = rawLogs
    .map((rawLog) => parseQualityGateAlertLog(rawLog))
    .filter((entry): entry is QualityGateAlertSummary => Boolean(entry))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const latestByFingerprint = new Map<string, QualityGateAlertSummary>();

  for (const parsed of parsedLogs) {
    if (!latestByFingerprint.has(parsed.fingerprint)) {
      latestByFingerprint.set(parsed.fingerprint, parsed);
    }
  }

  return Array.from(latestByFingerprint.values())
    .filter((entry) => entry.state === "failure")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function deriveLiveActiveQualityAlerts(
  repository: string,
  workflows: GithubWorkflowStatus[],
): QualityGateAlertSummary[] {
  const results: QualityGateAlertSummary[] = [];

  for (const workflow of workflows) {
    const run = workflow.latestScheduledRun ?? workflow.latestRun;
    if (!run) {
      continue;
    }

    // Skip runs that are still in progress and have no final conclusion yet.
    if (!run.conclusion && ["in_progress", "queued", "requested"].includes(run.status)) {
      continue;
    }

    const conclusion = (run.conclusion ?? run.status).toLowerCase();
    if (!isActiveFailureConclusion(conclusion)) {
      continue;
    }

    const branch = run.headBranch || "main";
    results.push({
      fingerprint: toAlertFingerprint(repository, workflow.workflowFile, branch),
      workflowFile: workflow.workflowFile,
      repository,
      branch,
      state: "failure",
      level: toAlertLevelFromConclusion(conclusion),
      conclusion,
      runId: run.id,
      runUrl: run.htmlUrl,
      createdAt: run.updatedAt,
      source: "github_live",
    });
  }

  return results.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function mergeActiveQualityAlerts(
  primary: QualityGateAlertSummary[],
  fallback: QualityGateAlertSummary[],
): QualityGateAlertSummary[] {
  const byFingerprint = new Map<string, QualityGateAlertSummary>();

  for (const alert of primary) {
    byFingerprint.set(alert.fingerprint, alert);
  }

  for (const alert of fallback) {
    if (!byFingerprint.has(alert.fingerprint)) {
      byFingerprint.set(alert.fingerprint, alert);
    }
  }

  return Array.from(byFingerprint.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

async function readWebappAuditSummary(): Promise<WebappAuditSummary | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "output",
      "playwright",
      "webapp-audit.json",
    );
    const content = await fs.readFile(filePath, "utf8");
    return parseWebappAuditSummary(JSON.parse(content) as unknown);
  } catch {
    return null;
  }
}

async function fetchActiveQualityAlerts(
  adminClient: SupabaseClient,
): Promise<QualityGateAlertSummary[]> {
  try {
    const { data, error } = await adminClient
      .from("system_logs")
      .select("level, message, request_id, metadata, created_at")
      .eq("category", "system")
      .in("message", ["quality_gate_failure", "quality_gate_recovered"])
      .like("request_id", "quality-gate:%")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return [];
    }

    return collapseActiveQualityAlerts(data as unknown[]);
  } catch {
    return [];
  }
}

function resolveGithubRepository(): string | null {
  const fromRepo =
    process.env.GITHUB_REPOSITORY ??
    process.env.GITHUB_REPO ??
    process.env.NEXT_PUBLIC_GITHUB_REPOSITORY;

  if (!fromRepo) {
    return null;
  }

  const normalized = fromRepo.trim().replace(/^https?:\/\/github\.com\//, "");
  if (!/^[^/\s]+\/[^/\s]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function toGithubRunSummary(raw: unknown): GithubRunSummary | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const id = toNumber(item.id);
  const event = toString(item.event);
  const status = toString(item.status);
  const conclusion = item.conclusion === null ? null : toString(item.conclusion);
  const headBranch = toString(item.head_branch) ?? "main";
  const htmlUrl = toString(item.html_url);
  const createdAt = toString(item.created_at);
  const updatedAt = toString(item.updated_at);

  if (
    id === null ||
    !event ||
    !status ||
    conclusion === undefined ||
    !htmlUrl ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    event,
    status,
    conclusion,
    headBranch,
    htmlUrl,
    createdAt,
    updatedAt,
  };
}

async function fetchGithubWorkflowStatus(
  repository: string,
  workflowFile: string,
): Promise<GithubWorkflowStatus> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  const githubToken = process.env.GITHUB_TOKEN?.trim();
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  try {
    const url = `https://api.github.com/repos/${repository}/actions/workflows/${encodeURIComponent(workflowFile)}/runs?per_page=6`;
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        workflowFile,
        latestRun: null,
        latestScheduledRun: null,
        error: `GitHub API ${response.status}`,
      };
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const rawRuns = Array.isArray(payload.workflow_runs) ? payload.workflow_runs : [];
    const runs = rawRuns
      .map((entry) => toGithubRunSummary(entry))
      .filter((entry): entry is GithubRunSummary => Boolean(entry));

    const latestRun = runs[0] ?? null;
    const latestScheduledRun = runs.find((entry) => entry.event === "schedule") ?? null;

    return {
      workflowFile,
      latestRun,
      latestScheduledRun,
      error: null,
    };
  } catch {
    return {
      workflowFile,
      latestRun: null,
      latestScheduledRun: null,
      error: "GitHub API unavailable",
    };
  }
}

async function isAdminRequest(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return false;
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey);
    const { data: adminRow } = await adminClient
      .from("site_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    return Boolean(adminRow);
  } catch {
    return false;
  }
}

export async function GET(): Promise<NextResponse<QualityGatesPayload | { error: string }>> {
  const isAdmin = await isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const webappAudit = await readWebappAuditSummary();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient =
    supabaseUrl && serviceRoleKey
      ? createSupabaseClient(supabaseUrl, serviceRoleKey)
      : null;

  const eventLogActiveAlerts = adminClient
    ? await fetchActiveQualityAlerts(adminClient)
    : [];

  const githubRepository = resolveGithubRepository();
  const githubWorkflows = githubRepository
    ? await Promise.all([
        fetchGithubWorkflowStatus(githubRepository, "accessibility-quality-gate.yml"),
        fetchGithubWorkflowStatus(githubRepository, "performance-budget-gate.yml"),
      ])
    : [];

  const liveGithubAlerts = githubRepository
    ? deriveLiveActiveQualityAlerts(githubRepository, githubWorkflows)
    : [];

  const activeQualityAlerts = mergeActiveQualityAlerts(
    eventLogActiveAlerts,
    liveGithubAlerts,
  );

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    webappAudit,
    githubRepository,
    githubWorkflows,
    activeQualityAlerts,
  });
}

export const _internal = {
  parseWebappAuditSummary,
  parseQualityGateAlertLog,
  collapseActiveQualityAlerts,
  deriveLiveActiveQualityAlerts,
  mergeActiveQualityAlerts,
};
