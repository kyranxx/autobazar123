import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  buildScopedCheckoutIdempotencyKey,
  resolveCheckoutIdempotencyKey,
} from "@/lib/stripe/checkout-request";

describe("resolveCheckoutIdempotencyKey", () => {
  it("accepts a valid idempotency key", () => {
    const request = new NextRequest("https://autobazar123.sk/api/stripe/checkout", {
      method: "POST",
      headers: {
        "idempotency-key": "checkout-abc-123",
      },
    });

    expect(resolveCheckoutIdempotencyKey(request)).toBe("checkout-abc-123");
  });

  it("trims whitespace around idempotency key", () => {
    const request = new NextRequest("https://autobazar123.sk/api/stripe/checkout", {
      method: "POST",
      headers: {
        "idempotency-key": "  checkout-xyz  ",
      },
    });

    expect(resolveCheckoutIdempotencyKey(request)).toBe("checkout-xyz");
  });

  it("rejects missing or empty idempotency key", () => {
    const missing = new NextRequest("https://autobazar123.sk/api/stripe/checkout", {
      method: "POST",
    });
    const empty = new NextRequest("https://autobazar123.sk/api/stripe/checkout", {
      method: "POST",
      headers: {
        "idempotency-key": "   ",
      },
    });

    expect(resolveCheckoutIdempotencyKey(missing)).toBeNull();
    expect(resolveCheckoutIdempotencyKey(empty)).toBeNull();
  });

  it("rejects idempotency keys longer than 255 chars", () => {
    const tooLong = "a".repeat(256);
    const request = new NextRequest("https://autobazar123.sk/api/stripe/checkout", {
      method: "POST",
      headers: {
        "idempotency-key": tooLong,
      },
    });

    expect(resolveCheckoutIdempotencyKey(request)).toBeNull();
  });
});

describe("buildScopedCheckoutIdempotencyKey", () => {
  it("returns the same scoped key for the same user and payload", () => {
    const first = buildScopedCheckoutIdempotencyKey({
      idempotencyKey: "checkout-abc-123",
      userId: "user-1",
      body: {
        type: "dealer_topup",
        packageId: "dealer_100",
      },
    });
    const second = buildScopedCheckoutIdempotencyKey({
      idempotencyKey: "checkout-abc-123",
      userId: "user-1",
      body: {
        type: "dealer_topup",
        packageId: "dealer_100",
      },
    });

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it("changes when the user changes", () => {
    const first = buildScopedCheckoutIdempotencyKey({
      idempotencyKey: "checkout-abc-123",
      userId: "user-1",
      body: {
        type: "dealer_topup",
        packageId: "dealer_100",
      },
    });
    const second = buildScopedCheckoutIdempotencyKey({
      idempotencyKey: "checkout-abc-123",
      userId: "user-2",
      body: {
        type: "dealer_topup",
        packageId: "dealer_100",
      },
    });

    expect(first).not.toBe(second);
  });

  it("changes when the payload changes", () => {
    const first = buildScopedCheckoutIdempotencyKey({
      idempotencyKey: "checkout-abc-123",
      userId: "user-1",
      body: {
        type: "private_listing_action",
        adId: "11111111-1111-1111-1111-111111111111",
        operation: "publish_basic",
      },
    });
    const second = buildScopedCheckoutIdempotencyKey({
      idempotencyKey: "checkout-abc-123",
      userId: "user-1",
      body: {
        type: "private_listing_action",
        adId: "11111111-1111-1111-1111-111111111111",
        operation: "publish_top",
      },
    });

    expect(first).not.toBe(second);
  });
});
