import {
  indexUiStateToRouteParams,
  routeParamsToIndexUiState,
  type AlgoliaIndexUiState,
} from "./url-state";

export type DetailedSearchState = {
  q: string;
  brands: string[];
  model: string;
  fuels: string[];
  bodyStyles: string[];
  transmissions: string[];
  locations: string[];
  priceFrom: string;
  priceTo: string;
  mileageFrom: string;
  mileageTo: string;
  yearFrom: string;
  yearTo: string;
  powerFrom: string;
  powerTo: string;
  hasServiceBook: boolean;
  notCrashed: boolean;
  boughtInSk: boolean;
  vatDeductible: boolean;
};

function getRangePair(
  range: Record<string, string> | undefined,
  attribute: string,
): [string, string] {
  const [min = "", max = ""] = (range?.[attribute] ?? "").split(":", 2);
  return [min, max];
}

function getValues(
  refinementList: Record<string, string[]> | undefined,
  attribute: string,
): string[] {
  return refinementList?.[attribute] ?? [];
}

function hasTrueValue(
  refinementList: Record<string, string[]> | undefined,
  attribute: string,
): boolean {
  return getValues(refinementList, attribute).includes("true");
}

function normalizeNumericValue(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? String(Number.parseInt(digits, 10)) : "";
}

export function detailedSearchStateFromParams(
  params: URLSearchParams,
): DetailedSearchState {
  const uiState = routeParamsToIndexUiState(params);
  const refinementList = uiState.refinementList;
  const [priceFrom, priceTo] = getRangePair(uiState.range, "price_eur");
  const [mileageFrom, mileageTo] = getRangePair(uiState.range, "mileage_km");
  const [yearFrom, yearTo] = getRangePair(uiState.range, "year");
  const [powerFrom, powerTo] = getRangePair(uiState.range, "power_kw");

  return {
    q: uiState.query ?? "",
    brands: getValues(refinementList, "brand"),
    model: getValues(refinementList, "model")[0] ?? "",
    fuels: getValues(refinementList, "fuel"),
    bodyStyles: getValues(refinementList, "body_style"),
    transmissions: getValues(refinementList, "transmission"),
    locations: getValues(refinementList, "location_city"),
    priceFrom,
    priceTo,
    mileageFrom,
    mileageTo,
    yearFrom,
    yearTo,
    powerFrom,
    powerTo,
    hasServiceBook: hasTrueValue(refinementList, "has_service_book"),
    notCrashed: hasTrueValue(refinementList, "not_crashed"),
    boughtInSk: hasTrueValue(refinementList, "is_bought_in_sk"),
    vatDeductible: hasTrueValue(refinementList, "is_vat_deductible"),
  };
}

export function detailedSearchStateToParams(
  state: DetailedSearchState,
): URLSearchParams {
  const refinementList: Record<string, string[]> = {};

  if (state.brands.length > 0) refinementList.brand = state.brands;
  if (state.model.trim()) refinementList.model = [state.model.trim()];
  if (state.fuels.length > 0) refinementList.fuel = state.fuels;
  if (state.bodyStyles.length > 0) refinementList.body_style = state.bodyStyles;
  if (state.transmissions.length > 0) refinementList.transmission = state.transmissions;
  if (state.locations.length > 0) refinementList.location_city = state.locations;
  if (state.hasServiceBook) refinementList.has_service_book = ["true"];
  if (state.notCrashed) refinementList.not_crashed = ["true"];
  if (state.boughtInSk) refinementList.is_bought_in_sk = ["true"];
  if (state.vatDeductible) refinementList.is_vat_deductible = ["true"];

  const range: Record<string, string> = {};
  const ranges = [
    ["price_eur", state.priceFrom, state.priceTo],
    ["mileage_km", state.mileageFrom, state.mileageTo],
    ["year", state.yearFrom, state.yearTo],
    ["power_kw", state.powerFrom, state.powerTo],
  ] as const;

  for (const [attribute, rawMin, rawMax] of ranges) {
    const min = normalizeNumericValue(rawMin);
    const max = normalizeNumericValue(rawMax);
    if (min || max) {
      range[attribute] = `${min}:${max}`;
    }
  }

  const uiState: AlgoliaIndexUiState = {
    ...(state.q.trim() ? { query: state.q.trim() } : {}),
    ...(Object.keys(refinementList).length > 0 ? { refinementList } : {}),
    ...(Object.keys(range).length > 0 ? { range } : {}),
  };

  return indexUiStateToRouteParams(uiState);
}
