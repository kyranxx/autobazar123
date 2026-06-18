import type { NextRequest } from "next/server";
import { verifyGitHubActionsOidcToken } from "@/lib/security/github-actions-oidc";

function hasValidMonitoringSecret(request: NextRequest, secret: string): boolean {
  const authHeader = request.headers.get("authorization");
  const monitoringHeader = request.headers.get("x-monitoring-secret");
  return authHeader === `Bearer ${secret}` || monitoringHeader === secret;
}

export function getBearerToken(request: NextRequest): string | null {
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

export type MonitoringAuthorizationResult =
  | { ok: true; source: "shared_secret" | "github_oidc"; normalizedRepository?: string }
  | { ok: false; status: 401 | 500; error: string };

export async function authorizeMonitoringRequest(
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

export function toAlertMessage(conclusion: string): "quality_gate_failure" | "quality_gate_recovered" {
  return conclusion === "success" ? "quality_gate_recovered" : "quality_gate_failure";
}

export function toAlertLevel(conclusion: string): "info" | "warn" | "error" {
  if (conclusion === "success") {
    return "info";
  }
  if (conclusion === "cancelled" || conclusion === "neutral" || conclusion === "skipped") {
    return "warn";
  }
  return "error";
}

export function toFingerprint(repository: string, workflowFile: string, branch: string): string {
  return `quality-gate:${repository}:${workflowFile}:${branch}`;
}

export const _internal = {
  getBearerToken,
  authorizeMonitoringRequest,
  toAlertMessage,
  toAlertLevel,
  toFingerprint,
};
