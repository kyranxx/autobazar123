import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getTrimmedEnvMock } = vi.hoisted(() => ({
  getTrimmedEnvMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getTrimmedEnv: getTrimmedEnvMock,
}));

import { sendEmail } from "./transactional-email";

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTrimmedEnvMock.mockImplementation((key: string) => {
      if (key === "RESEND_API_KEY") return "re_test_key";
      if (key === "EMAIL_FROM") return "Autobazar123 <noreply@autobazar123.sk>";
      return "";
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: "resend-message-1" }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the provider idempotency key to Resend", async () => {
    await sendEmail({
      to: "buyer@example.com",
      subject: "Test email",
      htmlBody: "<p>Hello</p>",
      idempotencyKey:
        "email-job/auth_register_confirmation/6e3a1ab1-24c1-49f4-98a0-34c9ff5d48f6",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key":
            "email-job/auth_register_confirmation/6e3a1ab1-24c1-49f4-98a0-34c9ff5d48f6",
        }),
      }),
    );
  });
});
