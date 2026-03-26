import {
  getCarsIndexName,
  getCarsSortIndexOverrides,
  isCarsReplicaSortEnabled,
} from "./public-env";

export type SearchSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "mileage_asc";

const _SEARCH_SORT_OPTIONS: SearchSortOption[] = [
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

export function getCarsSortIndexName(sortOption: SearchSortOption): string {
  const baseIndex = getCarsIndexName();
  const sortOverrides = getCarsSortIndexOverrides();
  const sortSpecificOverride = sortOverrides[sortOption];

  if (sortSpecificOverride) {
    return sortSpecificOverride;
  }

  if (!isCarsReplicaSortEnabled() || sortOption === "newest") {
    return baseIndex;
  }

  return `${baseIndex}${DEFAULT_SORT_REPLICA_SUFFIXES[sortOption]}`;
}
