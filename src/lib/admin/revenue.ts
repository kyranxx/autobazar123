type JsonRecord = Record<string, unknown>;

export interface ProcessedCheckoutLog {
  metadata: unknown;
  processedAt: string | null;
}

interface StripeRevenueTotals {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

interface CreditConsumptionInput {
  actionType: string | null;
  amount: number | null;
}

interface CreditConsumptionSummary {
  actionType: string;
  label: string;
  count: number;
  credits: number;
}

export interface TopUpTransactionInput {
  id: string;
  userEmail: string;
  credits: number;
  paymentStatus: string | null;
  stripeSessionId: string | null;
  createdAt: string;
}

interface TopUpTransactionSummary {
  id: string;
  userEmail: string;
  amountEur: number | null;
  credits: number;
  createdAt: string;
  status: "succeeded" | "failed" | "pending";
}

const CONSUMPTION_LABELS: Record<string, string> = {
  publish: "Zverejnenie inzerátu",
  top_ad: "Topovanie",
  highlight: "Zvýraznenie",
  prolong: "Predlzenie",
  bump: "Posunutie",
};

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function toRoundedEur(value: number): number {
  return Number(value.toFixed(2));
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function startOfUtcMonth(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function startOfUtcWeek(date: Date): number {
  const dayOfWeek = date.getUTCDay();
  const mondayOffset = (dayOfWeek + 6) % 7;

  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - mondayOffset,
  );
}

function normalizeActionLabel(actionType: string): string {
  return CONSUMPTION_LABELS[actionType] ?? actionType.replaceAll("_", " ");
}

function parseCheckoutSession(metadata: unknown): JsonRecord | null {
  const metadataRecord = asRecord(metadata);
  if (!metadataRecord) {
    return null;
  }

  return asRecord(metadataRecord.object);
}

export function extractCheckoutAmountEur(metadata: unknown): number | null {
  const checkoutSession = parseCheckoutSession(metadata);
  if (!checkoutSession) {
    return null;
  }

  const amountTotal = checkoutSession.amount_total;
  if (typeof amountTotal !== "number" || !Number.isFinite(amountTotal)) {
    return null;
  }

  return toRoundedEur(amountTotal / 100);
}

function extractCheckoutSessionId(metadata: unknown): string | null {
  const checkoutSession = parseCheckoutSession(metadata);
  if (!checkoutSession) {
    return null;
  }

  const sessionId = checkoutSession.id;
  return typeof sessionId === "string" && sessionId.length > 0 ? sessionId : null;
}

export function calculateStripeRevenueTotals(
  logs: ProcessedCheckoutLog[],
  now: Date = new Date(),
): StripeRevenueTotals {
  const startToday = startOfUtcDay(now);
  const startWeek = startOfUtcWeek(now);
  const startMonth = startOfUtcMonth(now);

  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;
  let total = 0;

  for (const log of logs) {
    const amountEur = extractCheckoutAmountEur(log.metadata);
    if (amountEur === null) {
      continue;
    }

    const processedAtMs = log.processedAt ? Date.parse(log.processedAt) : NaN;
    if (Number.isNaN(processedAtMs)) {
      continue;
    }

    total += amountEur;
    if (processedAtMs >= startMonth) {
      thisMonth += amountEur;
    }
    if (processedAtMs >= startWeek) {
      thisWeek += amountEur;
    }
    if (processedAtMs >= startToday) {
      today += amountEur;
    }
  }

  return {
    today: toRoundedEur(today),
    thisWeek: toRoundedEur(thisWeek),
    thisMonth: toRoundedEur(thisMonth),
    total: toRoundedEur(total),
  };
}

export function buildCheckoutAmountBySessionMap(
  logs: ProcessedCheckoutLog[],
): Map<string, number> {
  const amountBySession = new Map<string, number>();

  for (const log of logs) {
    const sessionId = extractCheckoutSessionId(log.metadata);
    const amountEur = extractCheckoutAmountEur(log.metadata);
    if (!sessionId || amountEur === null) {
      continue;
    }

    amountBySession.set(sessionId, amountEur);
  }

  return amountBySession;
}

export function summarizeCreditConsumption(
  rows: CreditConsumptionInput[],
): CreditConsumptionSummary[] {
  const summaries = new Map<string, CreditConsumptionSummary>();

  for (const row of rows) {
    if (!row.actionType || row.amount === null || row.amount >= 0) {
      continue;
    }

    const credits = Math.abs(Math.trunc(row.amount));
    const current = summaries.get(row.actionType);
    if (current) {
      current.count += 1;
      current.credits += credits;
      continue;
    }

    summaries.set(row.actionType, {
      actionType: row.actionType,
      label: normalizeActionLabel(row.actionType),
      count: 1,
      credits,
    });
  }

  return Array.from(summaries.values()).sort((a, b) => b.credits - a.credits);
}

export function summarizeTopUpTransactions(
  rows: TopUpTransactionInput[],
  amountBySession: Map<string, number>,
): TopUpTransactionSummary[] {
  return rows
    .map((row) => {
      const amountEur =
        row.stripeSessionId && amountBySession.has(row.stripeSessionId)
          ? amountBySession.get(row.stripeSessionId) ?? null
          : null;

      const status: TopUpTransactionSummary["status"] =
        row.paymentStatus === "failed"
          ? "failed"
          : row.paymentStatus === "pending"
            ? "pending"
            : "succeeded";

      return {
        id: row.id,
        userEmail: row.userEmail,
        amountEur,
        credits: Math.trunc(row.credits),
        createdAt: row.createdAt,
        status,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
