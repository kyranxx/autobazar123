import { describe, expect, it } from "vitest";
import {
  getWebhookReplayDecision,
  resolveProcessingStaleWindowMs,
  shouldApplyBillingForCheckoutSession,
} from "./route";

describe("resolveProcessingStaleWindowMs", () => {
  it("uses default stale window when env value is missing", () => {
    expect(resolveProcessingStaleWindowMs(undefined)).toBe(300000);
  });

  it("uses configured stale window when env value is valid", () => {
    expect(resolveProcessingStaleWindowMs("45")).toBe(45000);
  });

  it("falls back to default for invalid stale window values", () => {
    expect(resolveProcessingStaleWindowMs("0")).toBe(300000);
    expect(resolveProcessingStaleWindowMs("not-a-number")).toBe(300000);
  });
});

describe("getWebhookReplayDecision", () => {
  const now = new Date("2026-02-24T12:00:00.000Z");
  const staleWindowMs = 5 * 60 * 1000;

  it("processes brand new events", () => {
    expect(getWebhookReplayDecision(null, now, staleWindowMs)).toEqual({
      action: "process",
      reason: "new_event",
    });
  });

  it("skips terminal duplicate events", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processed",
          processed_at: "2026-02-24T11:59:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "skip", reason: "duplicate_terminal" });

    expect(
      getWebhookReplayDecision(
        {
          status: "skipped",
          processed_at: "2026-02-24T11:59:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "skip", reason: "duplicate_terminal" });
  });

  it("retries previously failed events", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "failed",
          processed_at: "2026-02-24T11:59:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_failed" });
  });

  it("treats fresh processing rows as in-flight duplicates", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "2026-02-24T11:57:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "skip", reason: "duplicate_inflight" });
  });

  it("retries stale processing rows after interrupted first attempt", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "2026-02-24T11:50:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_stale_processing" });
  });

  it("retries processing rows with missing or invalid processed_at", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: null,
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_stale_processing" });

    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "not-a-date",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_stale_processing" });
  });

  it("treats stale-window boundary as retryable", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "2026-02-24T11:55:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_stale_processing" });
  });

  it("keeps future processing rows as in-flight duplicates", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "processing",
          processed_at: "2026-02-24T12:02:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "skip", reason: "duplicate_inflight" });
  });

  it("retries unknown statuses to recover out-of-order transitions", () => {
    expect(
      getWebhookReplayDecision(
        {
          status: "queued",
          processed_at: "2026-02-24T11:59:00.000Z",
        },
        now,
        staleWindowMs,
      ),
    ).toEqual({ action: "process", reason: "retry_unknown_status" });
  });
});

describe("shouldApplyBillingForCheckoutSession", () => {
  it("applies billing updates for paid completed sessions", () => {
    expect(
      shouldApplyBillingForCheckoutSession("checkout.session.completed", "paid"),
    ).toBe(true);
  });

  it("defers billing updates for unpaid completed sessions", () => {
    expect(
      shouldApplyBillingForCheckoutSession("checkout.session.completed", "unpaid"),
    ).toBe(false);
  });

  it("applies billing updates for async success events", () => {
    expect(
      shouldApplyBillingForCheckoutSession(
        "checkout.session.async_payment_succeeded",
        "unpaid",
      ),
    ).toBe(true);
  });

  it("does not apply billing updates for unrelated events", () => {
    expect(
      shouldApplyBillingForCheckoutSession("payment_intent.succeeded", "paid"),
    ).toBe(false);
  });
});
