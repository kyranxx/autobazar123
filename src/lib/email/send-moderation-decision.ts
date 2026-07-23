import { sendEmail } from "@/lib/email/transactional-email";
import { getEmailBrandName } from "@/lib/email/email-market";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import { COMPANY_INFO } from "@/config/company";
import { getTrimmedEnv } from "@/lib/env";
import { renderModerationDecisionEmail } from "@/lib/email/react-email-templates";

type ModerationDecision = "approved" | "rejected";

type SendModerationDecisionEmailInput = {
  to: string;
  fullName?: string | null;
  adTitle: string;
  decision: ModerationDecision;
  dashboardUrl: string;
  reviewNote?: string | null;
  idempotencyKey?: string;
};

function getSupportEmail(): string {
  return getTrimmedEnv("EMAIL_REPLY_TO") || COMPANY_INFO.supportEmail;
}

function getDisplayName(fullName?: string | null): string {
  const value = (fullName || "").trim();
  return value.length > 0 ? value : "Používateľ";
}

function getSubject(decision: ModerationDecision): string {
  const brandName = getEmailBrandName();
  return decision === "approved"
    ? `Váš inzerát bol schválený - ${brandName}`
    : `Váš inzerát potrebuje úpravu - ${brandName}`;
}

export async function sendModerationDecisionEmail(
  input: SendModerationDecisionEmailInput,
): Promise<{ success: boolean; error?: string }> {
  const subject = getSubject(input.decision);
  const htmlBody = await renderModerationDecisionEmail({
    userName: getDisplayName(input.fullName),
    adTitle: input.adTitle,
    decision: input.decision,
    dashboardUrl: input.dashboardUrl,
    reviewNote: input.reviewNote ?? null,
    supportEmail: getSupportEmail(),
  });

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
    idempotencyKey: input.idempotencyKey,
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
