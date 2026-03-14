import { describe, expect, it } from "vitest";
import { buildCspHeader } from "@/lib/security/csp";

describe("buildCspHeader", () => {
  it("includes core directives in production mode", () => {
    const csp = buildCspHeader({
      isDev: false,
      enableGoogleOneTap: false,
      includeUpgradeInsecureRequests: true,
      publicSupabaseUrl: null,
    });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).toContain("frame-src");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("accounts.google.com");
  });

  it("enables Google One Tap origins only when explicitly enabled", () => {
    const withoutGoogle = buildCspHeader({
      isDev: true,
      enableGoogleOneTap: false,
      includeUpgradeInsecureRequests: false,
      publicSupabaseUrl: null,
    });
    const withGoogle = buildCspHeader({
      isDev: true,
      enableGoogleOneTap: true,
      includeUpgradeInsecureRequests: false,
      publicSupabaseUrl: null,
    });

    expect(withoutGoogle).not.toContain("https://accounts.google.com");
    expect(withGoogle).toContain("https://accounts.google.com");
  });

  it("allows a branded Supabase domain in img and connect sources", () => {
    const csp = buildCspHeader({
      isDev: false,
      enableGoogleOneTap: false,
      includeUpgradeInsecureRequests: true,
      publicSupabaseUrl: "https://auth.autobazar123.sk",
    });

    expect(csp).toContain("img-src");
    expect(csp).toContain("connect-src");
    expect(csp).toContain("https://auth.autobazar123.sk");
    expect(csp).toContain("wss://auth.autobazar123.sk");
  });
});
