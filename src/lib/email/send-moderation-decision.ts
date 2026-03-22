import { sendEmail } from "@/lib/email/transactional-email";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import { COMPANY_INFO } from "@/config/company";
import { getTrimmedEnv } from "@/lib/env";

type ModerationDecision = "approved" | "rejected";

type SendModerationDecisionEmailInput = {
  to: string;
  fullName?: string | null;
  adTitle: string;
  decision: ModerationDecision;
  dashboardUrl: string;
  reviewNote?: string | null;
};

function getSupportEmail(): string {
  return getTrimmedEnv("EMAIL_REPLY_TO") || COMPANY_INFO.supportEmail;
}

function getDisplayName(fullName?: string | null): string {
  const value = (fullName || "").trim();
  return value.length > 0 ? value : "Používateľ";
}

function getSubject(decision: ModerationDecision): string {
  return decision === "approved"
    ? "Váš inzerát bol schválený - Autobazar123"
    : "Váš inzerát potrebuje úpravu - Autobazar123";
}

function renderHtml(input: SendModerationDecisionEmailInput): string {
  const greeting = getDisplayName(input.fullName);
  const intro =
    input.decision === "approved"
      ? `Váš inzerát <strong>${input.adTitle}</strong> bol schválený a je už aktívny na Autobazar123.`
      : `Váš inzerát <strong>${input.adTitle}</strong> bol zatiaľ zamietnutý. Po úprave ho môžete znovu odoslať na schválenie.`;
  const noteBlock =
    input.reviewNote && input.reviewNote.trim().length > 0
      ? `<p style="margin:16px 0 0;font-size:14px;line-height:20px;"><strong>Poznámka moderácie:</strong><br/>${input.reviewNote.trim()}</p>`
      : "";

  return `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f6f4ef;padding:24px;color:#1f2937">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e8e2d3;overflow:hidden">
        <div style="background:#0f766e;padding:24px 28px;color:#ffffff">
          <div style="font-size:12px;opacity:.9">Autobazar123</div>
          <h1 style="margin:8px 0 0;font-size:26px;line-height:32px">
            ${input.decision === "approved" ? "Inzerát schválený" : "Inzerát potrebuje úpravu"}
          </h1>
        </div>
        <div style="padding:24px 28px">
          <p style="margin:0 0 12px;font-size:16px;line-height:24px">Ahoj ${greeting},</p>
          <p style="margin:0 0 12px;font-size:15px;line-height:24px">${intro}</p>
          ${noteBlock}
          <div style="margin-top:24px">
            <a href="${input.dashboardUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600">
              Otvoriť moje inzeráty
            </a>
          </div>
          <p style="margin:20px 0 0;font-size:13px;line-height:20px;color:#475569">
            V prípade otázok odpovedzte na tento email alebo nás kontaktujte na ${getSupportEmail()}.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function sendModerationDecisionEmail(
  input: SendModerationDecisionEmailInput,
): Promise<{ success: boolean; error?: string }> {
  const subject = getSubject(input.decision);
  const htmlBody = renderHtml(input);

  const result = await sendEmail({
    to: input.to,
    subject,
    htmlBody,
    textBody:
      input.decision === "approved"
        ? `Váš inzerát ${input.adTitle} bol schválený. Dashboard: ${input.dashboardUrl}`
        : `Váš inzerát ${input.adTitle} bol zamietnutý. Dashboard: ${input.dashboardUrl}`,
    replyTo: getSupportEmail(),
    metadata: {
      emailType: "ad-moderation-decision",
    },
    tags: ["moderation", input.decision],
  });

  await logEmailDelivery({
    emailType: "ad-moderation-decision",
    templateKey: input.decision === "approved" ? "ad_approved" : "ad_rejected",
    recipientEmail: input.to,
    subject,
    status: result.success ? "sent" : "failed",
    providerMessageId: result.messageId,
    errorMessage: result.error,
    metadata: {
      decision: input.decision,
      adTitle: input.adTitle,
    },
    htmlPreview: htmlBody,
  });

  return result.success
    ? { success: true }
    : { success: false, error: result.error || "Email delivery failed" };
}
