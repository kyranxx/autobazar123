const DEFAULT_CARS_INDEX = "ads";

export type CarsIndexSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "mileage_asc";

function getNonEmptyEnvValue(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getPublicAlgoliaAppId(): string {
  return getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID) ?? "";
}

export function getPublicAlgoliaSearchKey(): string {
  return getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY) ?? "";
}

export function shouldSuppressMissingAlgoliaKeyWarning(): boolean {
  return process.env.NEXT_PUBLIC_SUPPRESS_ALGOLIA_MISSING_KEYS_WARNING === "true";
}

export function getCarsIndexName(): string {
  return getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX) ?? DEFAULT_CARS_INDEX;
}

export function getCarsSortIndexOverrides(): Record<CarsIndexSortOption, string | null> {
  return {
    newest:
      getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX_NEWEST) ??
      getCarsIndexName(),
    price_asc: getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX_PRICE_ASC),
    price_desc: getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX_PRICE_DESC),
    year_desc: getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX_YEAR_DESC),
    mileage_asc: getNonEmptyEnvValue(process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX_MILEAGE_ASC),
  };
}

export function isCarsReplicaSortEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ALGOLIA_ENABLE_REPLICA_SORT !== "false";
}
