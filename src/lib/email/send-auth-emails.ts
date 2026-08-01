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
import { getMarketConfig } from "@/config/markets";

interface RegistrationEmailParams {
  email: string;
  fullName?: string;
  confirmationUrl: string;
  idempotencyKey?: string;
}

interface PasswordResetEmailParams {
  email: string;
  fullName?: string;
  resetUrl: string;
  idempotencyKey?: string;
}

function getAppUrl(path: string): string {
  return getEmailUrl(path);
}

function getDisplayName(fullName?: string): string {
  const value = (fullName || "").trim();
  return value.length > 0
    ? value
    : getMarketConfig(getEmailMarketCode()).copy.authEmail.defaultUserName;
}

export async function sendRegistrationConfirmationEmail(
  params: RegistrationEmailParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailCopy = getMarketConfig(getEmailMarketCode()).copy.authEmail;
    const brandName = getEmailBrandName();
    const subject = `${emailCopy.registrationSubject} - ${brandName}`;
    const htmlBody = await renderRegistrationConfirmationEmail({
      userName: getDisplayName(params.fullName),
      confirmationUrl: params.confirmationUrl,
      loginUrl: getAppUrl("/auth/login"),
    });

    const result = await sendEmail({
      to: params.email,
      subject,
      htmlBody,
      textBody: [
        `${emailCopy.registrationIntro} ${brandName}.`,
        "",
        `${emailCopy.registrationAction}: ${params.confirmationUrl}`,
        `${emailCopy.registrationLogin}: ${getAppUrl("/auth/login")}`,
      ].join("\n"),
      replyTo: getEmailSupportEmail(),
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
    const emailCopy = getMarketConfig(getEmailMarketCode()).copy.authEmail;
    const brandName = getEmailBrandName();
    const subject = `${emailCopy.passwordResetSubject} - ${brandName}`;
    const supportEmail = getEmailSupportEmail();
    const htmlBody = await renderPasswordResetEmail({
      userName: getDisplayName(params.fullName),
      resetUrl: params.resetUrl,
      supportEmail,
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
