import { describe, expect, it } from "vitest";
import {
  createRateLimitIdentifier,
  createRequestFingerprint,
  getClientIp,
} from "./request-fingerprint";

describe("request-fingerprint", () => {
  it("ignores cf-connecting-ip in favor of Vercel-owned headers", () => {
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.44",
      "x-forwarded-for": "203.0.113.11",
    });

    expect(getClientIp(headers)).toBe("203.0.113.11");
  });

  it("prefers x-vercel-forwarded-for over the generic forwarded header", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "198.51.100.44",
      "x-forwarded-for": "203.0.113.11",
    });

    expect(getClientIp(headers)).toBe("198.51.100.44");
  });

  it("uses first value from x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.11, 10.0.0.1",
    });

    expect(getClientIp(headers)).toBe("203.0.113.11");
  });

  it("creates stable fingerprint for the same trusted IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.11",
      "user-agent": "Mozilla/5.0 iPhone",
      "accept-language": "sk-SK",
    });

    const first = createRequestFingerprint(headers);
    const second = createRequestFingerprint(headers);

    expect(first).toBe(second);
    expect(first).toHaveLength(24);
  });

  it("ignores user-agent changes under the same IP", () => {
    const mobileHeaders = new Headers({
      "x-forwarded-for": "203.0.113.11",
      "user-agent": "Mozilla/5.0 iPhone",
      "accept-language": "sk-SK",
    });
    const desktopHeaders = new Headers({
      "x-forwarded-for": "203.0.113.11",
      "user-agent": "Mozilla/5.0 Windows",
      "accept-language": "sk-SK",
    });

    expect(createRequestFingerprint(mobileHeaders)).toBe(
      createRequestFingerprint(desktopHeaders),
    );
  });

  it("ignores untrusted Cloudflare, real-IP, and client-IP headers", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.9",
      "x-real-ip": "203.0.113.10",
      "x-client-ip": "203.0.113.11",
    });

    expect(getClientIp(headers)).toBeNull();
    expect(createRequestFingerprint(headers)).toHaveLength(24);
  });

  it("builds namespaced rate limit identifier", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.11",
    });

    const identifier = createRateLimitIdentifier("maintenance_unlock", headers);
    expect(identifier.startsWith("maintenance_unlock:")).toBe(true);
    expect(identifier.length).toBeGreaterThan("maintenance_unlock:".length);
  });
});
