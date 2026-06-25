import { sendEmail } from "@/lib/email/transactional-email";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import { COMPANY_INFO } from "@/config/company";
import { getTrimmedEnv } from "@/lib/env";
import {
  renderPasswordResetEmail,
  renderRegistrationConfirmationEmail,
} from "@/lib/email/react-email-templates";
import { getBaseUrl } from "@/lib/site-url";

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

function getAppUrl(): string {
  return getBaseUrl();
}

function getSupportEmail(): string {
  return getTrimmedEnv("EMAIL_REPLY_TO") || COMPANY_INFO.supportEmail;
}

function getDisplayName(fullName?: string): string {
  const value = (fullName || "").trim();
  return value.length > 0 ? value : "Používateľ";
}

export async function sendRegistrationConfirmationEmail(
  params: RegistrationEmailParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlBody = await renderRegistrationConfirmationEmail({
      userName: getDisplayName(params.fullName),
      confirmationUrl: params.confirmationUrl,
      loginUrl: `${getAppUrl()}/auth/login`,
    });

    const result = await sendEmail({
      to: params.email,
      subject: "Potvrdenie registrácie - Autobazar123",
      htmlBody,
      textBody: [
        "Potvrďte registráciu na Autobazar123.",
        "",
        `Dokončite aktiváciu účtu tu: ${params.confirmationUrl}`,
        `Prihlásenie po potvrdení: ${getAppUrl()}/auth/login`,
      ].join("\n"),
      replyTo: getSupportEmail(),
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
      subject: "Potvrdenie registrácie - Autobazar123",
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
    const supportEmail = getSupportEmail();
    const htmlBody = await renderPasswordResetEmail({
      userName: getDisplayName(params.fullName),
      resetUrl: params.resetUrl,
      supportEmail,
    });

    const result = await sendEmail({
      to: params.email,
      subject: "Obnovenie hesla - Autobazar123",
      htmlBody,
      textBody: [
        "Obnovenie hesla pre účet Autobazar123.",
        "",
        `Nastavte nové heslo tu: ${params.resetUrl}`,
        "Ak ste o zmenu hesla nežiadali, tento e-mail môžete ignorovať.",
        `Podpora: ${supportEmail}`,
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
      subject: "Obnovenie hesla - Autobazar123",
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
