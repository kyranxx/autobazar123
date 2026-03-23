import { sendEmail } from "@/lib/email/transactional-email";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import { COMPANY_INFO } from "@/config/company";
import { getTrimmedEnv } from "@/lib/env";
import {
  renderSavedAdAlertEmail,
  renderSavedSearchAlertEmail,
} from "@/lib/email/react-email-templates";

type AlertListing = {
  title: string;
  priceEur: number;
  locationCity?: string | null;
  href: string;
};

type SavedSearchAlertInput = {
  to: string;
  fullName?: string | null;
  label: string;
  resultsPageUrl: string;
  listings: AlertListing[];
};

type SavedAdAlertInput = {
  to: string;
  fullName?: string | null;
  adTitle: string;
  adUrl: string;
  priceDropAmount?: number;
  currentPriceEur?: number;
  statusLabel?: string;
};

function getDisplayName(fullName?: string | null): string {
  const value = (fullName || "").trim();
  return value.length > 0 ? value : "Používateľ";
}

function formatCurrency(value: number): string {
  return `${value.toLocaleString("sk-SK")} EUR`;
}

export async function sendSavedSearchAlertEmail(
  input: SavedSearchAlertInput,
): Promise<{ success: boolean; error?: string }> {
  const subject = `Nové ponuky pre ${input.label} - Autobazar123`;
  const htmlBody = await renderSavedSearchAlertEmail({
    userName: getDisplayName(input.fullName),
    label: input.label,
    resultsPageUrl: input.resultsPageUrl,
    listings: input.listings,
  });

  const result = await sendEmail({
    to: input.to,
    subject,
    htmlBody,
    textBody: `Našli sme ${input.listings.length} nové ponuky pre ${input.label}. Otvorte výsledky: ${input.resultsPageUrl}`,
    replyTo: getTrimmedEnv("EMAIL_REPLY_TO") || COMPANY_INFO.supportEmail,
    metadata: {
      emailType: "saved-search-alert",
    },
    tags: ["alerts", "saved-search"],
  });

  await logEmailDelivery({
    emailType: "saved-search-alert",
    templateKey: "saved_search_alert",
    recipientEmail: input.to,
    subject,
    status: result.success ? "sent" : "failed",
    providerMessageId: result.messageId,
    errorMessage: result.error,
    metadata: {
      label: input.label,
      listings: input.listings.length,
    },
    htmlPreview: htmlBody,
  });

  return result.success
    ? { success: true }
    : { success: false, error: result.error || "Email delivery failed" };
}

export async function sendSavedAdAlertEmail(
  input: SavedAdAlertInput,
): Promise<{ success: boolean; error?: string }> {
  const subject = `Zmena na uloženom inzeráte - ${input.adTitle}`;
  const htmlBody = await renderSavedAdAlertEmail({
    userName: getDisplayName(input.fullName),
    adTitle: input.adTitle,
    adUrl: input.adUrl,
    priceDropAmount: input.priceDropAmount,
    currentPriceEur: input.currentPriceEur,
    statusLabel: input.statusLabel,
  });

  const summary = [
    typeof input.priceDropAmount === "number" && input.priceDropAmount > 0
      ? `Pokles ceny o ${formatCurrency(input.priceDropAmount)}`
      : null,
    input.statusLabel ? `Nový stav: ${input.statusLabel}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const result = await sendEmail({
    to: input.to,
    subject,
    htmlBody,
    textBody: `${input.adTitle}: ${summary}. Detail: ${input.adUrl}`,
    replyTo: getTrimmedEnv("EMAIL_REPLY_TO") || COMPANY_INFO.supportEmail,
    metadata: {
      emailType: "saved-ad-alert",
    },
    tags: ["alerts", "saved-ad"],
  });

  await logEmailDelivery({
    emailType: "saved-ad-alert",
    templateKey: "saved_ad_alert",
    recipientEmail: input.to,
    subject,
    status: result.success ? "sent" : "failed",
    providerMessageId: result.messageId,
    errorMessage: result.error,
    metadata: {
      adTitle: input.adTitle,
      priceDropAmount: input.priceDropAmount ?? null,
      statusLabel: input.statusLabel ?? null,
    },
    htmlPreview: htmlBody,
  });

  return result.success
    ? { success: true }
    : { success: false, error: result.error || "Email delivery failed" };
}
