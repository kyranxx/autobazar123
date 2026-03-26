import { describe, expect, it } from "vitest";

import {
  ANALYTICS_EVENT_SCHEMAS,
  ANALYTICS_EVENT_NAME_REGEX,
  isValidAnalyticsEventName,
  validateAnalyticsEvent,
  resolveAnalyticsConsentFromStorage,
} from "@/lib/analytics/events";

describe("analytics event taxonomy", () => {
  it("uses snake_case names and valid regex format", () => {
    for (const name of Object.keys(ANALYTICS_EVENT_SCHEMAS)) {
      expect(ANALYTICS_EVENT_NAME_REGEX.test(name)).toBe(true);
      expect(isValidAnalyticsEventName(name)).toBe(true);
    }
    expect(isValidAnalyticsEventName("BadName")).toBe(false);
  });

  it("validates payload for listing_viewed", () => {
    const valid = validateAnalyticsEvent("listing_viewed", {
      adId: "b6ed0258-6c33-4d80-9987-a741983515f8",
      source: "search",
      position: 2,
    });
    expect(valid.success).toBe(true);

    const invalid = validateAnalyticsEvent("listing_viewed", {
      adId: "not-a-uuid",
      source: "unknown",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates homepage_cta_clicked payload", () => {
    const valid = validateAnalyticsEvent("homepage_cta_clicked", {
      cta: "register",
      surface: "home_account",
      destination: "/auth/register",
      locale: "sk",
    });
    expect(valid.success).toBe(true);

    const invalid = validateAnalyticsEvent("homepage_cta_clicked", {
      cta: "unknown",
      surface: "home_account",
      destination: "/auth/register",
    });
    expect(invalid.success).toBe(false);
  });

  it("accepts seller promo CTA variants", () => {
    const valid = validateAnalyticsEvent("homepage_cta_clicked", {
      cta: "dealers",
      surface: "home_seller_promo",
      destination: "/dealer",
      locale: "sk",
    });

    expect(valid.success).toBe(true);
  });

  it("allows seo city route attribution for listing views", () => {
    const valid = validateAnalyticsEvent("listing_viewed", {
      adId: "f6d65fa7-1f26-4932-94f4-5a5683238e97",
      source: "seo_city_route",
      position: 1,
    });

    expect(valid.success).toBe(true);
  });

  it("allows seo model route attribution for listing views", () => {
    const valid = validateAnalyticsEvent("listing_viewed", {
      adId: "2195d9eb-2b9d-4f4f-ad08-0f38a82195c8",
      source: "seo_model_route",
      position: 3,
    });

    expect(valid.success).toBe(true);
  });

  it("validates listing_published payload", () => {
    const valid = validateAnalyticsEvent("listing_published", {
      adId: "e5a0b0aa-bce0-460a-8f92-4a2d1ec6d4e8",
      photosCount: 6,
      brand: "Skoda",
      model: "Octavia",
      locationCity: "Bratislava",
    });

    expect(valid.success).toBe(true);
  });

  it("validates lead_submitted payload", () => {
    const valid = validateAnalyticsEvent("lead_submitted", {
      leadId: "30b4446f-4171-4b97-8cfd-5f7eb6a5e6fc",
      adId: "2d3831f9-978f-4280-804a-67c85680557d",
      channel: "message",
    });

    expect(valid.success).toBe(true);
  });

  it("validates lead_qualified payload", () => {
    const valid = validateAnalyticsEvent("lead_qualified", {
      leadId: "efcbe0d4-b641-4e2f-a908-484eb9658807",
      adId: "2d3831f9-978f-4280-804a-67c85680557d",
      qualificationMethod: "seller_dashboard_manual",
    });

    expect(valid.success).toBe(true);
  });

  it("validates sale_confirmed payload", () => {
    const valid = validateAnalyticsEvent("sale_confirmed", {
      adId: "2195d9eb-2b9d-4f4f-ad08-0f38a82195c8",
      confirmationMethod: "seller_dashboard_manual",
      sellerType: "private",
    });

    expect(valid.success).toBe(true);
  });

  it("validates listing_approved payload", () => {
    const valid = validateAnalyticsEvent("listing_approved", {
      adId: "2195d9eb-2b9d-4f4f-ad08-0f38a82195c8",
      approvalMethod: "admin_moderation",
      sellerType: "dealer",
    });

    expect(valid.success).toBe(true);
  });

  it("validates listing_feature_purchased payload", () => {
    const valid = validateAnalyticsEvent("listing_feature_purchased", {
      adId: "2195d9eb-2b9d-4f4f-ad08-0f38a82195c8",
      featureType: "exclusive",
      purchaseSurface: "account_dashboard",
      valueEur: 9.99,
    });

    expect(valid.success).toBe(true);
  });

  it("validates listing_removed_by_moderation payload", () => {
    const valid = validateAnalyticsEvent("listing_removed_by_moderation", {
      adId: "2195d9eb-2b9d-4f4f-ad08-0f38a82195c8",
      removalReason: "admin_rejection",
      sellerType: "private",
    });

    expect(valid.success).toBe(true);
  });

  it("validates listing_marked_sold payload", () => {
    const valid = validateAnalyticsEvent("listing_marked_sold", {
      adId: "2195d9eb-2b9d-4f4f-ad08-0f38a82195c8",
      markedVia: "dashboard",
    });

    expect(valid.success).toBe(true);
  });

  it("resolves analytics consent from primary and legacy keys", () => {
    const primaryStorage = {
      getItem(key: string) {
        if (key === "autobazar123_cookie_consent") {
          return JSON.stringify({ analytics: true });
        }
        return null;
      },
    };
    expect(resolveAnalyticsConsentFromStorage(primaryStorage)).toBe(true);

    const legacyStorage = {
      getItem(key: string) {
        if (key === "cookiePreferences") {
          return JSON.stringify({ analytics: true });
        }
        return null;
      },
    };
    expect(resolveAnalyticsConsentFromStorage(legacyStorage)).toBe(true);

    const emptyStorage = {
      getItem() {
        return null;
      },
    };
    expect(resolveAnalyticsConsentFromStorage(emptyStorage)).toBe(false);
  });
});
