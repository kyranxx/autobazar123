const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

type TurnstileApiResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export type VerifyTurnstileTokenInput = {
  token: string;
  remoteIp?: string | null;
  action?: string | null;
};

export type VerifyTurnstileTokenResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyTurnstileToken(
  input: VerifyTurnstileTokenInput,
): Promise<VerifyTurnstileTokenResult> {
  const token = input.token.trim();
  if (!token) {
    return { ok: false, error: "Captcha token chyba." };
  }

  const secret =
    process.env.TURNSTILE_SECRET_KEY?.trim() || TURNSTILE_TEST_SECRET_KEY;

  const payload = new URLSearchParams({
    secret,
    response: token,
  });

  if (input.remoteIp) {
    payload.set("remoteip", input.remoteIp);
  }

  if (input.action) {
    payload.set("action", input.action);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, error: "Overenie captcha sa nepodarilo." };
    }

    const body = (await response.json()) as TurnstileApiResponse;
    if (!body.success) {
      const details = Array.isArray(body["error-codes"])
        ? body["error-codes"].join(", ")
        : null;

      return {
        ok: false,
        error: details
          ? `Overenie captcha zlyhalo: ${details}`
          : "Overenie captcha zlyhalo.",
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Overenie captcha sa nepodarilo." };
  }
}
