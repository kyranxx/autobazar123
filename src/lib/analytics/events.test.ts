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
