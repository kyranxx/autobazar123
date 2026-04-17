import type { SearchParamsObject as SearchOptions } from "algoliasearch";
import type { AlgoliaIndexUiState } from "./url-state";

function createFacetFilterGroup(
  attribute: string,
  values: string[] | undefined,
): string[] | null {
  const normalizedValues =
    values
      ?.map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => `${attribute}:${value}`) ?? [];

  return normalizedValues.length > 0 ? normalizedValues : null;
}

function createNumericFilters(rangeValue: string | undefined, attribute: string): string[] {
  if (!rangeValue) {
    return [];
  }

  const [minRaw = "", maxRaw = ""] = rangeValue.split(":", 2);
  const min = minRaw.trim();
  const max = maxRaw.trim();
  const numericFilters: string[] = [];

  if (min) {
    numericFilters.push(`${attribute}>=${min}`);
  }

  if (max) {
    numericFilters.push(`${attribute}<=${max}`);
  }

  return numericFilters;
}

export function indexUiStateToSearchParams(
  indexUiState: AlgoliaIndexUiState,
  overrides: Partial<SearchOptions> = {},
): SearchOptions {
  const facetFilters = [
    createFacetFilterGroup("brand", indexUiState.refinementList?.brand),
    createFacetFilterGroup("model", indexUiState.refinementList?.model),
    createFacetFilterGroup("fuel", indexUiState.refinementList?.fuel),
    createFacetFilterGroup("transmission", indexUiState.refinementList?.transmission),
    createFacetFilterGroup("location_city", indexUiState.refinementList?.location_city),
    createFacetFilterGroup("body_style", indexUiState.refinementList?.body_style),
    createFacetFilterGroup("has_service_book", indexUiState.refinementList?.has_service_book),
    createFacetFilterGroup("not_crashed", indexUiState.refinementList?.not_crashed),
    createFacetFilterGroup("is_bought_in_sk", indexUiState.refinementList?.is_bought_in_sk),
  ].filter((group): group is string[] => Array.isArray(group) && group.length > 0);

  const numericFilters = [
    ...createNumericFilters(indexUiState.range?.price_eur, "price_eur"),
    ...createNumericFilters(indexUiState.range?.mileage_km, "mileage_km"),
    ...createNumericFilters(indexUiState.range?.year, "year"),
  ];

  return {
    query: indexUiState.query?.trim() ?? "",
    ...(facetFilters.length > 0 ? { facetFilters } : {}),
    ...(numericFilters.length > 0 ? { numericFilters } : {}),
    ...overrides,
  };
}
