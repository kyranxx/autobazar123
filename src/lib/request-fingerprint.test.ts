import { describe, expect, it } from "vitest";
import {
  createRateLimitIdentifier,
  createRequestFingerprint,
  getClientIp,
} from "./request-fingerprint";

describe("request-fingerprint", () => {
  it("prefers cf-connecting-ip for client IP extraction", () => {
    const headers = new Headers({
      "cf-connecting-ip": "198.51.100.44",
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

  it("creates stable fingerprint for same request metadata", () => {
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

  it("changes fingerprint when user-agent changes under shared IP", () => {
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

    expect(createRequestFingerprint(mobileHeaders)).not.toBe(
      createRequestFingerprint(desktopHeaders),
    );
  });

  it("builds namespaced rate limit identifier", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.11",
      "user-agent": "Mozilla/5.0",
    });

    const identifier = createRateLimitIdentifier("maintenance_unlock", headers);
    expect(identifier.startsWith("maintenance_unlock:")).toBe(true);
    expect(identifier.length).toBeGreaterThan("maintenance_unlock:".length);
  });
});
