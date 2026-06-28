import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSessionMock = vi.fn();
const verifyOtpMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      verifyOtp: verifyOtpMock,
    },
  }),
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    verifyOtpMock.mockResolvedValue({ error: null });
  });

  it("exchanges OAuth/PKCE code callbacks and redirects to the requested local path", async () => {
    const response = await GET(
      new Request("https://autobazar123.sk/auth/callback?code=auth-code&next=/dealer"),
    );

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("auth-code");
    expect(verifyOtpMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://autobazar123.sk/dealer");
  });

  it("verifies email token-hash callbacks and redirects to account", async () => {
    const response = await GET(
      new Request(
        "https://autobazar123.sk/auth/callback?token_hash=hashed-confirm-token&type=email",
      ),
    );

    expect(verifyOtpMock).toHaveBeenCalledWith({
      token_hash: "hashed-confirm-token",
      type: "email",
    });
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://autobazar123.sk/moj-ucet",
    );
  });

  it("rejects unsafe next redirects after successful verification", async () => {
    const response = await GET(
      new Request(
        "https://autobazar123.sk/auth/callback?token_hash=hashed-confirm-token&type=email&next=//evil.example",
      ),
    );

    expect(verifyOtpMock).toHaveBeenCalledWith({
      token_hash: "hashed-confirm-token",
      type: "email",
    });
    expect(response.headers.get("location")).toBe(
      "https://autobazar123.sk/moj-ucet",
    );
  });

  it("redirects to the auth error page when verification fails", async () => {
    verifyOtpMock.mockResolvedValueOnce({ error: new Error("expired") });

    const response = await GET(
      new Request(
        "https://autobazar123.sk/auth/callback?token_hash=expired-token&type=email",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://autobazar123.sk/auth/auth-code-error",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("does not fall through to code exchange when an email token hash fails", async () => {
    verifyOtpMock.mockResolvedValueOnce({ error: new Error("expired") });

    const response = await GET(
      new Request(
        "https://autobazar123.sk/auth/callback?token_hash=expired-token&type=email&code=auth-code",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://autobazar123.sk/auth/auth-code-error",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });
});
