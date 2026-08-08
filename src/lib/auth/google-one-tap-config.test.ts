import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeGoogleOneTapClientId,
  resolveGoogleOneTapConfig,
  resolveGoogleOneTapClientId,
} from "./google-one-tap-config";

describe("Google One Tap configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats blank client IDs as absent", () => {
    expect(normalizeGoogleOneTapClientId("  ")).toBeNull();
    expect(normalizeGoogleOneTapClientId("client-id")).toBe("client-id");
  });

  it("prefers the Romanian market client ID over the shared fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "shared-client-id");
    vi.stubEnv("NEXT_PUBLIC_AUTONINJA_RO_GOOGLE_CLIENT_ID", "ro-client-id");

    expect(resolveGoogleOneTapClientId("RO")).toBe("ro-client-id");
  });

  it("uses the legacy shared client only for the Slovak market", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "shared-client-id");
    vi.stubEnv("NEXT_PUBLIC_AUTONINJA_RO_GOOGLE_CLIENT_ID", "");

    expect(resolveGoogleOneTapClientId("SK")).toBe("shared-client-id");
    expect(resolveGoogleOneTapClientId("RO")).toBeNull();
  });

  it("does not invent a client ID when all configured values are blank", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_AUTONINJA_RO_GOOGLE_CLIENT_ID", "");

    expect(resolveGoogleOneTapClientId("RO")).toBeNull();
  });

  it("enables Romanian One Tap when its client ID is configured", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_AUTONINJA_RO_GOOGLE_CLIENT_ID",
      "ro-client-id",
    );
    vi.stubEnv("NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP", "true");

    expect(resolveGoogleOneTapConfig("RO")).toEqual({
      clientId: "ro-client-id",
      enabled: true,
    });
  });
});
