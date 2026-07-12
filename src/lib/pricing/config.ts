export type PricingPhase = "launch" | "growth" | "mature";

export type ListingActionOperation =
  | "publish_basic"
  | "publish_premium"
  | "publish_top"
  | "prolong_basic"
  | "prolong_premium"
  | "prolong_top";

export type DealerTopupPackageId = "dealer_100" | "dealer_300" | "dealer_1000";

interface PricingPhaseAmounts {
  basicPriceCents: number;
  prolongPriceCents: number;
  premiumPriceCents: number;
  topPriceCents: number;
}

interface DealerTopupPackage {
  id: DealerTopupPackageId;
  label: string;
  priceCents: number;
  bonusCents: number;
}

export interface PricingConfigV1 {
  phase: PricingPhase;
  thresholds: {
    growthActiveAds: number;
  };
  durations: {
    listingDays: number;
    promotionDays: number;
  };
  homepageTopLimit: number;
  resultsTopLimit: number;
  resultsPremiumLimit: number;
  phases: Record<PricingPhase, PricingPhaseAmounts>;
  dealerTopups: DealerTopupPackage[];
  copy: {
    globalBanner: string;
    homepageSeller: string;
    dealerTopup: string;
  };
}

export const DEFAULT_PRICING_CONFIG_V1: PricingConfigV1 = {
  phase: "launch",
  thresholds: {
    growthActiveAds: 5000,
  },
  durations: {
    listingDays: 28,
    promotionDays: 28,
  },
  homepageTopLimit: 8,
  resultsTopLimit: 4,
  resultsPremiumLimit: 8,
  phases: {
    launch: {
      basicPriceCents: 0,
      prolongPriceCents: 0,
      premiumPriceCents: 499,
      topPriceCents: 999,
    },
    growth: {
      basicPriceCents: 199,
      prolongPriceCents: 199,
      premiumPriceCents: 699,
      topPriceCents: 1199,
    },
    mature: {
      basicPriceCents: 299,
      prolongPriceCents: 299,
      premiumPriceCents: 799,
      topPriceCents: 1299,
    },
  },
  dealerTopups: [
    { id: "dealer_100", label: "100 €", priceCents: 10000, bonusCents: 800 },
    { id: "dealer_300", label: "300 €", priceCents: 30000, bonusCents: 4500 },
    { id: "dealer_1000", label: "1000 €", priceCents: 100000, bonusCents: 20000 },
  ],
  copy: {
    globalBanner: "Inzerát teraz zdarma. Premium od 4,99 €. Exclusive 9,99 €.",
    homepageSeller: "Pridať inzerát zdarma. Premium 4,99 €. Exclusive 9,99 €.",
    dealerTopup: "Predplatený inzertný zostatok s bonusom pri dobití.",
  },
};

