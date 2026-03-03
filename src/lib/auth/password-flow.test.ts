import { describe, expect, it } from "vitest";
import { shouldUseDirectPasswordSet } from "./password-flow";

describe("shouldUseDirectPasswordSet", () => {
  it("returns false for email-password accounts", () => {
    expect(
      shouldUseDirectPasswordSet({
        app_metadata: {
          provider: "email",
          providers: ["email"],
        },
        identities: [{ provider: "email" }],
      }),
    ).toBe(false);
  });

  it("returns true for google-only accounts", () => {
    expect(
      shouldUseDirectPasswordSet({
        app_metadata: {
          provider: "google",
          providers: ["google"],
        },
        identities: [{ provider: "google" }],
      }),
    ).toBe(true);
  });

  it("returns true when a social provider is present alongside email", () => {
    expect(
      shouldUseDirectPasswordSet({
        app_metadata: {
          provider: "google",
          providers: ["google", "email"],
        },
        identities: [{ provider: "google" }, { provider: "email" }],
      }),
    ).toBe(true);
  });

  it("returns false when provider data is missing", () => {
    expect(shouldUseDirectPasswordSet({})).toBe(false);
  });
});
