import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { resolveCheckoutIdempotencyKey } from "./route";

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
