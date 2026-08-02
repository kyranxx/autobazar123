import { sendEmail } from "@/lib/email/transactional-email";
import {
  getEmailBrandName,
  getEmailMarketCode,
  getEmailSupportEmail,
} from "@/lib/email/email-market";
import type { MarketCode } from "@/config/markets";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import { renderModerationDecisionEmail } from "@/lib/email/react-email-templates";

type ModerationDecision = "approved" | "rejected";

type SendModerationDecisionEmailInput = {
  to: string;
  fullName?: string | null;
  adTitle: string;
  decision: ModerationDecision;
  dashboardUrl: string;
  reviewNote?: string | null;
  marketCode?: MarketCode;
  idempotencyKey?: string;
};

function getDisplayName(fullName?: string | null): string {
  const value = (fullName || "").trim();
  return value.length > 0 ? value : "Používateľ";
}

function getSubject(decision: ModerationDecision, marketCode: MarketCode): string {
  const brandName = getEmailBrandName(marketCode);
  return decision === "approved"
    ? `Váš inzerát bol schválený - ${brandName}`
    : `Váš inzerát potrebuje úpravu - ${brandName}`;
}

export async function sendModerationDecisionEmail(
  input: SendModerationDecisionEmailInput,
): Promise<{ success: boolean; error?: string }> {
  const marketCode = input.marketCode ?? getEmailMarketCode();
  const subject = getSubject(input.decision, marketCode);
  const htmlBody = await renderModerationDecisionEmail({
    userName: getDisplayName(input.fullName),
    adTitle: input.adTitle,
    decision: input.decision,
    dashboardUrl: input.dashboardUrl,
    reviewNote: input.reviewNote ?? null,
    supportEmail: getEmailSupportEmail(marketCode),
    marketCode,
  });

  const result = await sendEmail({
    to: input.to,
    subject,
    htmlBody,
    textBody:
      input.decision === "approved"
        ? `Váš inzerát ${input.adTitle} bol schválený. Dashboard: ${input.dashboardUrl}`
        : `Váš inzerát ${input.adTitle} bol zamietnutý. Dashboard: ${input.dashboardUrl}`,
    replyTo: getEmailSupportEmail(marketCode),
    metadata: {
      emailType: "ad-moderation-decision",
    },
    tags: ["moderation", input.decision],
    marketCode,
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
