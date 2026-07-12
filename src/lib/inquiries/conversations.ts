type InquiryAdRow = {
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
  is_qualified: boolean;
  qualified_at: string | null;
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
  isQualified: boolean;
  qualifiedAt: string | null;
  canQualify: boolean;
};

const FALLBACK_CAR_PHOTO = "/placeholder-car.jpg";
const FALLBACK_CAR_TITLE = "Inzerát";
const INCOMING_LABEL = "Záujemca";
const OUTGOING_LABEL = "Predajca";

type InquiryConversationCopy = {
  fallbackCarTitle?: string;
  incomingLabel?: string;
  outgoingLabel?: string;
};

function parseDate(input: string): number {
  const parsed = Date.parse(input);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCarTitle(ad: InquiryAdRow | null, fallbackCarTitle = FALLBACK_CAR_TITLE): string {
  if (!ad) return fallbackCarTitle;
  const brand = ad.brand?.trim() || "";
  const model = ad.model?.trim() || "";
  const combined = `${brand} ${model}`.trim();
  return combined || fallbackCarTitle;
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
  copy: InquiryConversationCopy = {},
): InquiryConversation[] {
  const fallbackCarTitle = copy.fallbackCarTitle ?? FALLBACK_CAR_TITLE;
  const incomingLabel = copy.incomingLabel ?? INCOMING_LABEL;
  const outgoingLabel = copy.outgoingLabel ?? OUTGOING_LABEL;

  return [...inquiries]
    .sort((left, right) => parseDate(right.created_at) - parseDate(left.created_at))
    .map((inquiry) => {
      const direction = getInquiryDirection(inquiry, currentUserId);
      const unread = direction === "incoming" && !inquiry.is_read ? 1 : 0;
      const senderName = getDisplayName(
        profileNames,
        inquiry.sender_id,
        incomingLabel,
      );
      const counterpartyId =
        direction === "incoming" ? inquiry.sender_id : inquiry.recipient_id;
      const counterpartyName = getDisplayName(
        profileNames,
        counterpartyId,
        direction === "incoming" ? incomingLabel : outgoingLabel,
      );

      return {
        id: inquiry.id,
        inquiryId: inquiry.id,
        adId: inquiry.ads?.id || null,
        direction,
        counterpartyId,
        counterpartyName,
        senderName,
        carTitle: getCarTitle(inquiry.ads, fallbackCarTitle),
        carPhoto: getCarPhoto(inquiry.ads),
        adReference: inquiry.ads?.id || "N/A",
        lastMessage: inquiry.message,
        lastMessageTime: inquiry.created_at,
        unread,
        isQualified: Boolean(inquiry.is_qualified),
        qualifiedAt: inquiry.qualified_at || null,
        canQualify:
          direction === "incoming" && inquiry.ads?.seller_id === currentUserId,
      };
    });
}
