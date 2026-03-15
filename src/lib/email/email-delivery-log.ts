import { createClient } from "@supabase/supabase-js";

type EmailDeliveryStatus = "sent" | "failed";

type EmailDeliveryLogInput = {
  emailType: string;
  templateKey: string;
  recipientEmail: string;
  subject: string;
  status: EmailDeliveryStatus;
  provider?: string;
  providerMessageId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  htmlPreview?: string;
};

function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getProvider(): string {
  return "resend";
}

function buildHtmlPreview(html?: string): string | null {
  if (!html) return null;
  const compact = html.replace(/\s+/g, " ").trim();
  if (!compact) return null;
  return compact.slice(0, 8000);
}

export async function logEmailDelivery(input: EmailDeliveryLogInput): Promise<void> {
  const client = getServiceRoleClient();
  if (!client) {
    return;
  }

  const payload = {
    email_type: input.emailType,
    template_key: input.templateKey,
    recipient_email: input.recipientEmail,
    subject: input.subject,
    status: input.status,
    provider: input.provider || getProvider(),
    provider_message_id: input.providerMessageId || null,
    error_message: input.errorMessage || null,
    metadata: input.metadata || null,
    html_preview: buildHtmlPreview(input.htmlPreview),
  };

  const { error } = await client.from("email_deliveries").insert(payload);

  if (error) {
    console.error("Failed to write email delivery log:", error.message);
  }
}
