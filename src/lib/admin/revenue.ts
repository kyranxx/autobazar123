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
