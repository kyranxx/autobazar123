export type InquiryAdRow = {
  id: string;
  brand: string | null;
  model: string | null;
  photos_json: string[] | null;
  seller_id: string | null;
};

export type InquiryRow = {
  id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ads: InquiryAdRow | null;
};

export type InquiryDirection = "incoming" | "outgoing";

export type InquiryConversation = {
  id: string;
  inquiryId: string;
  adId: string | null;
  direction: InquiryDirection;
  counterpartyLabel: string;
  carTitle: string;
  carPhoto: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
};

const FALLBACK_CAR_PHOTO = "/placeholder-car.jpg";
const FALLBACK_CAR_TITLE = "Inzerat";
const INCOMING_LABEL = "Zaujemca";
const OUTGOING_LABEL = "Predajca";

function parseDate(input: string): number {
  const parsed = Date.parse(input);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCarTitle(ad: InquiryAdRow | null): string {
  if (!ad) return FALLBACK_CAR_TITLE;
  const brand = ad.brand?.trim() || "";
  const model = ad.model?.trim() || "";
  const combined = `${brand} ${model}`.trim();
  return combined || FALLBACK_CAR_TITLE;
}

function getCarPhoto(ad: InquiryAdRow | null): string {
  if (!ad?.photos_json || ad.photos_json.length === 0) return FALLBACK_CAR_PHOTO;
  const photo = ad.photos_json[0]?.trim();
  return photo || FALLBACK_CAR_PHOTO;
}

export function getInquiryDirection(
  inquiry: InquiryRow,
  currentUserId: string,
): InquiryDirection {
  if (inquiry.ads?.seller_id && inquiry.ads.seller_id === currentUserId) {
    return "incoming";
  }
  return "outgoing";
}

export function mapInquiriesToConversations(
  inquiries: InquiryRow[],
  currentUserId: string,
): InquiryConversation[] {
  return [...inquiries]
    .sort((left, right) => parseDate(right.created_at) - parseDate(left.created_at))
    .map((inquiry) => {
      const direction = getInquiryDirection(inquiry, currentUserId);
      const unread = direction === "incoming" && !inquiry.is_read ? 1 : 0;

      return {
        id: inquiry.id,
        inquiryId: inquiry.id,
        adId: inquiry.ads?.id || null,
        direction,
        counterpartyLabel:
          direction === "incoming" ? INCOMING_LABEL : OUTGOING_LABEL,
        carTitle: getCarTitle(inquiry.ads),
        carPhoto: getCarPhoto(inquiry.ads),
        lastMessage: inquiry.message,
        lastMessageTime: inquiry.created_at,
        unread,
      };
    });
}
