import { describe, expect, it } from "vitest";
import {
  calculateStripeRevenueTotals,
  extractCheckoutAmountEur,
  type ProcessedCheckoutLog,
} from "./revenue";

function createCheckoutMetadata(
  sessionId: string,
  amountCents: number,
): Record<string, unknown> {
  return {
    object: {
      id: sessionId,
      amount_total: amountCents,
    },
  };
}

describe("extractCheckoutAmountEur", () => {
  it("returns eur amount from checkout metadata", () => {
    expect(extractCheckoutAmountEur(createCheckoutMetadata("cs_1", 2599))).toBe(
      25.99,
    );
  });

  it("returns null for invalid metadata shape", () => {
    expect(extractCheckoutAmountEur({})).toBeNull();
    expect(extractCheckoutAmountEur(null)).toBeNull();
  });
});

describe("calculateStripeRevenueTotals", () => {
  it("calculates today/week/month/total from processed checkout logs", () => {
    const now = new Date("2026-02-24T15:00:00.000Z");
    const logs: ProcessedCheckoutLog[] = [
      {
        processedAt: "2026-02-24T08:00:00.000Z",
        metadata: createCheckoutMetadata("cs_today", 1500),
      },
      {
        processedAt: "2026-02-23T08:00:00.000Z",
        metadata: createCheckoutMetadata("cs_week", 2000),
      },
      {
        processedAt: "2026-02-02T08:00:00.000Z",
        metadata: createCheckoutMetadata("cs_month", 3000),
      },
      {
        processedAt: "2026-01-31T08:00:00.000Z",
        metadata: createCheckoutMetadata("cs_old", 4500),
      },
    ];

    expect(calculateStripeRevenueTotals(logs, now)).toEqual({
      today: 15,
      thisWeek: 35,
      thisMonth: 65,
      total: 110,
    });
  });
});
