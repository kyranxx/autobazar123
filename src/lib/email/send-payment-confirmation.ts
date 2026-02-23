import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/transactional-email";
import {
  renderPaymentConfirmationEmail,
  renderPaymentFailureEmail,
} from "@/lib/email/react-email-templates";

interface PaymentConfirmationData {
  userEmail: string;
  userName?: string;
  credits: number;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  transactionId: string;
}

interface PaymentFailureData {
  userEmail: string;
  userName?: string;
  amount: number;
  currency: string;
  failureReason: string;
  transactionId: string;
}

type NotificationType = "confirmation" | "failure" | "invoice";
type EmailStatus = "sent" | "failed";

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://autobazar123.sk"
  );
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey);
}

async function logPaymentNotification(params: {
  transactionId: string;
  notificationType: NotificationType;
  userEmail: string;
  status: EmailStatus;
}): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return;
  }

  const { error } = await supabaseAdmin.from("payment_notifications").insert({
    transaction_id: params.transactionId,
    notification_type: params.notificationType,
    user_email: params.userEmail,
    email_status: params.status,
  });

  if (error) {
    console.error("Failed to log payment notification:", error.message);
  }
}

export async function sendPaymentConfirmationEmail(
  data: PaymentConfirmationData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlBody = await renderPaymentConfirmationEmail({
      userName: data.userName || "Používateľ",
      credits: data.credits,
      amount: data.amount,
      currency: data.currency,
      invoiceUrl: data.invoiceUrl,
      transactionId: data.transactionId,
      dashboardUrl: `${getAppUrl()}/moj-ucet`,
    });

    const emailResult = await sendEmail({
      to: data.userEmail,
      subject: `Platba potvrdená - ${data.credits} kreditov`,
      htmlBody,
      textBody: `Platba potvrdená. Kredity: ${data.credits}. Suma: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}.`,
      metadata: {
        transactionId: data.transactionId,
        emailType: "payment-confirmation",
      },
      tags: ["payments", "confirmation"],
    });

    await logPaymentNotification({
      transactionId: data.transactionId,
      notificationType: "confirmation",
      userEmail: data.userEmail,
      status: emailResult.success ? "sent" : "failed",
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || "Email delivery failed",
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending payment confirmation:", errorMessage);

    await logPaymentNotification({
      transactionId: data.transactionId,
      notificationType: "confirmation",
      userEmail: data.userEmail,
      status: "failed",
    });

    return { success: false, error: errorMessage };
  }
}

export async function sendPaymentFailureEmail(
  data: PaymentFailureData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlBody = await renderPaymentFailureEmail({
      userName: data.userName || "Používateľ",
      amount: data.amount,
      currency: data.currency,
      reason: data.failureReason,
      retryUrl: `${getAppUrl()}/kredity`,
    });

    const emailResult = await sendEmail({
      to: data.userEmail,
      subject: `Platba sa nepodarila - ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`,
      htmlBody,
      textBody: `Platba sa nepodarila. Dôvod: ${data.failureReason}.`,
      metadata: {
        transactionId: data.transactionId,
        emailType: "payment-failed",
      },
      tags: ["payments", "failure"],
    });

    await logPaymentNotification({
      transactionId: data.transactionId,
      notificationType: "failure",
      userEmail: data.userEmail,
      status: emailResult.success ? "sent" : "failed",
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || "Email delivery failed",
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending payment failure notification:", errorMessage);

    await logPaymentNotification({
      transactionId: data.transactionId,
      notificationType: "failure",
      userEmail: data.userEmail,
      status: "failed",
    });

    return { success: false, error: errorMessage };
  }
}

export async function sendInvoiceEmail(
  userEmail: string,
  userName: string | undefined,
  invoiceUrl: string,
  transactionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlBody = `
      <html>
        <body style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
          <h1>Vaša faktúra je pripravená</h1>
          <p>Ahoj ${userName || "Používateľ"},</p>
          <p>Doklad k vašej platbe je dostupný na odkaze nižšie.</p>
          <p><a href="${invoiceUrl}">Otvoriť faktúru</a></p>
        </body>
      </html>
    `;

    const emailResult = await sendEmail({
      to: userEmail,
      subject: "Vaša faktúra - Autobazar123",
      htmlBody,
      textBody: `Vaša faktúra je dostupná: ${invoiceUrl}`,
      metadata: {
        transactionId,
        emailType: "invoice",
      },
      tags: ["payments", "invoice"],
    });

    await logPaymentNotification({
      transactionId,
      notificationType: "invoice",
      userEmail,
      status: emailResult.success ? "sent" : "failed",
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || "Email delivery failed",
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending invoice email:", errorMessage);

    await logPaymentNotification({
      transactionId,
      notificationType: "invoice",
      userEmail,
      status: "failed",
    });

    return { success: false, error: errorMessage };
  }
}
