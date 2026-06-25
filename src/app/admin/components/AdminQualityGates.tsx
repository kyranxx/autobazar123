"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
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

interface QualityGateConfiguration {
  repository: string | null;
  manualRunAvailable: boolean;
  manualRunRef: string | null;
  manualRunError: string | null;
  alertIngestAvailable: boolean;
}

interface QualityGatesResponse {
  generatedAt: string;
  webappAudit: WebappAuditSummary | null;
  githubRepository: string | null;
  githubWorkflows: GithubWorkflowStatus[];
  activeQualityAlerts: QualityGateAlertSummary[];
  configuration: QualityGateConfiguration;
}

interface QualityGateDispatchResponse {
  ok: boolean;
  repository: string;
  ref: string;
  workflows: Array<{
    workflowFile: string;
    status: "queued" | "failed";
    error: string | null;
  }>;
}

type AdminQualityGatesLocale = "sk" | "en";

type QualityCheckCopy = {
  workflowFile: string;
  title: string;
  description: string;
  cadence: string;
};

type AdminQualityGatesCopy = {
  title: string;
  subtitle: string;
  refreshStatus: string;
  runChecksNow: string;
  explanationTitle: string;
  explanationText: string;
  checkedLabel: string;
  emailTitle: string;
  emailText: string;
  setupTitle: string;
  nightlyChecks: string;
  nightlyChecksHelp: string;
  nightlyChecksReady: string;
  manualRunTitle: string;
  manualRunHelp: string;
  manualRunReady: string;
  manualRunMissing: string;
  manualRunUnavailable: string;
  adminAlerts: string;
  adminAlertsHelp: string;
  adminAlertsReady: string;
  adminAlertsMissing: string;
  openGithubChecks: string;
  forbiddenError: string;
  loadError: string;
  runError: string;
  runSuccess: string;
  runFailedPrefix: string;
  activeIssues: (count: number) => string;
  noActiveIssues: string;
  updatedAt: string;
  sourceLabel: string;
  openFailedRun: string;
  localAuditMissing: string;
  ok: string;
  issue: string;
  failingPagesSummary: (failingRoutes: number, routeCount: number) => string;
  metricFailingPages: string;
  metricConsole: string;
  metricNetwork: string;
  metricAverageLoad: string;
  lastCheck: string;
  startedAt: string;
  address: string;
  automatedChecksTitle: string;
  repoLabel: string;
  runLabel: string;
  nightlyRun: string;
  manualRun: string;
  runUpdatedAt: string;
  openRunDetails: string;
  noRunData: string;
  fallbackWorkflowTitle: string;
  statusLabels: Record<string, string>;
  alertSources: Record<QualityGateAlertSummary["source"], string>;
  qualityChecks: readonly QualityCheckCopy[];
};

function getAdminQualityGatesLocale(locale: string): AdminQualityGatesLocale {
  return locale === "en" ? "en" : "sk";
}

function buildWorkflowFile(parts: string[]): string {
  return `${parts.join("-")}.yml`;
}

