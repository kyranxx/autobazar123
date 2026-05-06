import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("posthog-js", () => ({
  default: {
    __loaded: false,
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

import posthog from "posthog-js";
import { identifyAnalyticsUser, trackAnalyticsEvent } from "@/lib/analytics/client";

const mockedPosthog = posthog as unknown as {
  __loaded: boolean;
  capture: ReturnType<typeof vi.fn>;
  identify: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
};

describe("trackAnalyticsEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    delete (window as Window & { dataLayer?: unknown }).dataLayer;
    delete (window as Window & { gtag?: unknown }).gtag;
    mockedPosthog.__loaded = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pushes to dataLayer when consent is enabled and payload is valid", () => {
    window.localStorage.setItem(
      "autobazar123_cookie_consent",
      JSON.stringify({ analytics: true }),
    );

    const result = trackAnalyticsEvent("listing_viewed", {
      adId: "f6d65fa7-1f26-4932-94f4-5a5683238e97",
      source: "seo_city_route",
      position: 1,
    });

    expect(result).toBe(true);
    const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> })
      .dataLayer;
    expect(dataLayer).toBeDefined();
    expect(dataLayer).toHaveLength(1);
    expect(dataLayer?.[0]).toMatchObject({
      event: "listing_viewed",
      source: "seo_city_route",
      position: 1,
    });
  });

  it("returns false when consent is missing", () => {
    const result = trackAnalyticsEvent("listing_viewed", {
      adId: "f6d65fa7-1f26-4932-94f4-5a5683238e97",
      source: "seo_model_route",
      position: 2,
    });

    expect(result).toBe(false);
    const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> })
      .dataLayer;
    expect(dataLayer).toBeUndefined();
  });

  it("returns false for invalid payload and does not push", () => {
    window.localStorage.setItem(
      "autobazar123_cookie_consent",
      JSON.stringify({ analytics: true }),
    );

    const result = trackAnalyticsEvent("listing_viewed", {
      adId: "not-a-uuid",
      source: "seo_model_route",
    } as never);

    expect(result).toBe(false);
    const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> })
      .dataLayer;
    expect(dataLayer).toBeUndefined();
  });

  it("sets and clears analytics identity for loaded vendors", () => {
    const gtag = vi.fn();
    (window as Window & { gtag?: typeof gtag }).gtag = gtag;
    mockedPosthog.__loaded = true;

    identifyAnalyticsUser("user-123");

    expect(gtag).toHaveBeenCalledWith("set", { user_id: "user-123" });
    expect(mockedPosthog.identify).toHaveBeenCalledWith("user-123");

    identifyAnalyticsUser(null);

    expect(gtag).toHaveBeenCalledWith("set", { user_id: null });
    expect(mockedPosthog.reset).toHaveBeenCalled();
  });
});
