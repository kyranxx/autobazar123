import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { getCheckoutRateLimitIdentifier } from "@/lib/stripe/checkout-request";

describe("getCheckoutRateLimitIdentifier", () => {
  it("uses stable request fingerprinting for checkout throttling", () => {
    const request = new NextRequest("https://autobazar123.sk/api/stripe/checkout", {
      headers: new Headers({
        "cf-connecting-ip": "198.51.100.24",
        "user-agent": "Mozilla/5.0",
        "accept-language": "sk-SK",
      }),
      method: "POST",
    });

    expect(getCheckoutRateLimitIdentifier(request)).toBe(
      createRateLimitIdentifier("checkout", request.headers),
    );
  });
});
