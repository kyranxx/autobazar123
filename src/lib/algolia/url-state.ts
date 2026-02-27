export interface AlgoliaIndexUiState {
  query?: string;
  refinementList?: Record<string, string[]>;
  range?: Record<string, string>;
}

const QUERY_PARAM = "q";

const REFINEMENT_PARAM_TO_ATTRIBUTE: Record<string, string> = {
  brand: "brand",
  model: "model",
  fuel: "fuel",
  transmission: "transmission",
  location: "location_city",
  bodyStyle: "body_style",
  hasServiceBook: "has_service_book",
  notCrashed: "not_crashed",
  boughtInSk: "is_bought_in_sk",
};

const RANGE_PARAM_TO_ATTRIBUTE: Record<
  string,
  { minParam: string; maxParam: string }
> = {
  price_eur: { minParam: "priceFrom", maxParam: "priceTo" },
  year: { minParam: "yearFrom", maxParam: "yearTo" },
};

function parseRefinementValues(params: URLSearchParams, key: string): string[] {
  const directValues = params
    .getAll(key)
    .flatMap((raw) => raw.split(","))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return Array.from(new Set(directValues));
}

function parseRangeValue(
  params: URLSearchParams,
  minParam: string,
  maxParam: string,
): string | undefined {
  const min = (params.get(minParam) || "").trim();
  const max = (params.get(maxParam) || "").trim();

  if (!min && !max) {
    return undefined;
  }

  return `${min}:${max}`;
}

function splitRange(value?: string): { min?: string; max?: string } {
  if (!value) {
    return {};
  }

  const [minRaw = "", maxRaw = ""] = value.split(":", 2);
  const min = minRaw.trim();
  const max = maxRaw.trim();

  return {
    min: min || undefined,
    max: max || undefined,
  };
}

export function routeParamsToIndexUiState(
  params: URLSearchParams,
): AlgoliaIndexUiState {
  const query = (params.get(QUERY_PARAM) || "").trim();
  const refinementListEntries = Object.entries(REFINEMENT_PARAM_TO_ATTRIBUTE)
    .map(([paramKey, attribute]) => [attribute, parseRefinementValues(params, paramKey)] as const)
    .filter(([, values]) => values.length > 0);
  const rangeEntries = Object.entries(RANGE_PARAM_TO_ATTRIBUTE)
    .map(([attribute, { minParam, maxParam }]) => [
      attribute,
      parseRangeValue(params, minParam, maxParam),
    ] as const)
    .filter((entry): entry is readonly [string, string] => typeof entry[1] === "string");

  const refinementList =
    refinementListEntries.length > 0
      ? Object.fromEntries(refinementListEntries)
      : undefined;
  const range =
    rangeEntries.length > 0 ? Object.fromEntries(rangeEntries) : undefined;

  return {
    ...(query ? { query } : {}),
    ...(refinementList ? { refinementList } : {}),
    ...(range ? { range } : {}),
  };
}

export function indexUiStateToRouteParams(
  indexUiState: AlgoliaIndexUiState,
): URLSearchParams {
  const params = new URLSearchParams();

  if (indexUiState.query) {
    params.set(QUERY_PARAM, indexUiState.query);
  }

  for (const [paramKey, attribute] of Object.entries(REFINEMENT_PARAM_TO_ATTRIBUTE)) {
    const values = indexUiState.refinementList?.[attribute] || [];
    values
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .forEach((value) => {
        params.append(paramKey, value);
      });
  }

  for (const [attribute, { minParam, maxParam }] of Object.entries(RANGE_PARAM_TO_ATTRIBUTE)) {
    const rangeValue = indexUiState.range?.[attribute];
    const { min, max } = splitRange(rangeValue);

    if (min) {
      params.set(minParam, min);
    }

    if (max) {
      params.set(maxParam, max);
    }
  }

  return params;
}