function normalizeTierMarketingCopy(value: string) {
  return value.replace(/\bTOP\b/g, "Exclusive").replace(/\bTop\b/g, "Exclusive");
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asNumber(
  value: unknown,
  fallback: number,
  {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
  }: { min?: number; max?: number } = {},
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < min || rounded > max) {
    return fallback;
  }

  return rounded;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function parsePhase(value: unknown, fallback: PricingPhase): PricingPhase {
  return value === "launch" || value === "growth" || value === "mature"
    ? value
    : fallback;
}

function normalizePhaseAmounts(
  value: unknown,
  fallback: PricingPhaseAmounts,
): PricingPhaseAmounts {
  const raw = asObject(value);
  if (!raw) {
    return fallback;
  }

  return {
    basicPriceCents: asNumber(raw.basicPriceCents, fallback.basicPriceCents),
    prolongPriceCents: asNumber(raw.prolongPriceCents, fallback.prolongPriceCents),
    premiumPriceCents: asNumber(raw.premiumPriceCents, fallback.premiumPriceCents),
    topPriceCents: asNumber(raw.topPriceCents, fallback.topPriceCents),
  };
}

export function parsePricingConfigValue(rawValue: string | null | undefined): PricingConfigV1 {
  if (!rawValue) {
    return DEFAULT_PRICING_CONFIG_V1;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    const raw = asObject(parsed);

    if (!raw) {
      return DEFAULT_PRICING_CONFIG_V1;
    }

    const thresholds = asObject(raw.thresholds);
    const durations = asObject(raw.durations);
    const phases = asObject(raw.phases);
    const copy = asObject(raw.copy);

    const dealerTopups = Array.isArray(raw.dealerTopups)
      ? raw.dealerTopups
          .map((entry, index) => {
            const item = asObject(entry);
            const fallback = DEFAULT_PRICING_CONFIG_V1.dealerTopups[index];
            if (!item || !fallback) {
              return null;
            }

            return {
              id: parseDealerTopupId(item.id, fallback.id),
              label: asString(item.label, fallback.label),
              priceCents: asNumber(item.priceCents, fallback.priceCents),
              bonusCents: asNumber(item.bonusCents, fallback.bonusCents),
            } satisfies DealerTopupPackage;
          })
          .filter((entry): entry is DealerTopupPackage => entry !== null)
      : DEFAULT_PRICING_CONFIG_V1.dealerTopups;

    return {
      phase: parsePhase(raw.phase, DEFAULT_PRICING_CONFIG_V1.phase),
      thresholds: {
        growthActiveAds: asNumber(
          thresholds?.growthActiveAds,
          DEFAULT_PRICING_CONFIG_V1.thresholds.growthActiveAds,
          { min: 1 },
        ),
      },
      durations: {
        listingDays: asNumber(
          durations?.listingDays,
          DEFAULT_PRICING_CONFIG_V1.durations.listingDays,
          { min: 1 },
        ),
        promotionDays: asNumber(
          durations?.promotionDays,
          DEFAULT_PRICING_CONFIG_V1.durations.promotionDays,
          { min: 1 },
        ),
      },
      homepageTopLimit: asNumber(
        raw.homepageTopLimit,
        DEFAULT_PRICING_CONFIG_V1.homepageTopLimit,
        { min: 1 },
      ),
      resultsTopLimit: asNumber(
        raw.resultsTopLimit,
        DEFAULT_PRICING_CONFIG_V1.resultsTopLimit,
        { min: 1 },
      ),
      resultsPremiumLimit: asNumber(
        raw.resultsPremiumLimit,
        DEFAULT_PRICING_CONFIG_V1.resultsPremiumLimit,
        { min: 1 },
      ),
      phases: {
        launch: normalizePhaseAmounts(phases?.launch, DEFAULT_PRICING_CONFIG_V1.phases.launch),
        growth: normalizePhaseAmounts(phases?.growth, DEFAULT_PRICING_CONFIG_V1.phases.growth),
        mature: normalizePhaseAmounts(phases?.mature, DEFAULT_PRICING_CONFIG_V1.phases.mature),
      },
      dealerTopups:
        dealerTopups.length > 0 ? dealerTopups : DEFAULT_PRICING_CONFIG_V1.dealerTopups,
      copy: {
        globalBanner: normalizeTierMarketingCopy(
          asString(copy?.globalBanner, DEFAULT_PRICING_CONFIG_V1.copy.globalBanner),
        ),
        homepageSeller: normalizeTierMarketingCopy(
          asString(
            copy?.homepageSeller,
            DEFAULT_PRICING_CONFIG_V1.copy.homepageSeller,
          ),
        ),
        dealerTopup: asString(copy?.dealerTopup, DEFAULT_PRICING_CONFIG_V1.copy.dealerTopup),
      },
    };
  } catch {
    return DEFAULT_PRICING_CONFIG_V1;
  }
}

export function serializePricingConfigValue(config: PricingConfigV1) {
  return JSON.stringify(config);
}

function getPricingPhaseAmounts(
  config: PricingConfigV1,
  phase: PricingPhase = config.phase,
) {
  return config.phases[phase];
}

function buildLocalizedPricingCopy(config: PricingConfigV1, locale: string) {
  if (!locale.toLowerCase().startsWith("ro")) {
    return {
      globalBanner: config.copy.globalBanner,
      homepageSeller: config.copy.homepageSeller,
      dealerTopup: config.copy.dealerTopup,
    };
  }

  const amounts = getPricingPhaseAmounts(config);
  const premium = formatPriceCents(amounts.premiumPriceCents, locale);
  const top = formatPriceCents(amounts.topPriceCents, locale);

  return {
    globalBanner: `Anunț gratuit acum. Premium de la ${premium}. Exclusive ${top}.`,
    homepageSeller: `Adaugă anunț gratuit. Premium ${premium}. Exclusive ${top}.`,
    dealerTopup: "Sold preplătit pentru anunțuri, cu bonus la încărcare.",
  };
}

export function getListingOperationPriceCents(
  config: PricingConfigV1,
  operation: ListingActionOperation,
  phase: PricingPhase = config.phase,
) {
  const amounts = getPricingPhaseAmounts(config, phase);

  switch (operation) {
    case "publish_basic":
      return amounts.basicPriceCents;
    case "publish_premium":
      return amounts.premiumPriceCents;
    case "publish_top":
      return amounts.topPriceCents;
    case "prolong_basic":
      return amounts.prolongPriceCents;
    case "prolong_premium":
      return amounts.premiumPriceCents;
    case "prolong_top":
      return amounts.topPriceCents;
    default:
      return amounts.basicPriceCents;
  }
}

export function parseDealerTopupId(
  value: unknown,
  fallback: DealerTopupPackageId,
): DealerTopupPackageId {
  return value === "dealer_100" || value === "dealer_300" || value === "dealer_1000"
    ? value
    : fallback;
}

export function getDealerTopupPackage(
  config: PricingConfigV1,
  packageId: DealerTopupPackageId,
) {
  return (
    config.dealerTopups.find((entry) => entry.id === packageId)
    || DEFAULT_PRICING_CONFIG_V1.dealerTopups.find((entry) => entry.id === packageId)
    || null
  );
}

export function formatPriceCents(cents: number, locale = "sk-SK") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function pricingCentsToEuroInput(cents: number) {
  return String(cents / 100);
}

export function pricingEuroInputToCents(value: string) {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

export function buildSharedPricingSummary(
  config: PricingConfigV1,
  locale = "sk-SK",
) {
  const amounts = getPricingPhaseAmounts(config);
  const pricingCopy = buildLocalizedPricingCopy(config, locale);
  const isRomanian = locale.toLowerCase().startsWith("ro");
  const freeLabel = isRomanian ? "Gratuit" : "Zadarmo";
  const listingDuration = isRomanian
    ? `${config.durations.listingDays} zile`
    : `${config.durations.listingDays} dní`;
  const freeDurationLabel = `${freeLabel} / ${listingDuration}`;
  const formatDurationPrice = (cents: number) =>
    `${formatPriceCents(cents, locale)} / ${listingDuration}`;

  return {
    basic:
      amounts.basicPriceCents === 0
        ? freeDurationLabel
        : formatDurationPrice(amounts.basicPriceCents),
    prolong:
      amounts.prolongPriceCents === 0
        ? freeDurationLabel
        : formatDurationPrice(amounts.prolongPriceCents),
    premium: formatDurationPrice(amounts.premiumPriceCents),
    top: formatDurationPrice(amounts.topPriceCents),
    globalBanner: pricingCopy.globalBanner,
    homepageSeller: pricingCopy.homepageSeller,
    dealerTopup: pricingCopy.dealerTopup,
  };
}
