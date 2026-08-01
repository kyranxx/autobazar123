import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeGoogleOneTapClientId,
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

  it("keeps the Romanian fallback client ID when its env override is blank", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_AUTONINJA_RO_GOOGLE_CLIENT_ID", "");

    expect(resolveGoogleOneTapClientId("RO")).toBe(
      "707053909003-ujptljhslajmq9ru5a6o00gt2qik9ajj.apps.googleusercontent.com",
    );
  });
});
