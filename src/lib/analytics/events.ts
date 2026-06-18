import { z } from "zod";

export const ANALYTICS_EVENT_NAME_REGEX = /^[a-z]+(?:_[a-z0-9]+)+$/;

const searchQuerySubmittedSchema = z.object({
  query: z.string().min(1).max(120),
  filtersCount: z.number().int().min(0),
  resultCount: z.number().int().min(0).optional(),
  locale: z.enum(["sk", "en", "hu"]).optional(),
});

const homepageCtaClickedSchema = z.object({
  cta: z.enum([
    "register",
    "sell_car",
    "dealers",
    "family_suv",
    "city_cars",
    "automatics",
    "utility",
    "motorbikes",
    "all_cars",
    "view_all_brands",
    "popular_brand",
  ]),
  surface: z.enum([
    "home_account",
    "home_seller_panel",
    "home_seller_promo",
    "home_quick_links",
    "home_quick_search",
    "home_brand_logos",
  ]),
  destination: z.string().min(1).max(160),
  locale: z.enum(["sk", "en", "hu"]).optional(),
});

const listingViewedSchema = z.object({
  adId: z.string().uuid(),
  source: z.enum([
    "search",
    "featured",
    "direct",
    "dealer_page",
    "seo_city_route",
    "seo_model_route",
  ]),
  position: z.number().int().min(0).optional(),
});

const sellerContactStartedSchema = z.object({
  adId: z.string().uuid(),
  channel: z.enum(["phone", "message"]),
  isDealer: z.boolean().optional(),
});

const listingCreatedSchema = z.object({
  adId: z.string().uuid(),
  isDealer: z.boolean(),
  photosCount: z.number().int().min(0),
});

const listingSubmittedSchema = z.object({
  adId: z.string().uuid(),
  photosCount: z.number().int().min(0),
  brand: z.string().min(1).max(80).optional(),
  model: z.string().min(1).max(80).optional(),
  locationCity: z.string().min(1).max(120).optional(),
  locationDistrict: z.string().min(1).max(120).optional(),
});

const listingPublishedSchema = z.object({
  adId: z.string().uuid(),
  photosCount: z.number().int().min(0),
  brand: z.string().min(1).max(80).optional(),
  model: z.string().min(1).max(80).optional(),
  locationCity: z.string().min(1).max(120).optional(),
  locationDistrict: z.string().min(1).max(120).optional(),
});

const leadSubmittedSchema = z.object({
  leadId: z.string().uuid(),
  adId: z.string().uuid(),
  channel: z.enum(["message"]),
});

const leadQualifiedSchema = z.object({
  leadId: z.string().uuid(),
  adId: z.string().uuid(),
  qualificationMethod: z.enum(["seller_dashboard_manual"]),
});

const saleConfirmedSchema = z.object({
  adId: z.string().uuid(),
  confirmationMethod: z.enum(["seller_dashboard_manual"]),
  sellerType: z.enum(["private", "dealer"]),
});

const listingApprovedSchema = z.object({
  adId: z.string().uuid(),
  approvalMethod: z.enum(["admin_moderation"]),
  sellerType: z.enum(["private", "dealer"]),
});

const listingFeaturePurchasedSchema = z.object({
  adId: z.string().uuid(),
  featureType: z.enum(["exclusive", "premium"]),
  purchaseSurface: z.enum(["account_dashboard", "dealer_bulk"]),
  valueEur: z.number().positive(),
});

const listingRemovedByModerationSchema = z.object({
  adId: z.string().uuid(),
  removalReason: z.enum(["admin_rejection"]),
  sellerType: z.enum(["private", "dealer"]),
});
const listingMarkedSoldSchema = z.object({
  adId: z.string().uuid(),
  markedVia: z.enum(["dashboard"]),
});

const paymentCheckoutStartedSchema = z.object({
  checkoutType: z.enum(["dealer_topup", "private_listing_action"]),
  valueEur: z.number().positive(),
});

const paymentCheckoutCompletedSchema = z.object({
  checkoutType: z.enum(["dealer_topup", "private_listing_action"]),
  valueEur: z.number().positive(),
  paymentProvider: z.enum(["stripe"]),
});

export const ANALYTICS_EVENT_SCHEMAS = {
  search_query_submitted: searchQuerySubmittedSchema,
  homepage_cta_clicked: homepageCtaClickedSchema,
  listing_viewed: listingViewedSchema,
  seller_contact_started: sellerContactStartedSchema,
  listing_created: listingCreatedSchema,
  listing_submitted: listingSubmittedSchema,
  listing_published: listingPublishedSchema,
  lead_submitted: leadSubmittedSchema,
  lead_qualified: leadQualifiedSchema,
  sale_confirmed: saleConfirmedSchema,
  listing_approved: listingApprovedSchema,
  listing_feature_purchased: listingFeaturePurchasedSchema,
  listing_removed_by_moderation: listingRemovedByModerationSchema,
  listing_marked_sold: listingMarkedSoldSchema,
  payment_checkout_started: paymentCheckoutStartedSchema,
  payment_checkout_completed: paymentCheckoutCompletedSchema,
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENT_SCHEMAS;

export type AnalyticsEventPayload<Name extends AnalyticsEventName> = z.infer<
  (typeof ANALYTICS_EVENT_SCHEMAS)[Name]
>;

export function isValidAnalyticsEventName(value: string): value is AnalyticsEventName {
  if (!ANALYTICS_EVENT_NAME_REGEX.test(value)) return false;
  return value in ANALYTICS_EVENT_SCHEMAS;
}

export function validateAnalyticsEvent<T extends AnalyticsEventName>(
  name: T,
  payload: unknown,
) {
  return ANALYTICS_EVENT_SCHEMAS[name].safeParse(payload);
}

const ANALYTICS_COOKIE_CONSENT_KEY = "autobazar123_cookie_consent";
const LEGACY_COOKIE_PREFERENCES_KEY = "cookiePreferences";

interface CookieConsentLike {
  analytics?: boolean;
}

function parseJsonObject(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readConsentFlag(record: Record<string, unknown> | null): boolean | null {
  if (!record) return null;
  const analyticsValue = (record as CookieConsentLike).analytics;
  if (typeof analyticsValue !== "boolean") return null;
  return analyticsValue;
}

export function resolveAnalyticsConsentFromStorage(
  storage: Pick<Storage, "getItem">,
): boolean {
  const primary = parseJsonObject(storage.getItem(ANALYTICS_COOKIE_CONSENT_KEY));
  const primaryFlag = readConsentFlag(primary);
  if (primaryFlag !== null) return primaryFlag;

  const legacy = parseJsonObject(storage.getItem(LEGACY_COOKIE_PREFERENCES_KEY));
  const legacyFlag = readConsentFlag(legacy);
  if (legacyFlag !== null) return legacyFlag;

  return false;
}

let analyticsUserId: string | null = null;

export function setAnalyticsUserId(userId: string | null) {
  analyticsUserId = userId;
}

export function getAnalyticsUserId(): string | null {
  return analyticsUserId;
}
