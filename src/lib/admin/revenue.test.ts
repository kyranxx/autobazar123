import { describe, expect, it } from "vitest";
import {
  buildCheckoutAmountBySessionMap,
  calculateStripeRevenueTotals,
  extractCheckoutAmountEur,
  summarizeCreditConsumption,
  summarizeTopUpTransactions,
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

describe("buildCheckoutAmountBySessionMap", () => {
  it("maps checkout session IDs to eur amounts", () => {
    const logs: ProcessedCheckoutLog[] = [
      {
        processedAt: "2026-02-24T08:00:00.000Z",
        metadata: createCheckoutMetadata("cs_1", 1000),
      },
      {
        processedAt: "2026-02-24T09:00:00.000Z",
        metadata: createCheckoutMetadata("cs_2", 2000),
      },
    ];

    const map = buildCheckoutAmountBySessionMap(logs);
    expect(map.get("cs_1")).toBe(10);
    expect(map.get("cs_2")).toBe(20);
  });
});

describe("summarizeCreditConsumption", () => {
  it("groups negative credit usage by action type", () => {
    const summary = summarizeCreditConsumption([
      { actionType: "top_ad", amount: -3 },
      { actionType: "top_ad", amount: -2 },
      { actionType: "publish", amount: -1 },
      { actionType: "top_up", amount: 10 },
      { actionType: null, amount: -5 },
    ]);

    expect(summary).toEqual([
      {
        actionType: "top_ad",
        label: "Topovanie",
        count: 2,
        credits: 5,
      },
      {
        actionType: "publish",
        label: "Zverejnenie inzeratu",
        count: 1,
        credits: 1,
      },
    ]);
  });
});

describe("summarizeTopUpTransactions", () => {
  it("maps top-up rows into revenue transaction summaries", () => {
    const rows = [
      {
        id: "txn_1",
        userEmail: "jan@example.com",
        credits: 50,
        paymentStatus: "succeeded",
        stripeSessionId: "cs_1",
        createdAt: "2026-02-24T08:00:00.000Z",
      },
      {
        id: "txn_2",
        userEmail: "maria@example.com",
        credits: 10,
        paymentStatus: "pending",
        stripeSessionId: null,
        createdAt: "2026-02-24T09:00:00.000Z",
      },
    ];

    const summary = summarizeTopUpTransactions(
      rows,
      new Map<string, number>([["cs_1", 25]]),
    );

    expect(summary).toEqual([
      {
        id: "txn_2",
        userEmail: "maria@example.com",
        amountEur: null,
        credits: 10,
        createdAt: "2026-02-24T09:00:00.000Z",
        status: "pending",
      },
      {
        id: "txn_1",
        userEmail: "jan@example.com",
        amountEur: 25,
        credits: 50,
        createdAt: "2026-02-24T08:00:00.000Z",
        status: "succeeded",
      },
    ]);
  });
});

