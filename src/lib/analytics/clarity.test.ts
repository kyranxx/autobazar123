import { describe, expect, it } from "vitest";
import {
  buildClarityConsentV2,
  resolveClarityProjectIdForHost,
} from "./clarity";

describe("resolveClarityProjectIdForHost", () => {
  it("uses the Romanian Clarity project for Romanian market hosts", () => {
    expect(
      resolveClarityProjectIdForHost("www.autoninja.ro", {
        defaultId: "default123",
        skId: "sk123",
        roId: "ro123",
      }),
    ).toBe("ro123");
  });

  it("uses the Slovak Clarity project for Slovak market hosts", () => {
    expect(
      resolveClarityProjectIdForHost("autobazar123.sk", {
        defaultId: "default123",
        skId: "sk123",
        roId: "ro123",
      }),
    ).toBe("sk123");
  });

  it("falls back to the shared Clarity project when a market-specific id is missing", () => {
    expect(
      resolveClarityProjectIdForHost("www.autoninja.ro", {
        defaultId: "default123",
        skId: "sk123",
      }),
    ).toBe("default123");
  });

  it("does not resolve a Clarity project for unknown local or preview hosts", () => {
    expect(
      resolveClarityProjectIdForHost("localhost:3000", {
        defaultId: "default123",
        skId: "sk123",
        roId: "ro123",
      }),
    ).toBeNull();

    expect(
      resolveClarityProjectIdForHost("autobazar123-preview.vercel.app", {
        defaultId: "default123",
        skId: "sk123",
        roId: "ro123",
      }),
    ).toBeNull();
  });

  it("rejects unsafe project ids before building the Clarity script URL", () => {
    expect(
      resolveClarityProjectIdForHost("www.autobazar123.sk", {
        defaultId: "default123",
        skId: "sk/unsafe",
      }),
    ).toBe("default123");

    expect(
      resolveClarityProjectIdForHost("www.autobazar123.sk", {
        defaultId: "../unsafe",
      }),
    ).toBeNull();
  });
});

describe("buildClarityConsentV2", () => {
  it("maps analytics and marketing consent to Clarity consent v2 storage flags", () => {
    expect(buildClarityConsentV2({ analytics: true, marketing: false })).toEqual({
      ad_storage: "denied",
      analytics_storage: "granted",
    });

    expect(buildClarityConsentV2({ analytics: false, marketing: true })).toEqual({
      ad_storage: "granted",
      analytics_storage: "denied",
    });
  });
});
