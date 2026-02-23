import { sendEmail } from "@/lib/email/transactional-email";
import {
  renderPasswordResetEmail,
  renderRegistrationConfirmationEmail,
} from "@/lib/email/react-email-templates";

interface RegistrationEmailParams {
  email: string;
  fullName?: string;
  confirmationUrl: string;
}

interface PasswordResetEmailParams {
  email: string;
  fullName?: string;
  resetUrl: string;
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://autobazar123.sk"
  );
}

function getSupportEmail(): string {
  return process.env.EMAIL_REPLY_TO || "support@autobazar123.sk";
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
      textBody: `Dokončite registráciu: ${params.confirmationUrl}`,
      replyTo: getSupportEmail(),
      metadata: {
        emailType: "auth-register-confirmation",
      },
      tags: ["auth", "register", "confirmation"],
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
      textBody: `Obnovte heslo cez odkaz: ${params.resetUrl}`,
      replyTo: supportEmail,
      metadata: {
        emailType: "auth-password-reset",
      },
      tags: ["auth", "password-reset"],
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
