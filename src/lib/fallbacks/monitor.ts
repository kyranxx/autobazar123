import { createAdminClient } from "@/lib/supabase/admin";
import {
  type FallbackKey,
  getFallbackPolicy,
} from "./registry";

let warnedMissingAdminClient = false;

export type RecordFallbackActivationInput = {
  key: FallbackKey;
  summary: string;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
  error?: unknown;
  activatedAt?: Date;
};

function normalizeError(error: unknown): {
  message: string;
  stack: string | null;
} | null {
  if (!error) return null;

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      stack: null,
    };
  }

  try {
    return {
      message: JSON.stringify(error),
      stack: null,
    };
  } catch {
    return {
      message: "Unknown fallback error",
      stack: null,
    };
  }
}

function getMonitoringClient() {
  const admin = createAdminClient();
  if (!admin) {
    if (!warnedMissingAdminClient) {
      console.warn(
        "Fallback monitoring disabled because SUPABASE_SERVICE_ROLE_KEY is unavailable.",
      );
      warnedMissingAdminClient = true;
    }
    return null;
  }

  return admin;
}

async function insertSystemLog(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  entry: {
    level: "warn" | "error" | "critical";
    category: "api" | "auth" | "payment" | "search" | "system" | "admin";
    message: string;
    requestId?: string | null;
    metadata?: Record<string, unknown>;
    errorStack?: string | null;
    createdAtIso: string;
  },
) {
  const { error } = await admin.from("system_logs").insert({
    level: entry.level,
    category: entry.category,
    message: entry.message,
    request_id: entry.requestId ?? null,
    metadata: entry.metadata ?? null,
    error_stack: entry.errorStack ?? null,
    created_at: entry.createdAtIso,
  });

  if (error) {
    console.error("Failed to persist fallback monitoring log", error);
  }
}

export async function recordFallbackActivation(
  input: RecordFallbackActivationInput,
): Promise<void> {
  try {
    const admin = getMonitoringClient();
    if (!admin) {
      return;
    }

    const policy = getFallbackPolicy(input.key);
    const activatedAt = input.activatedAt ?? new Date();
    const activatedAtIso = activatedAt.toISOString();
    const nowMs = activatedAt.getTime();
    const normalizedError = normalizeError(input.error);

    await insertSystemLog(admin, {
      level: policy.criticality === "critical" ? "critical" : "warn",
      category: policy.category,
      message: "fallback_activated",
      requestId: input.requestId ?? null,
      metadata: {
        fallbackKey: policy.key,
        summary: input.summary,
        criticality: policy.criticality,
        thresholdCount: policy.thresholdCount,
        thresholdWindowMinutes: policy.thresholdWindowMinutes,
        owner: policy.owner,
        reason: policy.reason,
        reviewBy: policy.reviewBy,
        ...(normalizedError ? { errorMessage: normalizedError.message } : {}),
        ...(input.metadata ?? {}),
      },
      errorStack: normalizedError?.stack ?? null,
      createdAtIso: activatedAtIso,
    });

    if (policy.criticality === "critical") {
      return;
    }

    const windowStartIso = new Date(
      nowMs - policy.thresholdWindowMinutes * 60_000,
    ).toISOString();
    const thresholdRequestId = `fallback-threshold:${policy.key}`;

    const { count: observedCount, error: observedCountError } = await admin
      .from("system_logs")
      .select("id", { count: "exact", head: true })
      .eq("message", "fallback_activated")
      .contains("metadata", { fallbackKey: policy.key })
      .gte("created_at", windowStartIso);

    if (observedCountError) {
      console.error(
        `Failed to evaluate fallback threshold count for ${policy.key}`,
        observedCountError,
      );
      return;
    }

    const safeObservedCount = observedCount ?? 0;
    if (safeObservedCount < policy.thresholdCount) {
      return;
    }

    const {
      count: existingThresholdAlerts,
      error: existingThresholdAlertError,
    } = await admin
      .from("system_logs")
      .select("id", { count: "exact", head: true })
      .eq("message", "fallback_threshold_crossed")
      .eq("request_id", thresholdRequestId)
      .gte("created_at", windowStartIso);

    if (existingThresholdAlertError) {
      console.error(
        `Failed to evaluate fallback threshold alert dedupe for ${policy.key}`,
        existingThresholdAlertError,
      );
      return;
    }

    if ((existingThresholdAlerts ?? 0) > 0) {
      return;
    }

    await insertSystemLog(admin, {
      level: "error",
      category: policy.category,
      message: "fallback_threshold_crossed",
      requestId: thresholdRequestId,
      metadata: {
        fallbackKey: policy.key,
        summary: input.summary,
        criticality: policy.criticality,
        thresholdCount: policy.thresholdCount,
        thresholdWindowMinutes: policy.thresholdWindowMinutes,
        observedCount: safeObservedCount,
        windowStartedAt: windowStartIso,
        owner: policy.owner,
        reason: policy.reason,
        reviewBy: policy.reviewBy,
      },
      createdAtIso: activatedAtIso,
    });
  } catch (error) {
    console.error("Unexpected fallback monitoring failure", error);
  }
}
