import { sendEmail } from "@/lib/email/transactional-email";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import { COMPANY_INFO } from "@/config/company";
import { getTrimmedEnv } from "@/lib/env";
import {
  renderPasswordResetEmail,
  renderRegistrationConfirmationEmail,
} from "@/lib/email/react-email-templates";
import { getBaseUrl } from "@/lib/site-url";
import { getEmailBrandName, getEmailMarketCode } from "@/lib/email/email-market";

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
  return value.length > 0 ? value : getEmailMarketCode() === "RO" ? "Utilizator" : "Používateľ";
}

export async function sendRegistrationConfirmationEmail(
  params: RegistrationEmailParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const isRomanian = getEmailMarketCode() === "RO";
    const brandName = getEmailBrandName();
    const subject = isRomanian
      ? `Confirmarea înregistrării - ${brandName}`
      : `Potvrdenie registrácie - ${brandName}`;
    const htmlBody = await renderRegistrationConfirmationEmail({
      userName: getDisplayName(params.fullName),
      confirmationUrl: params.confirmationUrl,
      loginUrl: `${getAppUrl()}/auth/login`,
    });

    const result = await sendEmail({
      to: params.email,
      subject,
      htmlBody,
      textBody: [
        isRomanian
          ? `Confirmă înregistrarea pe ${brandName}.`
          : `Potvrďte registráciu na ${brandName}.`,
        "",
        isRomanian
          ? `Finalizează activarea contului aici: ${params.confirmationUrl}`
          : `Dokončite aktiváciu účtu tu: ${params.confirmationUrl}`,
        isRomanian
          ? `Autentificare după confirmare: ${getAppUrl()}/auth/login`
          : `Prihlásenie po potvrdení: ${getAppUrl()}/auth/login`,
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
    const isRomanian = getEmailMarketCode() === "RO";
    const brandName = getEmailBrandName();
    const subject = isRomanian
      ? `Resetarea parolei - ${brandName}`
      : `Obnovenie hesla - ${brandName}`;
    const supportEmail = getSupportEmail();
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
        isRomanian
          ? `Resetarea parolei pentru contul ${brandName}.`
          : `Obnovenie hesla pre účet ${brandName}.`,
        "",
        isRomanian
          ? `Setează parola nouă aici: ${params.resetUrl}`
          : `Nastavte nové heslo tu: ${params.resetUrl}`,
        isRomanian
          ? "Dacă nu ai solicitat schimbarea parolei, poți ignora acest e-mail."
          : "Ak ste o zmenu hesla nežiadali, tento e-mail môžete ignorovať.",
        `${isRomanian ? "Asistență" : "Podpora"}: ${supportEmail}`,
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
