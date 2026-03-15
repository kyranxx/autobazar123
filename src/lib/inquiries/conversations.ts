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
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ads: InquiryAdRow | null;
};

type InquiryDirection = "incoming" | "outgoing";

type InquiryConversation = {
  id: string;
  inquiryId: string;
  adId: string | null;
  direction: InquiryDirection;
  counterpartyId: string | null;
  counterpartyName: string;
  senderName: string;
  carTitle: string;
  carPhoto: string;
  adReference: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
};

const FALLBACK_CAR_PHOTO = "/placeholder-car.jpg";
const FALLBACK_CAR_TITLE = "Inzerát";
const INCOMING_LABEL = "Záujemca";
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

function getDisplayName(
  profileNames: Record<string, string>,
  profileId: string | null,
  fallback: string,
): string {
  if (!profileId) return fallback;
  const value = profileNames[profileId];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

export function getInquiryDirection(
  inquiry: InquiryRow,
  currentUserId: string,
): InquiryDirection {
  if (inquiry.sender_id === currentUserId) {
    return "outgoing";
  }
  return "incoming";
}

export function mapInquiriesToConversations(
  inquiries: InquiryRow[],
  currentUserId: string,
  profileNames: Record<string, string> = {},
): InquiryConversation[] {
  return [...inquiries]
    .sort((left, right) => parseDate(right.created_at) - parseDate(left.created_at))
    .map((inquiry) => {
      const direction = getInquiryDirection(inquiry, currentUserId);
      const unread = direction === "incoming" && !inquiry.is_read ? 1 : 0;
      const senderName = getDisplayName(
        profileNames,
        inquiry.sender_id,
        INCOMING_LABEL,
      );
      const counterpartyId =
        direction === "incoming" ? inquiry.sender_id : inquiry.recipient_id;
      const counterpartyName = getDisplayName(
        profileNames,
        counterpartyId,
        direction === "incoming" ? INCOMING_LABEL : OUTGOING_LABEL,
      );

      return {
        id: inquiry.id,
        inquiryId: inquiry.id,
        adId: inquiry.ads?.id || null,
        direction,
        counterpartyId,
        counterpartyName,
        senderName,
        carTitle: getCarTitle(inquiry.ads),
        carPhoto: getCarPhoto(inquiry.ads),
        adReference: inquiry.ads?.id || "N/A",
        lastMessage: inquiry.message,
        lastMessageTime: inquiry.created_at,
        unread,
      };
    });
}
