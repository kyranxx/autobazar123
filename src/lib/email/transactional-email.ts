/**
 * Transactional Email Service
 * Supports multiple providers: Resend, SendGrid, Mailgun
 */

type EmailProvider = "resend" | "sendgrid" | "mailgun";

interface EmailPayload {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  replyTo?: string;
  tags?: string[];
  metadata?: Record<string, string>;
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send transactional email
 * Supports: Resend, SendGrid, Mailgun
 */
export async function sendEmail(
  payload: EmailPayload,
): Promise<SendEmailResponse> {
  const provider = (process.env.EMAIL_PROVIDER as EmailProvider) || "resend";

  try {
    switch (provider) {
      case "resend":
        return await sendViaResend(payload);
      case "sendgrid":
        return await sendViaSendGrid(payload);
      case "mailgun":
        return await sendViaMailgun(payload);
      default:
        return {
          success: false,
          error: `Unknown email provider: ${provider}`,
        };
    }
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY not configured",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "noreply@autobazar123.sk",
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

/**
 * Send via SendGrid
 * Requires: SENDGRID_API_KEY
 */
async function sendViaSendGrid(
  payload: EmailPayload,
): Promise<SendEmailResponse> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "SENDGRID_API_KEY not configured",
    };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: (Array.isArray(payload.to) ? payload.to : [payload.to]).map(
              (email) => ({ email }),
            ),
            subject: payload.subject,
          },
        ],
        from: {
          email: process.env.EMAIL_FROM || "noreply@autobazar123.sk",
        },
        content: [
          {
            type: "text/html",
            value: payload.htmlBody,
          },
          ...(payload.textBody
            ? [
                {
                  type: "text/plain",
                  value: payload.textBody,
                },
              ]
            : []),
        ],
        reply_to: payload.replyTo ? { email: payload.replyTo } : undefined,
        categories: payload.tags || [],
        custom_args: payload.metadata,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `SendGrid error: ${response.statusText}`,
      };
    }

    return {
      success: true,
      messageId: response.headers.get("X-Message-Id") || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SendGrid error",
    };
  }
}

/**
 * Send via Mailgun
 * Requires: MAILGUN_API_KEY, MAILGUN_DOMAIN
 */
async function sendViaMailgun(
  payload: EmailPayload,
): Promise<SendEmailResponse> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return {
      success: false,
      error: "MAILGUN_API_KEY or MAILGUN_DOMAIN not configured",
    };
  }

  try {
    const formData = new FormData();
    formData.append(
      "from",
      process.env.EMAIL_FROM || "noreply@autobazar123.sk",
    );
    formData.append(
      "to",
      Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
    );
    formData.append("subject", payload.subject);
    formData.append("html", payload.htmlBody);
    if (payload.textBody) formData.append("text", payload.textBody);
    if (payload.replyTo) formData.append("h:Reply-To", payload.replyTo);
    if (payload.tags) {
      payload.tags.forEach((tag) => formData.append("o:tag", tag));
    }

    const response = await fetch(
      `https://api.mailgun.net/v3/${domain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Mailgun error: ${response.statusText}`,
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
      error: error instanceof Error ? error.message : "Mailgun error",
    };
  }
}

/**
 * Email template types
 */
type EmailTemplate =
  | "payment-confirmation"
  | "payment-failed"
  | "password-reset"
  | "welcome"
  | "ad-posted"
  | "ad-expiring"
  | "message-received"
  | "contact-inquiry";
