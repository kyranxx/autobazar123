import { sendEmail } from "@/lib/email/transactional-email";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import {
  renderPasswordResetEmail,
  renderRegistrationConfirmationEmail,
} from "@/lib/email/react-email-templates";
import {
  getEmailBrandName,
  getEmailMarketCode,
  getEmailSupportEmail,
  getEmailUrl,
} from "@/lib/email/email-market";
import { getMarketConfig, type MarketCode } from "@/config/markets";

interface RegistrationEmailParams {
  email: string;
  fullName?: string;
  confirmationUrl: string;
  marketCode?: MarketCode;
  idempotencyKey?: string;
}

interface PasswordResetEmailParams {
  email: string;
  fullName?: string;
  resetUrl: string;
  marketCode?: MarketCode;
  idempotencyKey?: string;
}

function getAppUrl(path: string, marketCode: MarketCode): string {
  return getEmailUrl(path, marketCode);
}

function getDisplayName(fullName: string | undefined, marketCode: MarketCode): string {
  const value = (fullName || "").trim();
  return value.length > 0
    ? value
    : getMarketConfig(marketCode).copy.authEmail.defaultUserName;
}

export async function sendRegistrationConfirmationEmail(
  params: RegistrationEmailParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const marketCode = params.marketCode ?? getEmailMarketCode();
    const emailCopy = getMarketConfig(marketCode).copy.authEmail;
    const brandName = getEmailBrandName(marketCode);
    const subject = `${emailCopy.registrationSubject} - ${brandName}`;
    const htmlBody = await renderRegistrationConfirmationEmail({
      userName: getDisplayName(params.fullName, marketCode),
      confirmationUrl: params.confirmationUrl,
      loginUrl: getAppUrl("/auth/login", marketCode),
      marketCode,
    });

    const result = await sendEmail({
      to: params.email,
      subject,
      htmlBody,
      textBody: [
        `${emailCopy.registrationIntro} ${brandName}.`,
        "",
        `${emailCopy.registrationAction}: ${params.confirmationUrl}`,
        `${emailCopy.registrationLogin}: ${getAppUrl("/auth/login", marketCode)}`,
      ].join("\n"),
      replyTo: getEmailSupportEmail(marketCode),
      marketCode,
      metadata: {
        emailType: "auth-register-confirmation",
      },
      tags: ["auth", "register", "confirmation"],
      idempotencyKey: params.idempotencyKey,
    });

    await logEmailDelivery({
      emailType: "auth-register-confirmation",
      templateKey: "registration_confirmation",
      recipientEmail: params.email,
      subject,
      status: result.success ? "sent" : "failed",
      providerMessageId: result.messageId,
      errorMessage: result.error,
      metadata: { action: "register" },
      htmlPreview: htmlBody,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Email delivery failed",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendPasswordRecoveryEmail(
  params: PasswordResetEmailParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const marketCode = params.marketCode ?? getEmailMarketCode();
    const emailCopy = getMarketConfig(marketCode).copy.authEmail;
    const brandName = getEmailBrandName(marketCode);
    const subject = `${emailCopy.passwordResetSubject} - ${brandName}`;
    const supportEmail = getEmailSupportEmail(marketCode);
    const htmlBody = await renderPasswordResetEmail({
      userName: getDisplayName(params.fullName, marketCode),
      resetUrl: params.resetUrl,
      supportEmail,
      marketCode,
    });

    const result = await sendEmail({
      to: params.email,
      subject,
      htmlBody,
      textBody: [
        `${emailCopy.passwordResetIntro} ${brandName}.`,
        "",
        `${emailCopy.passwordResetAction}: ${params.resetUrl}`,
        emailCopy.passwordResetIgnore,
        `${emailCopy.supportLabel}: ${supportEmail}`,
      ].join("\n"),
      replyTo: supportEmail,
      marketCode,
      metadata: {
        emailType: "auth-password-reset",
      },
      tags: ["auth", "password-reset"],
      idempotencyKey: params.idempotencyKey,
    });

    await logEmailDelivery({
      emailType: "auth-password-reset",
      templateKey: "password_reset",
      recipientEmail: params.email,
      subject,
      status: result.success ? "sent" : "failed",
      providerMessageId: result.messageId,
      errorMessage: result.error,
      metadata: { action: "password_reset" },
      htmlPreview: htmlBody,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Email delivery failed",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
