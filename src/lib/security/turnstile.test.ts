import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./turnstile";

describe("verifyTurnstileToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
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
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        action: "inquiry_submit",
        hostname: "www.autobazar123.sk",
      }),
    });
    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const result = await verifyTurnstileToken({
      token: "token-2",
      remoteIp: "127.0.0.1",
      action: "inquiry_submit",
      expectedHostname: "www.autobazar123.sk",
    });

    expect(result).toEqual({ ok: true });
    const requestBody = fetchMock.mock.calls[0]?.[1]?.body as string;
    expect(requestBody).toContain("secret=");
    expect(requestBody).toContain("response=token-2");
    expect(requestBody).toContain("remoteip=127.0.0.1");
    expect(requestBody).not.toContain("action=");
  });

  it("rejects a successful token with the wrong action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: "listing_report_submit",
          hostname: "www.autobazar123.sk",
        }),
      }),
    );

    const result = await verifyTurnstileToken({
      token: "token-action",
      action: "inquiry_submit",
      expectedHostname: "www.autobazar123.sk",
    });

    expect(result).toEqual({
      ok: false,
      error: "Overenie captcha zlyhalo.",
    });
  });

  it("rejects a successful token from the wrong hostname", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: "inquiry_submit",
          hostname: "evil.example",
        }),
      }),
    );

    const result = await verifyTurnstileToken({
      token: "token-host",
      action: "inquiry_submit",
      expectedHostname: "www.autobazar123.sk",
    });

    expect(result).toEqual({
      ok: false,
      error: "Overenie captcha zlyhalo.",
    });
  });

  it("fails closed in production when TURNSTILE_SECRET_KEY is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyTurnstileToken({ token: "token-3" });

    expect(result).toEqual({
      ok: false,
      error: "Captcha nie je správne nakonfigurovaná.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
