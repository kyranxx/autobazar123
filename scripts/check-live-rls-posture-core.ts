export type LiveRlsProbeStatus = "denied" | "empty" | "leaked" | "probe_error";

export type LiveRlsProbeResult = {
  name: string;
  target: string;
  rowCount: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  probeError?: string | null;
};

export type LiveRlsProbeOutput = {
  name: string;
  target: string;
  status: LiveRlsProbeStatus;
  rowCount: number;
  errorCode?: string;
  errorMessage?: string;
  probeError?: string;
};

export type LiveRlsPostureEvaluation = {
  ok: boolean;
  summary: {
    total: number;
    safe: number;
    leaked: number;
    probeErrors: number;
  };
  probes: LiveRlsProbeOutput[];
  errors: string[];
};

function normalizeRowCount(rowCount: number): number {
  if (!Number.isFinite(rowCount)) {
    return 0;
  }

  return Math.max(0, Math.trunc(rowCount));
}

function sanitizeDiagnostic(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 240);
}

function isAccessDeniedDiagnostic(
  errorCode: string | undefined,
  errorMessage: string | undefined,
): boolean {
  return (
    errorCode === "42501" ||
    Boolean(errorMessage?.toLowerCase().includes("permission denied"))
  );
}

function formatProbeFailure(probe: LiveRlsProbeOutput): string {
  const parts = [probe.probeError, probe.errorCode, probe.errorMessage].filter(
    (part): part is string => Boolean(part),
  );

  return parts.length > 0 ? parts.join(" ") : "unknown error";
}

export function classifyLiveRlsProbe(
  result: LiveRlsProbeResult,
): LiveRlsProbeStatus {
  if (sanitizeDiagnostic(result.probeError)) {
    return "probe_error";
  }

  const errorCode = sanitizeDiagnostic(result.errorCode);
  const errorMessage = sanitizeDiagnostic(result.errorMessage);
  if (errorCode || errorMessage) {
    return isAccessDeniedDiagnostic(errorCode, errorMessage)
      ? "denied"
      : "probe_error";
  }

  if (normalizeRowCount(result.rowCount) > 0) {
    return "leaked";
  }

  return "empty";
}

export function evaluateLiveRlsPosture(
  results: LiveRlsProbeResult[],
): LiveRlsPostureEvaluation {
  const probes = results.map((result): LiveRlsProbeOutput => {
    const status = classifyLiveRlsProbe(result);
    const errorCode = sanitizeDiagnostic(result.errorCode);
    const errorMessage = sanitizeDiagnostic(result.errorMessage);
    const probeError = sanitizeDiagnostic(result.probeError);

    return {
      name: result.name,
      target: result.target,
      status,
      rowCount: normalizeRowCount(result.rowCount),
      ...(errorCode ? { errorCode } : {}),
      ...(errorMessage ? { errorMessage } : {}),
      ...(probeError ? { probeError } : {}),
    };
  });
  const leaked = probes.filter((probe) => probe.status === "leaked");
  const probeErrors = probes.filter((probe) => probe.status === "probe_error");
  const safe = probes.filter(
    (probe) => probe.status === "denied" || probe.status === "empty",
  );
  const errors = [
    ...leaked.map(
      (probe) =>
        `${probe.name} returned ${probe.rowCount} row(s) to the anon client.`,
    ),
    ...probeErrors.map(
      (probe) =>
        `${probe.name} probe could not complete: ${formatProbeFailure(probe)}`,
    ),
  ];

  return {
    ok: errors.length === 0,
    summary: {
      total: results.length,
      safe: safe.length,
      leaked: leaked.length,
      probeErrors: probeErrors.length,
    },
    probes,
    errors,
  };
}
