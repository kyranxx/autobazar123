export type AlgoliaHit = {
  objectID?: string;
  brand?: string;
  model?: string;
  year?: number;
  price_eur?: number;
};

type CoverageInput = {
  activeAdsCount: number;
  algoliaHits: number;
  sampleHit?: AlgoliaHit;
};

const REQUIRED_HIT_FIELDS = [
  "objectID",
  "brand",
  "model",
  "year",
  "price_eur",
] as const;

export function getMissingHitFields(hit: AlgoliaHit | undefined): string[] {
  if (!hit) {
    return [...REQUIRED_HIT_FIELDS];
  }

  return REQUIRED_HIT_FIELDS.filter((field) => hit[field] === undefined);
}

export function evaluateAlgoliaSearchCoverage(input: CoverageInput): string[] {
  const errors: string[] = [];
  const missingFields = getMissingHitFields(input.sampleHit);

  if (missingFields.length > 0) {
    errors.push(
      `Algolia sample hit is missing required fields: ${missingFields.join(", ")}`,
    );
  }

  if (input.activeAdsCount === 0) {
    errors.push("Supabase has no active ads to validate search coverage.");
  }

  if (input.algoliaHits !== input.activeAdsCount) {
    errors.push(
      `Algolia count mismatch: expected ${input.activeAdsCount}, got ${input.algoliaHits}. Run a controlled sync before launch validation.`,
    );
  }

  return errors;
}
