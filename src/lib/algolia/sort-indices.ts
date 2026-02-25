import { CARS_INDEX } from "./index";

export type SearchSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "mileage_asc";

export const SEARCH_SORT_OPTIONS: SearchSortOption[] = [
  "newest",
  "price_asc",
  "price_desc",
  "year_desc",
  "mileage_asc",
];

const DEFAULT_SORT_REPLICA_SUFFIXES: Record<SearchSortOption, string> = {
  newest: "",
  price_asc: "_price_asc",
  price_desc: "_price_desc",
  year_desc: "_year_desc",
  mileage_asc: "_mileage_asc",
};

function getNonEmptyEnvValue(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getCarsSortIndexName(sortOption: SearchSortOption): string {
  const baseIndexOverride = getNonEmptyEnvValue(
    process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX,
  );
  const newestIndexOverride = getNonEmptyEnvValue(
    process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX_NEWEST,
  );
  const baseIndex = baseIndexOverride ?? CARS_INDEX;

  const sortSpecificOverride =
    sortOption === "newest"
      ? newestIndexOverride
      : getNonEmptyEnvValue(
          process.env[
            `NEXT_PUBLIC_ALGOLIA_ADS_INDEX_${sortOption.toUpperCase()}`
          ],
        );

  if (sortSpecificOverride) {
    return sortSpecificOverride;
  }

  const replicaSortEnabled =
    process.env.NEXT_PUBLIC_ALGOLIA_ENABLE_REPLICA_SORT === "true";
  if (!replicaSortEnabled || sortOption === "newest") {
    return baseIndex;
  }

  return `${baseIndex}${DEFAULT_SORT_REPLICA_SUFFIXES[sortOption]}`;
}

export function getAllCarsSortIndexNames(): string[] {
  return Array.from(new Set(SEARCH_SORT_OPTIONS.map(getCarsSortIndexName)));
}
