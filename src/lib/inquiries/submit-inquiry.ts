type InquiryInsertRow = {
  ad_id: string;
  sender_id: string;
  message: string;
  phone: string | null;
};

export type SubmitInquiryInput = {
  adId: string;
  senderId: string;
  message: string;
  phone?: string | null;
};

export type SubmitInquiryResult =
  | { ok: true }
  | { ok: false; error: string };

type SupabaseInsertResult = {
  error: { message?: string } | null;
};

export interface InquiryInsertClient {
  from(table: "inquiries"): {
    insert(payload: InquiryInsertRow): PromiseLike<SupabaseInsertResult>;
  };
}

const DEFAULT_SUBMIT_ERROR = "Nepodarilo sa odoslat dopyt.";

export function normalizeInquiryMessage(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\u3000/g, " ").trim();
}

export async function submitInquiry(
  client: InquiryInsertClient,
  input: SubmitInquiryInput,
): Promise<SubmitInquiryResult> {
  const message = normalizeInquiryMessage(input.message);

  if (!message) {
    return { ok: false, error: "Sprava nemoze byt prazdna." };
  }

  const { error } = await client.from("inquiries").insert({
    ad_id: input.adId,
    sender_id: input.senderId,
    message,
    phone: input.phone ?? null,
  });

  if (error) {
    return { ok: false, error: error.message || DEFAULT_SUBMIT_ERROR };
  }

  return { ok: true };
}
