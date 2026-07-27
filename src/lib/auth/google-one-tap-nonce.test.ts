import { describe, expect, it } from "vitest";
import { generateGoogleOneTapNonce } from "./google-one-tap-nonce";

describe("generateGoogleOneTapNonce", () => {
  it("returns the raw nonce and its SHA-256 hexadecimal digest", async () => {
    const { hashedNonce, nonce } = await generateGoogleOneTapNonce();
    const expectedHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(nonce),
        ),
      ),
    )
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    expect(nonce.length).toBeGreaterThan(0);
    expect(hashedNonce).toMatch(/^[a-f0-9]{64}$/);
    expect(hashedNonce).toBe(expectedHash);
  });

  it("generates a fresh nonce for every initialization", async () => {
    const first = await generateGoogleOneTapNonce();
    const second = await generateGoogleOneTapNonce();

    expect(first.nonce).not.toBe(second.nonce);
    expect(first.hashedNonce).not.toBe(second.hashedNonce);
  });
});
