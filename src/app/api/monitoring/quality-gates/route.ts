import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyGitHubActionsOidcToken } from "@/lib/security/github-actions-oidc";


const qualityGateAlertSchema = z.object({
  repository: z.string().trim().min(3).max(150),
  workflowFile: z.string().trim().min(3).max(180),
  branch: z.string().trim().min(1).max(120).default("main"),
  eventName: z.string().trim().min(1).max(80).optional(),
  runId: z.number().int().positive(),
  runAttempt: z.number().int().positive().optional(),
  runUrl: z.string().trim().url().max(500),
  status: z.string().trim().min(1).max(80).optional(),
  conclusion: z.string().trim().min(1).max(80),
  sha: z.string().trim().min(7).max(80).optional(),
  startedAt: z.string().trim().max(80).optional(),
  completedAt: z.string().trim().max(80).optional(),
});

function hasValidMonitoringSecret(request: NextRequest, secret: string): boolean {
  const authHeader = request.headers.get("authorization");
  const monitoringHeader = request.headers.get("x-monitoring-secret");
  return authHeader === `Bearer ${secret}` || monitoringHeader === secret;
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const [type, token] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token?.trim()) {
    return null;
  }

  return token.trim();
}

type MonitoringAuthorizationResult =
  | { ok: true; source: "shared_secret" | "github_oidc"; normalizedRepository?: string }
  | { ok: false; status: 401 | 500; error: string };

async function authorizeMonitoringRequest(
  request: NextRequest,
  monitoringSecret: string | undefined,
): Promise<MonitoringAuthorizationResult> {
  if (monitoringSecret && hasValidMonitoringSecret(request, monitoringSecret)) {
    return { ok: true, source: "shared_secret" };
  }

  const bearerToken = getBearerToken(request);
  if (!bearerToken) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  try {
    const verification = await verifyGitHubActionsOidcToken(bearerToken);
    return {
      ok: true,
      source: "github_oidc",
      normalizedRepository: verification.normalizedRepository,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GitHub OIDC verification failed.";
    if (message.includes("QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES")) {
      return { ok: false, status: 500, error: message };
    }
    return { ok: false, status: 401, error: "Unauthorized" };
  }
}

function toAlertMessage(conclusion: string): "quality_gate_failure" | "quality_gate_recovered" {
  return conclusion === "success" ? "quality_gate_recovered" : "quality_gate_failure";
}

function toAlertLevel(conclusion: string): "info" | "warn" | "error" {
  if (conclusion === "success") {
    return "info";
  }
  if (conclusion === "cancelled" || conclusion === "neutral" || conclusion === "skipped") {
    return "warn";
  }
  return "error";
}

function toFingerprint(repository: string, workflowFile: string, branch: string): string {
  return `quality-gate:${repository}:${workflowFile}:${branch}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const monitoringSecret =
      process.env.QUALITY_GATE_ALERT_SECRET ?? process.env.CRON_SECRET;

    const authorization = await authorizeMonitoringRequest(request, monitoringSecret);
    if (!authorization.ok) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const body = (await request.json()) as unknown;
    const parsed = qualityGateAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload = parsed.data;
    if (
      authorization.source === "github_oidc" &&
      authorization.normalizedRepository &&
      authorization.normalizedRepository !== payload.repository.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Supabase admin unavailable" }, { status: 500 });
    }

    const fingerprint = toFingerprint(
      payload.repository,
      payload.workflowFile,
      payload.branch,
    );
    const nextMessage = toAlertMessage(payload.conclusion);
    const nextLevel = toAlertLevel(payload.conclusion);

    const { data: previousState } = await admin
      .from("system_logs")
      .select("message")
      .eq("request_id", fingerprint)
      .in("message", ["quality_gate_failure", "quality_gate_recovered"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousState?.message === nextMessage) {
      return NextResponse.json({
        ok: true,
        deduped: true,
        state: nextMessage,
      });
    }

    const now = new Date().toISOString();
    const { error } = await admin.from("system_logs").insert({
      level: nextLevel,
      category: "system",
      message: nextMessage,
      request_id: fingerprint,
      metadata: {
        source: authorization.source === "github_oidc" ? "github_actions_oidc" : "github_actions",
        authSource: authorization.source,
        repository: payload.repository,
        workflowFile: payload.workflowFile,
        branch: payload.branch,
        eventName: payload.eventName ?? null,
        status: payload.status ?? null,
        conclusion: payload.conclusion,
        runId: payload.runId,
        runAttempt: payload.runAttempt ?? null,
        runUrl: payload.runUrl,
        sha: payload.sha ?? null,
        startedAt: payload.startedAt ?? null,
        completedAt: payload.completedAt ?? null,
      },
      created_at: now,
    });

    if (error) {
      return NextResponse.json({ error: "Failed to persist alert" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      deduped: false,
      state: nextMessage,
      loggedAt: now,
    });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export const _internal = {
  getBearerToken,
  authorizeMonitoringRequest,
  toAlertMessage,
  toAlertLevel,
  toFingerprint,
};