const ADMIN_QUALITY_GATES_COPY: Record<AdminQualityGatesLocale, AdminQualityGatesCopy> = {
  sk: {
    title: "Kontroly webu",
    subtitle: "Stav webu, nočné kontroly a chyby, ktoré treba riešiť.",
    refreshStatus: "Obnoviť stav",
    runChecksNow: "Spustiť kontroly",
    explanationTitle: "Čo tu vidíte",
    explanationText:
      "Červené znamená problém na webe alebo v automatickej kontrole. Tlačidlo spustí kontroly ručne; výsledok príde až po ich dobehnutí.",
    checkedLabel: "Čo sa kontroluje",
    emailTitle: "Email upozornenie",
    emailText:
      "Keď nočná kontrola padne, GitHub vie poslať e-mail ľuďom, ktorí sledujú repozitár. Web zároveň zapíše problém sem do adminu. Detaily chyby otvoríš v GitHube. Email príde z GitHubu, nie z Resendu.",
    setupTitle: "Stav nastavenia",
    nightlyChecks: "Nočné kontroly",
    nightlyChecksHelp: "GitHub ich spúšťa automaticky každý deň.",
    nightlyChecksReady: "Beží v GitHube",
    manualRunTitle: "Ručné spustenie",
    manualRunHelp: "Toto tlačidlo funguje iba keď je nastavený GitHub token.",
    manualRunReady: "Pripravené",
    manualRunMissing: "Chýba GitHub token",
    manualRunUnavailable: "Ručné spustenie ešte nie je nastavené.",
    adminAlerts: "Upozornenia v admine",
    adminAlertsHelp: "Padnuté kontroly sa zapíšu do logov a zobrazia tu.",
    adminAlertsReady: "Zapnuté",
    adminAlertsMissing: "Treba nastaviť webhook",
    openGithubChecks: "Otvoriť GitHub kontroly",
    forbiddenError: "Nemáte oprávnenie zobraziť technické kontroly.",
    loadError: "Načítanie technických kontrol zlyhalo.",
    runError: "Kontroly sa nepodarilo spustiť.",
    runSuccess: "Kontroly sú spustené v GitHube. Výsledok sa ukáže po dobehnutí.",
    runFailedPrefix: "Nepodarilo sa spustiť",
    activeIssues: (count) => `Problémy: ${count}`,
    noActiveIssues: "Bez aktívnych problémov",
    updatedAt: "Aktualizované",
    sourceLabel: "Zdroj",
    openFailedRun: "Otvoriť chybný beh",
    localAuditMissing: "Lokálny audit sa zatiaľ nenašiel.",
    ok: "OK",
    issue: "Problém",
    failingPagesSummary: (failingRoutes, routeCount) =>
      `${failingRoutes}/${routeCount} chybných stránok`,
    metricFailingPages: "Chybné stránky",
    metricConsole: "Chyby v konzole",
    metricNetwork: "Chyby siete",
    metricAverageLoad: "Priemer načítania",
    lastCheck: "Posledná kontrola",
    startedAt: "Začiatok",
    address: "Adresa",
    automatedChecksTitle: "Automatické kontroly (GitHub)",
    repoLabel: "Repo",
    runLabel: "Beh",
    nightlyRun: "noc",
    manualRun: "ručne",
    runUpdatedAt: "Aktualizované",
    openRunDetails: "Otvoriť detail behu",
    noRunData: "Zatiaľ nie sú dostupné dáta behu.",
    fallbackWorkflowTitle: "Technická kontrola",
    statusLabels: {
      success: "OK",
      in_progress: "beží",
      queued: "čaká",
      unknown: "bez dát",
      failure: "problém",
      cancelled: "zastavené",
      error: "chyba",
    },
    alertSources: {
      event_log: "Webhook",
      github_live: "GitHub",
    },
    qualityChecks: [
      {
        workflowFile: buildWorkflowFile(["accessibility", "quality", "gate"]),
        title: "Prístupnosť a ovládanie",
        description:
          "Kontroluje mobil, klávesnicu, čítačku obrazovky a základné WCAG chyby.",
        cadence: "Beží každú noc",
      },
      {
        workflowFile: buildWorkflowFile(["performance", "budget", "gate"]),
        title: "Rýchlosť a rozbité stránky",
        description:
          "Kontroluje načítanie stránok, chyby v konzole, sieť a výkonnostné limity.",
        cadence: "Beží každú noc",
      },
    ],
  },
  en: {
    title: "Website checks",
    subtitle: "Website status, nightly checks, and issues that need attention.",
    refreshStatus: "Refresh status",
    runChecksNow: "Run checks now",
    explanationTitle: "What you see here",
    explanationText:
      "Red means an issue on the website or in an automatic check. The button starts checks manually; the result appears after GitHub finishes them.",
    checkedLabel: "What is checked",
    emailTitle: "Email alerts",
    emailText:
      "When a nightly check fails, GitHub can email people watching the repository. The website also writes the issue here in admin. The email comes from GitHub, not Resend.",
    setupTitle: "Setup status",
    nightlyChecks: "Nightly checks",
    nightlyChecksHelp: "GitHub runs them automatically every day.",
    nightlyChecksReady: "Runs in GitHub",
    manualRunTitle: "Manual run",
    manualRunHelp: "This button works only when a GitHub token is configured.",
    manualRunReady: "Ready",
    manualRunMissing: "GitHub token is missing",
    manualRunUnavailable: "Manual run is not configured yet.",
    adminAlerts: "Admin alerts",
    adminAlertsHelp: "Failed checks are written to logs and shown here.",
    adminAlertsReady: "Enabled",
    adminAlertsMissing: "Webhook setup needed",
    openGithubChecks: "Open GitHub checks",
    forbiddenError: "You do not have permission to view website checks.",
    loadError: "Loading website checks failed.",
    runError: "The checks could not be started.",
    runSuccess: "The checks were started in GitHub. The result appears after they finish.",
    runFailedPrefix: "Could not start",
    activeIssues: (count) => `Issues: ${count}`,
    noActiveIssues: "No active issues",
    updatedAt: "Updated",
    sourceLabel: "Source",
    openFailedRun: "Open failed run",
    localAuditMissing: "No local audit has been found yet.",
    ok: "OK",
    issue: "Issue",
    failingPagesSummary: (failingRoutes, routeCount) =>
      `${failingRoutes}/${routeCount} failing pages`,
    metricFailingPages: "Failing pages",
    metricConsole: "Console issues",
    metricNetwork: "Network failures",
    metricAverageLoad: "Average load",
    lastCheck: "Last check",
    startedAt: "Started",
    address: "Address",
    automatedChecksTitle: "Automatic checks (GitHub)",
    repoLabel: "Repo",
    runLabel: "Run",
    nightlyRun: "nightly",
    manualRun: "manual",
    runUpdatedAt: "Updated",
    openRunDetails: "Open run details",
    noRunData: "No run data is available yet.",
    fallbackWorkflowTitle: "Technical check",
    statusLabels: {
      success: "OK",
      in_progress: "running",
      queued: "queued",
      unknown: "no data",
      failure: "issue",
      cancelled: "stopped",
      error: "error",
    },
    alertSources: {
      event_log: "Webhook",
      github_live: "GitHub",
    },
    qualityChecks: [
      {
        workflowFile: buildWorkflowFile(["accessibility", "quality", "gate"]),
        title: "Accessibility and controls",
        description:
          "Checks mobile layout, keyboard use, screen-reader basics, and important WCAG issues.",
        cadence: "Runs every night",
      },
      {
        workflowFile: buildWorkflowFile(["performance", "budget", "gate"]),
        title: "Speed and broken pages",
        description:
          "Checks page loading, console issues, network failures, and performance limits.",
        cadence: "Runs every night",
      },
    ],
  },
};

