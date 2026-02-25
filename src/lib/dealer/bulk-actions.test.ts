import { describe, expect, it } from "vitest";
import {
  applyDealerBulkActionLocally,
  calculateDealerBulkTotals,
  getDealerBulkDiscountPercent,
  type DealerBulkAdShape,
} from "./bulk-actions";

function makeAd(overrides: Partial<DealerBulkAdShape>): DealerBulkAdShape {
  return {
    id: "ad-1",
    status: "active",
    selected: false,
    created_at: "2026-02-01T10:00:00.000Z",
    expires_at: "2026-03-01T10:00:00.000Z",
    is_top_ad: false,
    is_highlighted: false,
    ...overrides,
  };
}

describe("dealer bulk totals", () => {
  it("applies tiered discount to total credits", () => {
    expect(getDealerBulkDiscountPercent(4)).toBe(0);
    expect(getDealerBulkDiscountPercent(5)).toBe(10);
    expect(getDealerBulkDiscountPercent(10)).toBe(15);
    expect(getDealerBulkDiscountPercent(50)).toBe(25);

    expect(calculateDealerBulkTotals("top", 5)).toEqual({
      baseCost: 15,
      discountPercent: 10,
      discountAmount: 2,
      finalCost: 13,
    });
  });
});

describe("applyDealerBulkActionLocally", () => {
  it("extends expiration for selected active ads on prolong", () => {
    const nowIso = "2026-02-24T12:00:00.000Z";
    const ads = [
      makeAd({
        id: "ad-active-selected",
        selected: true,
        expires_at: "2026-03-01T10:00:00.000Z",
      }),
      makeAd({
        id: "ad-expired-selected",
        selected: true,
        expires_at: "2026-01-01T10:00:00.000Z",
      }),
      makeAd({
        id: "ad-sold-selected",
        status: "sold",
        selected: true,
      }),
    ];

    const nextAds = applyDealerBulkActionLocally(
      ads,
      "prolong",
      ["ad-active-selected", "ad-expired-selected", "ad-sold-selected"],
      nowIso,
    );

    const active = nextAds.find((ad) => ad.id === "ad-active-selected");
    const expired = nextAds.find((ad) => ad.id === "ad-expired-selected");
    const sold = nextAds.find((ad) => ad.id === "ad-sold-selected");

    expect(active?.expires_at?.startsWith("2026-03-31T")).toBe(true);
    expect(expired?.expires_at).toBe("2026-03-26T12:00:00.000Z");
    expect(sold?.expires_at).toBe("2026-03-01T10:00:00.000Z");
    expect(nextAds.every((ad) => ad.selected === false)).toBe(true);
  });

  it("bumps selected active ads to newest order", () => {
    const nowIso = "2026-02-24T12:00:00.000Z";
    const ads = [
      makeAd({
        id: "older-selected",
        selected: true,
        created_at: "2026-01-01T12:00:00.000Z",
      }),
      makeAd({
        id: "newer-unselected",
        selected: false,
        created_at: "2026-02-20T12:00:00.000Z",
      }),
    ];

    const nextAds = applyDealerBulkActionLocally(
      ads,
      "bump",
      ["older-selected"],
      nowIso,
    );

    expect(nextAds[0]?.id).toBe("older-selected");
    expect(nextAds[0]?.created_at).toBe(nowIso);
  });
});
