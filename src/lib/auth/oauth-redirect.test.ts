import { afterEach, describe, expect, it, vi } from "vitest";
import {
  oauthProviderUrlMatchesExpectedCallback,
  providerUrlMatchesExpectedRedirect,
  resolveOAuthCallbackUrl,
} from "./oauth-redirect";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveOAuthCallbackUrl", () => {
  it("uses active origin in development when active host is not localhost", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN;

    const callbackUrl = resolveOAuthCallbackUrl({
      origin: "https://autobazar123.sk",
      hostname: "autobazar123.sk",
    });

    expect(callbackUrl).toBe("https://autobazar123.sk/auth/callback");
  });

  it("uses current localhost origin in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN;

    const callbackUrl = resolveOAuthCallbackUrl({
      origin: "http://localhost:3000",
      hostname: "localhost",
    });

    expect(callbackUrl).toBe("http://localhost:3000/auth/callback");
  });

  it("uses configured redirect origin when explicitly set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "http://localhost:3010");

    const callbackUrl = resolveOAuthCallbackUrl({
      origin: "http://localhost:3000",
      hostname: "localhost",
    });

    expect(callbackUrl).toBe("http://localhost:3010/auth/callback");
  });

  it("ignores localhost override for non-localhost active origins", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "http://localhost:3010");

    const callbackUrl = resolveOAuthCallbackUrl({
      origin: "https://autobazar123.sk",
      hostname: "autobazar123.sk",
    });

    expect(callbackUrl).toBe("https://autobazar123.sk/auth/callback");
  });

  it("keeps non-localhost configured origin when explicitly set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN", "https://autobazar123.sk");

    const callbackUrl = resolveOAuthCallbackUrl({
      origin: "https://preview.autobazar123.sk",
      hostname: "preview.autobazar123.sk",
    });

    expect(callbackUrl).toBe("https://autobazar123.sk/auth/callback");
  });

  it("uses active origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN;

    const callbackUrl = resolveOAuthCallbackUrl({
      origin: "https://autobazar123.sk",
      hostname: "autobazar123.sk",
    });

    expect(callbackUrl).toBe("https://autobazar123.sk/auth/callback");
  });

  it("uses localhost fallback when no location is available", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN;

    const callbackUrl = resolveOAuthCallbackUrl(null);

    expect(callbackUrl).toBe("http://localhost:3000/auth/callback");
  });
});

describe("oauthProviderUrlMatchesExpectedCallback", () => {
  it("returns true for matching callback URL", () => {
    const providerUrl =
      "https://vxwbbzjlctjpzivfkdou.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback";

    const matches = oauthProviderUrlMatchesExpectedCallback(
      providerUrl,
      "http://localhost:3000/auth/callback",
    );

    expect(matches).toBe(true);
  });

  it("returns false when provider URL points to production callback", () => {
    const providerUrl =
      "https://vxwbbzjlctjpzivfkdou.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fautobazar123.sk%2Fauth%2Fcallback";

    const matches = oauthProviderUrlMatchesExpectedCallback(
      providerUrl,
      "http://localhost:3000/auth/callback",
    );

    expect(matches).toBe(false);
  });
});

describe("providerUrlMatchesExpectedRedirect", () => {
  it("returns true for a matching recovery redirect URL", () => {
    const providerUrl =
      "https://vxwbbzjlctjpzivfkdou.supabase.co/auth/v1/verify?token=abc&type=recovery&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Freset-password";

    const matches = providerUrlMatchesExpectedRedirect(
      providerUrl,
      "http://localhost:3000/auth/reset-password",
    );

    expect(matches).toBe(true);
  });

  it("returns false when a recovery redirect URL is rewritten to the site root", () => {
    const providerUrl =
      "https://vxwbbzjlctjpzivfkdou.supabase.co/auth/v1/verify?token=abc&type=recovery&redirect_to=https%3A%2F%2Fautobazar123.sk";

    const matches = providerUrlMatchesExpectedRedirect(
      providerUrl,
      "http://localhost:3000/auth/reset-password",
    );

    expect(matches).toBe(false);
  });
});
