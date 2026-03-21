import { sendEmail } from "@/lib/email/transactional-email";
import { logEmailDelivery } from "@/lib/email/email-delivery-log";
import { getTrimmedEnv } from "@/lib/env";

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

function buildSavedSearchHtml(input: SavedSearchAlertInput): string {
  const listingsMarkup = input.listings
    .map(
      (listing) => `
        <li style="margin:0 0 14px;padding:0">
          <a href="${listing.href}" style="color:#0f766e;text-decoration:none;font-weight:600">${listing.title}</a>
          <div style="font-size:13px;line-height:20px;color:#475569">
            ${formatCurrency(listing.priceEur)}${listing.locationCity ? ` • ${listing.locationCity}` : ""}
          </div>
        </li>
      `,
    )
    .join("");

  return `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f6f4ef;padding:24px;color:#1f2937">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e8e2d3;overflow:hidden">
        <div style="background:#0f766e;padding:24px 28px;color:#ffffff">
          <div style="font-size:12px;opacity:.9">Autobazar123</div>
          <h1 style="margin:8px 0 0;font-size:26px;line-height:32px">Nové ponuky pre uložené vyhľadávanie</h1>
        </div>
        <div style="padding:24px 28px">
          <p style="margin:0 0 12px;font-size:16px;line-height:24px">Ahoj ${getDisplayName(input.fullName)},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:24px">
            našli sme nové inzeráty pre vyhľadávanie <strong>${input.label}</strong>.
          </p>
          <ul style="padding-left:20px;margin:0">${listingsMarkup}</ul>
          <div style="margin-top:24px">
            <a href="${input.resultsPageUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600">
              Otvoriť výsledky
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildSavedAdHtml(input: SavedAdAlertInput): string {
  const signals = [
    typeof input.priceDropAmount === "number" && input.priceDropAmount > 0
      ? `Cena klesla o ${formatCurrency(input.priceDropAmount)}`
      : null,
    input.statusLabel ? `Stav inzerátu je teraz ${input.statusLabel}` : null,
  ]
    .filter(Boolean)
    .join("<br/>");

  return `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f6f4ef;padding:24px;color:#1f2937">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e8e2d3;overflow:hidden">
        <div style="background:#0f766e;padding:24px 28px;color:#ffffff">
          <div style="font-size:12px;opacity:.9">Autobazar123</div>
          <h1 style="margin:8px 0 0;font-size:26px;line-height:32px">Zmena na uloženom inzeráte</h1>
        </div>
        <div style="padding:24px 28px">
          <p style="margin:0 0 12px;font-size:16px;line-height:24px">Ahoj ${getDisplayName(input.fullName)},</p>
          <p style="margin:0 0 12px;font-size:15px;line-height:24px">
            na uloženom inzeráte <strong>${input.adTitle}</strong> sme zaznamenali zmenu.
          </p>
          <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#475569">${signals}</p>
          ${
            typeof input.currentPriceEur === "number"
              ? `<p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#475569">Aktuálna cena: ${formatCurrency(input.currentPriceEur)}</p>`
              : ""
          }
          <div style="margin-top:24px">
            <a href="${input.adUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600">
              Otvoriť inzerát
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function sendSavedSearchAlertEmail(
  input: SavedSearchAlertInput,
): Promise<{ success: boolean; error?: string }> {
  const subject = `Nové ponuky pre ${input.label} - Autobazar123`;
  const htmlBody = buildSavedSearchHtml(input);

  const result = await sendEmail({
    to: input.to,
    subject,
    htmlBody,
    textBody: `Našli sme ${input.listings.length} nové ponuky pre ${input.label}. Otvorte výsledky: ${input.resultsPageUrl}`,
    replyTo: getTrimmedEnv("EMAIL_REPLY_TO") || "support@autobazar123.sk",
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
  const htmlBody = buildSavedAdHtml(input);

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
    replyTo: getTrimmedEnv("EMAIL_REPLY_TO") || "support@autobazar123.sk",
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
