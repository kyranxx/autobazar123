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

export const QUALITY_GATE_WORKFLOWS = [
  "accessibility-quality-gate.yml",
  "performance-budget-gate.yml",
] as const;

type QualityGateDispatchConfig =
  | {
      ok: true;
      repository: string;
      token: string;
      ref: string;
      workflows: string[];
    }
  | {
      ok: false;
      error: string;
    };

interface QualityGateAdminStatus {
  repository: string | null;
  manualRunAvailable: boolean;
  manualRunRef: string | null;
  manualRunError: string | null;
  alertIngestAvailable: boolean;
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

function toAlertFingerprint(repository: string, workflowFile: string, branch: string): string {
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

export function parseWebappAuditSummary(raw: unknown): WebappAuditSummary | null {
  const record = toRecord(raw);
  const summary = record ? toRecord(record.summary) : null;
  if (!summary) return null;

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
  if (message === "quality_gate_failure") return "failure";
  if (message === "quality_gate_recovered") return "recovered";
  return null;
}

export function parseQualityGateAlertLog(raw: unknown): QualityGateAlertSummary | null {
  const log = toRecord(raw);
  if (!log) return null;

  const message = toString(log.message);
  const state = message ? toAlertStateFromMessage(message) : null;
  const fingerprint = toString(log.request_id);
  const level = toString(log.level);
  const createdAt = toString(log.created_at);
  const metadata = toRecord(log.metadata);

  if (!state || !fingerprint || !level || !createdAt || !metadata) return null;

  const workflowFile = toString(metadata.workflowFile) ?? toString(metadata.workflow);
  const repository = toString(metadata.repository);
  if (!workflowFile || !repository) return null;

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

export function collapseActiveQualityAlerts(rawLogs: unknown[]): QualityGateAlertSummary[] {
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

export function deriveLiveActiveQualityAlerts(
  repository: string,
  workflows: GithubWorkflowStatus[],
): QualityGateAlertSummary[] {
  const results: QualityGateAlertSummary[] = [];
  for (const workflow of workflows) {
    const run = workflow.latestScheduledRun ?? workflow.latestRun;
    if (!run) continue;
    if (!run.conclusion && ["in_progress", "queued", "requested"].includes(run.status)) {
      continue;
    }

    const conclusion = (run.conclusion ?? run.status).toLowerCase();
    if (!isActiveFailureConclusion(conclusion)) continue;

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

export function mergeActiveQualityAlerts(
  primary: QualityGateAlertSummary[],
  fallback: QualityGateAlertSummary[],
): QualityGateAlertSummary[] {
  const byFingerprint = new Map<string, QualityGateAlertSummary>();
  for (const alert of primary) byFingerprint.set(alert.fingerprint, alert);
  for (const alert of fallback) {
    if (!byFingerprint.has(alert.fingerprint)) byFingerprint.set(alert.fingerprint, alert);
  }
  return Array.from(byFingerprint.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function resolveGithubRepository(env: NodeJS.ProcessEnv = process.env): string | null {
  const fromRepo =
    env.GITHUB_REPOSITORY ??
    env.GITHUB_REPO ??
    env.NEXT_PUBLIC_GITHUB_REPOSITORY ??
    (env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_SLUG
      ? `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}`
      : null);

  if (!fromRepo) return null;

  const normalized = fromRepo.trim().replace(/^https?:\/\/github\.com\//, "");
  return /^[^/\s]+\/[^/\s]+$/.test(normalized) ? normalized : null;
}

export function resolveQualityGateDispatchConfig(
  env: NodeJS.ProcessEnv = process.env,
): QualityGateDispatchConfig {
  const repository = resolveGithubRepository(env);
  if (!repository) {
    return {
      ok: false,
      error: "GitHub repozitár pre kontroly nie je nastavený.",
    };
  }

  const token =
    env.QUALITY_GATE_DISPATCH_TOKEN?.trim() ||
    env.GITHUB_TOKEN?.trim() ||
    "";
  if (!token) {
    return {
      ok: false,
      error: "GitHub token na spustenie kontrol nie je nastavený.",
    };
  }

  const ref =
    env.QUALITY_GATE_DISPATCH_REF?.trim() ||
    env.VERCEL_GIT_COMMIT_REF?.trim() ||
    env.GITHUB_REF_NAME?.trim() ||
    "master";

  return {
    ok: true,
    repository,
    token,
    ref,
    workflows: [...QUALITY_GATE_WORKFLOWS],
  };
}

export function resolveQualityGateAdminStatus(
  env: NodeJS.ProcessEnv = process.env,
): QualityGateAdminStatus {
  const dispatchConfig = resolveQualityGateDispatchConfig(env);
  const alertIngestAvailable = Boolean(
    env.QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES?.trim() ||
      env.QUALITY_GATE_ALERT_SECRET?.trim() ||
      env.CRON_SECRET?.trim(),
  );

  if (!dispatchConfig.ok) {
    return {
      repository: resolveGithubRepository(env),
      manualRunAvailable: false,
      manualRunRef: null,
      manualRunError: dispatchConfig.error,
      alertIngestAvailable,
    };
  }

  return {
    repository: dispatchConfig.repository,
    manualRunAvailable: true,
    manualRunRef: dispatchConfig.ref,
    manualRunError: null,
    alertIngestAvailable,
  };
}

export const _internal = {
  parseWebappAuditSummary,
  parseQualityGateAlertLog,
  collapseActiveQualityAlerts,
  deriveLiveActiveQualityAlerts,
  mergeActiveQualityAlerts,
  resolveGithubRepository,
  resolveQualityGateDispatchConfig,
  resolveQualityGateAdminStatus,
};
