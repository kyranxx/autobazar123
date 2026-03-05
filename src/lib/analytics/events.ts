import { z } from "zod";

export const ANALYTICS_EVENT_NAME_REGEX = /^[a-z]+(?:_[a-z0-9]+)+$/;

const searchQuerySubmittedSchema = z.object({
  query: z.string().min(1).max(120),
  filtersCount: z.number().int().min(0),
  resultCount: z.number().int().min(0).optional(),
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

const paymentCheckoutStartedSchema = z.object({
  packageId: z.string().min(1),
  credits: z.number().int().positive(),
  valueEur: z.number().positive(),
});

const paymentCheckoutCompletedSchema = z.object({
  packageId: z.string().min(1),
  credits: z.number().int().positive(),
  valueEur: z.number().positive(),
  paymentProvider: z.enum(["stripe"]),
});

export const ANALYTICS_EVENT_SCHEMAS = {
  search_query_submitted: searchQuerySubmittedSchema,
  listing_viewed: listingViewedSchema,
  seller_contact_started: sellerContactStartedSchema,
  listing_created: listingCreatedSchema,
  payment_credit_checkout_started: paymentCheckoutStartedSchema,
  payment_credit_checkout_completed: paymentCheckoutCompletedSchema,
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