function formatTimestamp(value: string, locale: AdminQualityGatesLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale === "en" ? "en-US" : "sk-SK");
}

function getQualityCheck(workflowFile: string, copy: AdminQualityGatesCopy) {
  return copy.qualityChecks.find((check) => check.workflowFile === workflowFile) ?? null;
}

function getWorkflowTitle(workflowFile: string, copy: AdminQualityGatesCopy): string {
  return getQualityCheck(workflowFile, copy)?.title ?? copy.fallbackWorkflowTitle;
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

function getRunStatusText(status: string, copy: AdminQualityGatesCopy): string {
  return copy.statusLabels[status] ?? status;
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

function getAlertSourceLabel(
  source: "event_log" | "github_live",
  copy: AdminQualityGatesCopy,
): string {
  return copy.alertSources[source];
}

function getFailedWorkflowList(
  workflows: QualityGateDispatchResponse["workflows"],
  copy: AdminQualityGatesCopy,
) {
  return workflows
    .map((workflow) => getWorkflowTitle(workflow.workflowFile, copy))
    .join(", ");
}

function SetupStatusItem({
  title,
  text,
  status,
  ready,
}: {
  title: string;
  text: string;
  status: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            ready ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-secondary">{text}</p>
    </div>
  );
}

export function AdminQualityGates() {
  const adminLocale = getAdminQualityGatesLocale(useLocale());
  const copy = ADMIN_QUALITY_GATES_COPY[adminLocale];
  const [data, setData] = useState<QualityGatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningChecks, setRunningChecks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
          throw new Error(copy.forbiddenError);
        }
        throw new Error(copy.loadError);
      }

      const payload = (await response.json()) as QualityGatesResponse;
      setData(payload);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : copy.loadError;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [copy.forbiddenError, copy.loadError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function runChecks() {
    setRunningChecks(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/quality-gates", {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | QualityGateDispatchResponse
        | { error?: string };

      if (!response.ok || !("ok" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : copy.runError,
        );
      }

      const failed = payload.workflows.filter((workflow) => workflow.status === "failed");
      if (failed.length > 0) {
        setActionMessage({
          type: "error",
          text: `${copy.runFailedPrefix}: ${getFailedWorkflowList(failed, copy)}`,
        });
      } else {
        setActionMessage({
          type: "success",
          text: copy.runSuccess,
        });
      }

      await loadData();
    } catch (runError) {
      setActionMessage({
        type: "error",
        text:
          runError instanceof Error
            ? runError.message
            : copy.runError,
      });
    } finally {
      setRunningChecks(false);
    }
  }

  const summary = data?.webappAudit;
  const isPassing = summary ? summary.failingRoutes === 0 : null;
  const githubWorkflows = data?.githubWorkflows || [];
  const activeAlerts = data?.activeQualityAlerts || [];
  const configuration = data?.configuration ?? null;
  const manualRunUnavailable =
    Boolean(configuration) && !configuration?.manualRunAvailable;
  const githubRepository = configuration?.repository ?? data?.githubRepository ?? null;
  const githubActionsUrl = githubRepository
    ? `https://github.com/${githubRepository}/actions`
    : null;

  return (
    <Card>
      <CardHeader className="border-b border-border-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{copy.title}</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              {copy.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void loadData();
              }}
              disabled={loading || runningChecks}
            >
              {copy.refreshStatus}
            </Button>
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => {
                void runChecks();
              }}
              loading={runningChecks}
              disabled={loading || manualRunUnavailable}
            >
              {copy.runChecksNow}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">{copy.explanationTitle}</p>
          <p className="mt-1">{copy.explanationText}</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {copy.qualityChecks.map((check) => (
            <div
              key={check.workflowFile}
              className="rounded-xl border border-border-subtle bg-background-secondary p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    {copy.checkedLabel}
                  </p>
                  <p className="mt-1 font-semibold text-text-primary">{check.title}</p>
                </div>
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                  {check.cadence}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-secondary">{check.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border-subtle bg-background-secondary p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">{copy.emailTitle}</p>
          <p className="mt-1">{copy.emailText}</p>
        </div>

        {!loading && !error && configuration ? (
          <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-text-primary">{copy.setupTitle}</p>
              {githubActionsUrl ? (
                <a
                  href={githubActionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-accent hover:text-accent-hover"
                >
                  {copy.openGithubChecks}
                </a>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <SetupStatusItem
                title={copy.nightlyChecks}
                text={copy.nightlyChecksHelp}
                status={copy.nightlyChecksReady}
                ready
              />
              <SetupStatusItem
                title={copy.manualRunTitle}
                text={
                  configuration.manualRunError
                    ? `${copy.manualRunHelp} ${configuration.manualRunError}`
                    : copy.manualRunHelp
                }
                status={
                  configuration.manualRunAvailable
                    ? copy.manualRunReady
                    : copy.manualRunMissing
                }
                ready={configuration.manualRunAvailable}
              />
              <SetupStatusItem
                title={copy.adminAlerts}
                text={copy.adminAlertsHelp}
                status={
                  configuration.alertIngestAvailable
                    ? copy.adminAlertsReady
                    : copy.adminAlertsMissing
                }
                ready={configuration.alertIngestAvailable}
              />
            </div>
            {manualRunUnavailable ? (
              <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                {copy.manualRunUnavailable} {configuration.manualRunError}
              </div>
            ) : null}
          </div>
        ) : null}

        {actionMessage ? (
          <div
            className={`rounded-xl border p-4 text-sm ${
              actionMessage.type === "success"
                ? "border-success/30 bg-success/10 text-success"
                : "border-error/30 bg-error/10 text-error"
            }`}
          >
            {actionMessage.text}
          </div>
        ) : null}

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
                  ? copy.activeIssues(activeAlerts.length)
                  : copy.noActiveIssues}
              </p>
              {data?.generatedAt ? (
                <p className="text-xs text-text-secondary">
                  {copy.updatedAt}: {formatTimestamp(data.generatedAt, adminLocale)}
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
                      {getWorkflowTitle(alert.workflowFile, copy)} ({alert.branch})
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {alert.repository} | {getRunStatusText(alert.conclusion, copy)} |{" "}
                      {formatTimestamp(alert.createdAt, adminLocale)}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {copy.sourceLabel}: {getAlertSourceLabel(alert.source, copy)}
                    </p>
                    {alert.runUrl ? (
                      <a
                        href={alert.runUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-accent hover:text-accent-hover"
                      >
                        {copy.openFailedRun}
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
            {copy.localAuditMissing}
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
                {isPassing ? copy.ok : copy.issue}
              </span>
              <span className="text-sm text-text-secondary">
                {copy.failingPagesSummary(summary.failingRoutes, summary.routeCount)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  {copy.metricFailingPages}
                </p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {summary.failingRoutes}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  {copy.metricConsole}
                </p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {summary.totalConsoleWarningsAndErrors}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  {copy.metricNetwork}
                </p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {summary.totalNetworkFailures}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  {copy.metricAverageLoad}
                </p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {summary.avgNavDurationMs}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-background-secondary p-4 text-sm text-text-secondary">
              <p>
                {copy.lastCheck}:{" "}
                <span className="font-medium text-text-primary">
                  {formatTimestamp(summary.finishedAt, adminLocale)}
                </span>
              </p>
              <p className="mt-1">
                {copy.startedAt}:{" "}
                <span className="font-medium text-text-primary">
                  {formatTimestamp(summary.startedAt, adminLocale)}
                </span>
              </p>
              <p className="mt-1">
                {copy.address}: <span className="font-mono text-xs">{summary.baseUrl}</span>
              </p>
            </div>
          </div>
        ) : null}

        {!loading && !error && data?.githubRepository ? (
          <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-text-primary">
                {copy.automatedChecksTitle}
              </p>
              <p className="text-xs text-text-muted">
                {copy.repoLabel}: {data.githubRepository}
              </p>
            </div>
            <div className="space-y-3">
              {githubWorkflows.map((workflow) => {
                const run = workflow.latestScheduledRun || workflow.latestRun;
                const status = getRunStatusLabel(workflow);
                const check = getQualityCheck(workflow.workflowFile, copy);

                return (
                  <div
                    key={workflow.workflowFile}
                    className="rounded-lg border border-border-subtle bg-background p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary">
                        {getWorkflowTitle(workflow.workflowFile, copy)}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRunStatusPillClass(
                          status,
                        )}`}
                      >
                          {getRunStatusText(status, copy)}
                      </span>
                    </div>
                    {check ? (
                      <p className="mt-1 text-xs text-text-secondary">
                        {check.description}
                      </p>
                    ) : null}
                    {workflow.error ? (
                      <p className="mt-1 text-xs text-error">{workflow.error}</p>
                    ) : null}
                    {run ? (
                      <div className="mt-2 text-xs text-text-secondary">
                         <p>
                           {copy.runLabel}: #{run.id} ({" "}
                           {run.event === "schedule" ? copy.nightlyRun : copy.manualRun})
                         </p>
                         <p>
                           {copy.runUpdatedAt}: {formatTimestamp(run.updatedAt, adminLocale)}
                         </p>
                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-accent hover:text-accent-hover"
                        >
                            {copy.openRunDetails}
                         </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted">
                          {copy.noRunData}
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
