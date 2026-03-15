import { DEALER_BULK_TIERS } from "@/config/credits";

export type DealerBulkActionId = "prolong" | "top" | "highlight" | "bump";

const DEALER_BULK_ACTION_COSTS: Record<DealerBulkActionId, number> = {
  prolong: 1,
  top: 3,
  highlight: 2,
  bump: 1,
};

interface DealerBulkTotals {
  baseCost: number;
  discountPercent: number;
  discountAmount: number;
  finalCost: number;
}

export interface DealerBulkAdShape {
  id: string;
  status: string;
  selected: boolean;
  created_at?: string;
  expires_at?: string;
  top_expires_at?: string;
  highlight_expires_at?: string;
  is_top_ad: boolean;
  is_highlighted: boolean;
}

function isActiveStatus(status: string | null | undefined): boolean {
  return (status || "").trim().toLowerCase() === "active";
}

function sortAdsActiveFirst<T extends DealerBulkAdShape>(ads: T[]): T[] {
  return [...ads].sort((left, right) => {
    const leftActive = isActiveStatus(left.status);
    const rightActive = isActiveStatus(right.status);

    if (leftActive !== rightActive) {
      return leftActive ? -1 : 1;
    }

    const leftCreatedAt = left.created_at
      ? new Date(left.created_at).getTime()
      : 0;
    const rightCreatedAt = right.created_at
      ? new Date(right.created_at).getTime()
      : 0;

    return rightCreatedAt - leftCreatedAt;
  });
}

function addDaysFromFloor(
  existingIso: string | undefined,
  floorIso: string,
  days: number,
): string {
  const floor = new Date(floorIso);
  const existing = existingIso ? new Date(existingIso) : null;
  const base =
    existing && Number.isFinite(existing.getTime()) && existing > floor
      ? existing
      : floor;

  const result = new Date(base.getTime());
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

export function getDealerBulkDiscountPercent(selectedCount: number): number {
  const tier = DEALER_BULK_TIERS.find(
    (entry) => selectedCount >= entry.minAds && selectedCount <= entry.maxAds,
  );

  return tier?.discount || 0;
}

export function calculateDealerBulkTotals(
  actionId: DealerBulkActionId,
  selectedCount: number,
): DealerBulkTotals {
  const baseCost = selectedCount * DEALER_BULK_ACTION_COSTS[actionId];
  const discountPercent = getDealerBulkDiscountPercent(selectedCount);
  const discountAmount = Math.round(baseCost * (discountPercent / 100));
  const finalCost = baseCost - discountAmount;

  return {
    baseCost,
    discountPercent,
    discountAmount,
    finalCost,
  };
}

export function applyDealerBulkActionLocally<T extends DealerBulkAdShape>(
  ads: T[],
  actionId: DealerBulkActionId,
  selectedIds: string[],
  nowIso: string,
): T[] {
  const selectedIdSet = new Set(selectedIds);
  const patchedAds = ads.map((ad) => {
    const shouldApply =
      selectedIdSet.has(ad.id) && isActiveStatus(ad.status);

    const nextAd: T = {
      ...ad,
      selected: false,
    };

    if (!shouldApply) {
      return nextAd;
    }

    if (actionId === "prolong") {
      return {
        ...nextAd,
        expires_at: addDaysFromFloor(ad.expires_at, nowIso, 30),
      };
    }

    if (actionId === "top") {
      return {
        ...nextAd,
        is_top_ad: true,
        top_expires_at: addDaysFromFloor(ad.top_expires_at, nowIso, 7),
      };
    }

    if (actionId === "highlight") {
      return {
        ...nextAd,
        is_highlighted: true,
        highlight_expires_at: addDaysFromFloor(ad.highlight_expires_at, nowIso, 7),
      };
    }

    if (actionId === "bump") {
      return {
        ...nextAd,
        created_at: nowIso,
      };
    }

    return nextAd;
  });

  return sortAdsActiveFirst(patchedAds);
}
