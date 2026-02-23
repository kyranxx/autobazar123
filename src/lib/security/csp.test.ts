import { describe, expect, it } from "vitest";
import { buildCspHeader } from "@/lib/security/csp";

describe("buildCspHeader", () => {
  it("includes core directives in production mode", () => {
    const csp = buildCspHeader({
      isDev: false,
      enableGoogleOneTap: false,
      includeUpgradeInsecureRequests: true,
    });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("accounts.google.com");
  });

  it("enables Google One Tap origins only when explicitly enabled", () => {
    const withoutGoogle = buildCspHeader({
      isDev: true,
      enableGoogleOneTap: false,
      includeUpgradeInsecureRequests: false,
    });
    const withGoogle = buildCspHeader({
      isDev: true,
      enableGoogleOneTap: true,
      includeUpgradeInsecureRequests: false,
    });

    expect(withoutGoogle).not.toContain("https://accounts.google.com");
    expect(withGoogle).toContain("https://accounts.google.com");
  });
});
