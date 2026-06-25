import { COMPANY_INFO } from "@/config/company";
import { getTrimmedEnv } from "@/lib/env";

/**
 * Transactional Email Service
 * Resend-only delivery path.
 */

interface EmailPayload {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  replyTo?: string;
  tags?: string[];
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send transactional email
 * Supports: Resend
 */
export async function sendEmail(
  payload: EmailPayload,
): Promise<SendEmailResponse> {
  try {
    return await sendViaResend(payload);
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send via Resend (recommended)
 * Requires: RESEND_API_KEY
 */
async function sendViaResend(
  payload: EmailPayload,
): Promise<SendEmailResponse> {
  const apiKey = getTrimmedEnv("RESEND_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY not configured",
    };
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (payload.idempotencyKey) {
      headers["Idempotency-Key"] = payload.idempotencyKey;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: getTrimmedEnv("EMAIL_FROM") || `noreply@${COMPANY_INFO.infoEmail.split("@")[1]}`,
        to: payload.to,
        subject: payload.subject,
        html: payload.htmlBody,
        text: payload.textBody,
        reply_to: payload.replyTo,
        headers: {
          "X-Entity-Ref-ID": payload.metadata?.["requestId"],
        },
      }),
    });

    if (!response.ok) {
      const _error = await response.text();
      return {
        success: false,
        error: `Resend error: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Resend error",
    };
  }
}
