export type HumanInquiryProofAd = {
  id: string | null;
  sellerId: string | null;
};

export type HumanInquiryProofBuyer = {
  id: string | null;
  found: boolean;
};

export type HumanInquiryProofInquiry = {
  id: string;
  adId: string | null;
  senderId: string | null;
  recipientId: string | null;
  createdAt: string | null;
};

export type HumanInquiryProofInput = {
  ad: HumanInquiryProofAd | null;
  buyerProfile: HumanInquiryProofBuyer | null;
  inquiries: HumanInquiryProofInquiry[];
  sinceIso: string;
  privacyCanary?: {
    buyerEmail?: string;
    message?: string;
  };
};

export type HumanInquiryProofEvaluation = {
  ok: boolean;
  summary: {
    adFound: boolean;
    buyerFound: boolean;
    matchingInquiries: number;
    freshMatchingInquiries: number;
    sellerRecipientMatches: number;
  };
  latestProof?: {
    id: string;
    adId: string;
    createdAt: string;
  };
  errors: string[];
};

function parseTime(value: string | null): number {
  if (!value) {
    return Number.NaN;
  }

  return Date.parse(value);
}

function isAtOrAfter(value: string | null, sinceIso: string): boolean {
  const timestamp = parseTime(value);
  const since = parseTime(sinceIso);
  return Number.isFinite(timestamp) && Number.isFinite(since) && timestamp >= since;
}

function sortByNewest(
  rows: HumanInquiryProofInquiry[],
): HumanInquiryProofInquiry[] {
  return [...rows].sort((left, right) => {
    const rightTime = parseTime(right.createdAt);
    const leftTime = parseTime(left.createdAt);
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
  });
}

export function validateSupabaseProjectUrl(
  supabaseUrl: string,
  expectedProjectRef: string,
): string[] {
  const errors: string[] = [];
  let parsed: URL;

  try {
    parsed = new URL(supabaseUrl);
  } catch {
    return ["NEXT_PUBLIC_SUPABASE_URL is not a valid URL."];
  }

  if (parsed.protocol !== "https:") {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be a remote Supabase project URL.");
  }

  const expectedHost = `${expectedProjectRef}.supabase.co`;
  if (parsed.hostname !== expectedHost) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL does not match the expected project ref.");
  }

  return errors;
}

export function evaluateHumanInquiryProof(
  input: HumanInquiryProofInput,
): HumanInquiryProofEvaluation {
  const adId = input.ad?.id ?? null;
  const sellerId = input.ad?.sellerId ?? null;
  const buyerId = input.buyerProfile?.id ?? null;
  const adFound = Boolean(adId && sellerId);
  const buyerFound = Boolean(input.buyerProfile?.found && buyerId);

  const matchingInquiries = input.inquiries.filter(
    (inquiry) =>
      (!adId || inquiry.adId === adId) &&
      (!buyerId || inquiry.senderId === buyerId),
  );
  const freshMatchingInquiries = matchingInquiries.filter((inquiry) =>
    isAtOrAfter(inquiry.createdAt, input.sinceIso),
  );
  const sellerRecipientMatches = freshMatchingInquiries.filter(
    (inquiry) => Boolean(sellerId) && inquiry.recipientId === sellerId,
  );

  const errors: string[] = [];
  if (!adFound) {
    errors.push("Target listing was not found or has no seller id.");
  }
  if (!buyerFound) {
    errors.push("Buyer profile was not found.");
  }
  if (matchingInquiries.length === 0) {
    errors.push("No matching human inquiry proof row was found.");
  } else if (freshMatchingInquiries.length === 0) {
    errors.push("No matching inquiry is inside the proof window.");
  } else if (sellerRecipientMatches.length === 0) {
    errors.push("No matching inquiry routes to the listing seller.");
  }

  const latest = sortByNewest(sellerRecipientMatches)[0];

  return {
    ok: errors.length === 0,
    summary: {
      adFound,
      buyerFound,
      matchingInquiries: matchingInquiries.length,
      freshMatchingInquiries: freshMatchingInquiries.length,
      sellerRecipientMatches: sellerRecipientMatches.length,
    },
    ...(latest && latest.adId && latest.createdAt
      ? {
          latestProof: {
            id: latest.id,
            adId: latest.adId,
            createdAt: latest.createdAt,
          },
        }
      : {}),
    errors,
  };
}
