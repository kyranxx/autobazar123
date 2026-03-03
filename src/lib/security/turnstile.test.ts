import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./turnstile";

describe("verifyTurnstileToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns validation error when token is empty", async () => {
    const result = await verifyTurnstileToken({ token: "   " });

    expect(result).toEqual({ ok: false, error: "Captcha token chyba." });
  });

  it("returns error when verification endpoint does not respond with ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false }),
      }),
    );

    const result = await verifyTurnstileToken({ token: "token-1" });

    expect(result).toEqual({
      ok: false,
      error: "Overenie captcha sa nepodarilo.",
    });
  });

  it("returns success when captcha verification succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );

    const result = await verifyTurnstileToken({
      token: "token-2",
      remoteIp: "127.0.0.1",
      action: "inquiry_submit",
    });

    expect(result).toEqual({ ok: true });
  });
});
