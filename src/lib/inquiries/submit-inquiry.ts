type InquiryInsertRow = {
  ad_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  phone: string | null;
};

export type SubmitInquiryInput = {
  adId: string;
  senderId: string;
  recipientId: string;
  message: string;
  phone?: string | null;
};

export type SubmitInquiryResult =
  | { ok: true }
  | { ok: false; error: string };

type SupabaseInsertResult = {
  error: { message?: string } | null;
};

type SupabaseCountResult = {
  count: number | null;
  error: { message?: string } | null;
};

export interface InquiryInsertClient {
  from(table: "inquiries"): {
    select(...args: unknown[]): {
      eq(...args: unknown[]): {
        eq(...args: unknown[]): {
          gte(...args: unknown[]): PromiseLike<SupabaseCountResult>;
        };
      };
    };
    insert(payload: InquiryInsertRow): PromiseLike<SupabaseInsertResult>;
  };
}

const DEFAULT_SUBMIT_ERROR = "Nepodarilo sa odoslať dopyt.";
const MAX_INQUIRIES_PER_WINDOW = 3;
const INQUIRY_RATE_WINDOW_MS = 10 * 60 * 1000;

export function normalizeInquiryMessage(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\u3000/g, " ").trim();
}

export async function submitInquiry(
  client: InquiryInsertClient,
  input: SubmitInquiryInput,
): Promise<SubmitInquiryResult> {
  const message = normalizeInquiryMessage(input.message);

  if (!message) {
    return { ok: false, error: "Správa nemoze byt prazdna." };
  }

  const rateLimitWindowStart = new Date(
    Date.now() - INQUIRY_RATE_WINDOW_MS,
  ).toISOString();
  const { count, error: countError } = await client
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", input.senderId)
    .eq("ad_id", input.adId)
    .gte("created_at", rateLimitWindowStart);

  if (countError) {
    return {
      ok: false,
      error: countError.message || DEFAULT_SUBMIT_ERROR,
    };
  }

  if ((count || 0) >= MAX_INQUIRIES_PER_WINDOW) {
    return {
      ok: false,
      error: "Prilis vela sprav za kratky cas. Skúste to znova o par minút.",
    };
  }

  const { error } = await client.from("inquiries").insert({
    ad_id: input.adId,
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    message,
    phone: input.phone ?? null,
  });

  if (error) {
    return { ok: false, error: error.message || DEFAULT_SUBMIT_ERROR };
  }

  return { ok: true };
}
