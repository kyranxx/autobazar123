import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/transactional-email";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import { getTrimmedEnv } from "@/lib/env";
import {
  renderPaymentConfirmationEmail,
  renderPaymentFailureEmail,
  renderInvoiceEmail,
} from "@/lib/email/react-email-templates";
import { getBaseUrl } from "@/lib/site-url";

interface PaymentConfirmationData {
  userEmail: string;
  userName?: string;
  summaryLabel: string;
  summaryValue: string;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  transactionId: string;
  dashboardUrl?: string;
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
  return getBaseUrl();
}

function getSupabaseAdmin() {
  const url = getTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getTrimmedEnv("SUPABASE_SERVICE_ROLE_KEY");

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
    billing_transaction_id: params.transactionId,
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
    const dashboardUrl = data.dashboardUrl || `${getAppUrl()}/moj-ucet`;
    const htmlBody = await renderPaymentConfirmationEmail({
      userName: data.userName || "Používateľ",
      summaryLabel: data.summaryLabel,
      summaryValue: data.summaryValue,
      amount: data.amount,
      currency: data.currency,
      invoiceUrl: data.invoiceUrl,
      transactionId: data.transactionId,
      dashboardUrl,
    });

    const emailResult = await sendEmail({
      to: data.userEmail,
      subject: "Platba potvrdená",
      htmlBody,
      textBody: [
        "Platba bola potvrdená.",
        `${data.summaryLabel}: ${data.summaryValue}`,
        `Suma: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`,
        `Účet: ${dashboardUrl}`,
        data.invoiceUrl ? `Faktúra: ${data.invoiceUrl}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
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

    await logEmailDelivery({
      emailType: "payment-confirmation",
      templateKey: "payment_confirmation",
      recipientEmail: data.userEmail,
      subject: "Platba potvrdená",
      status: emailResult.success ? "sent" : "failed",
      providerMessageId: emailResult.messageId,
      errorMessage: emailResult.error,
      metadata: {
        transactionId: data.transactionId,
        summaryLabel: data.summaryLabel,
        summaryValue: data.summaryValue,
        amount: data.amount,
        currency: data.currency,
      },
      htmlPreview: htmlBody,
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
      retryUrl: `${getAppUrl()}/ceny`,
    });

    const emailResult = await sendEmail({
      to: data.userEmail,
      subject: `Platba sa nepodarila - ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`,
      htmlBody,
      textBody: [
        "Platba sa nepodarila.",
        `Suma: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`,
        `Dôvod: ${data.failureReason}`,
        `Skúsiť znova: ${getAppUrl()}/ceny`,
      ].join("\n"),
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

    await logEmailDelivery({
      emailType: "payment-failure",
      templateKey: "payment_failure",
      recipientEmail: data.userEmail,
      subject: `Platba sa nepodarila - ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`,
      status: emailResult.success ? "sent" : "failed",
      providerMessageId: emailResult.messageId,
      errorMessage: emailResult.error,
      metadata: {
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        reason: data.failureReason,
      },
      htmlPreview: htmlBody,
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
    const htmlBody = await renderInvoiceEmail({
      userName: userName || "Používateľ",
      invoiceUrl,
    });

    const emailResult = await sendEmail({
      to: userEmail,
      subject: "Vaša faktúra - Autobazar123",
      htmlBody,
      textBody: ["Vaša faktúra je pripravená.", `Otvoriť faktúru: ${invoiceUrl}`].join(
        "\n",
      ),
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

    await logEmailDelivery({
      emailType: "invoice",
      templateKey: "invoice",
      recipientEmail: userEmail,
      subject: "Vaša faktúra - Autobazar123",
      status: emailResult.success ? "sent" : "failed",
      providerMessageId: emailResult.messageId,
      errorMessage: emailResult.error,
      metadata: {
        transactionId,
        invoiceUrl,
      },
      htmlPreview: htmlBody,
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
