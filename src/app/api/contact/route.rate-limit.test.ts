import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createRateLimitIdentifier } from "@/lib/request-fingerprint";
import { getContactSubmitRateLimitIdentifier } from "./route";

describe("getContactSubmitRateLimitIdentifier", () => {
  it("uses stable request fingerprinting for contact submit throttling", () => {
    const request = new NextRequest("https://autobazar123.sk/api/contact", {
      headers: new Headers({
        "x-forwarded-for": "203.0.113.10",
        "user-agent": "Mozilla/5.0",
        "accept-language": "sk-SK",
      }),
      method: "POST",
    });

    expect(getContactSubmitRateLimitIdentifier(request)).toBe(
      createRateLimitIdentifier("contact_submit", request.headers),
    );
  });
});
