import type {
  SearchResponse,
  SearchResponses,
  SearchParamsObject as SearchOptions,
 } from "algoliasearch";
import type { AlgoliaCarRecord } from "./index";
import { getCarsIndexName, getCarsSortIndexOverrides } from "./public-env";

type SearchClient = {
  addAlgoliaAgent?: (segment: string, version?: string) => void;
  search<TObject>(requests: Array<{ indexName: string; params: SearchOptions }>): Promise<SearchResponses<TObject>>;
};

const FALLBACK_FACET_ATTRIBUTES = [
  "brand",
  "model",
  "fuel",
  "transmission",
  "location_city",
  "body_style",
  "has_service_book",
  "not_crashed",
  "is_bought_in_sk",
] as const;

const FALLBACK_NUMERIC_ATTRIBUTES = ["price_eur", "year"] as const;

type FallbackNumericAttribute = (typeof FALLBACK_NUMERIC_ATTRIBUTES)[number];
type FallbackSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "mileage_asc";

type FallbackRequest = {
  indexName: string;
  params: SearchOptions;
};

interface FacetFilterCondition {
  attribute: string;
  value: string;
  negated: boolean;
}

interface NumericFilterCondition {
  attribute: string;
  operator: ">" | ">=" | "<" | "<=" | "=" | "range";
  value: number;
  endValue?: number;
}

interface NormalizedFallbackSearchParams {
  query: string;
  page: number;
  hitsPerPage: number;
  facetFilters: FacetFilterCondition[][];
  numericFilters: NumericFilterCondition[][];
  requestedFacets: string[];
  maxValuesPerFacet: number;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getRecordSearchHaystack(record: AlgoliaCarRecord): string {
  return normalizeText(
    [
      record.brand,
      record.model,
      record.generation,
      record.location_city,
      record.fuel,
      record.transmission,
      record.body_style,
      String(record.year || ""),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function matchesQuery(record: AlgoliaCarRecord, query: string): boolean {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return true;
  }

  const haystack = getRecordSearchHaystack(record);
  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function toFilterGroups<T>(value: unknown): T[][] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (Array.isArray(entry) ? entry : [entry]))
    .map((group) => group.filter((item): item is T => item !== null && item !== undefined))
    .filter((group) => group.length > 0);
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFacetFilters(value: unknown): FacetFilterCondition[][] {
  return toFilterGroups<string>(value)
    .map((group) =>
      group
        .map((item) => {
          const separatorIndex = item.indexOf(":");
          if (separatorIndex <= 0) {
            return null;
          }

          const attribute = item.slice(0, separatorIndex).trim();
          const rawValue = stripWrappingQuotes(item.slice(separatorIndex + 1));
          const negated = rawValue.startsWith("-");
          const parsedValue = negated ? rawValue.slice(1) : rawValue;

          if (!attribute || !parsedValue) {
            return null;
          }

          return {
            attribute,
            value: parsedValue,
            negated,
          } satisfies FacetFilterCondition;
        })
        .filter((item): item is FacetFilterCondition => item !== null),
    )
    .filter((group) => group.length > 0);
}

function parseNumericFilter(item: string): NumericFilterCondition | null {
  const normalizedItem = item.trim();
  const rangeMatch = normalizedItem.match(
    /^([a-zA-Z0-9_]+)\s*:\s*(-?\d+(?:\.\d+)?)\s+TO\s+(-?\d+(?:\.\d+)?)$/,
  );
  if (rangeMatch) {
    return {
      attribute: rangeMatch[1],
      operator: "range",
      value: Number(rangeMatch[2]),
      endValue: Number(rangeMatch[3]),
    };
  }

  const comparisonMatch = normalizedItem.match(
    /^([a-zA-Z0-9_]+)\s*(<=|>=|=|<|>)\s*(-?\d+(?:\.\d+)?)$/,
  );
  if (!comparisonMatch) {
    return null;
  }

  return {
    attribute: comparisonMatch[1],
    operator: comparisonMatch[2] as NumericFilterCondition["operator"],
    value: Number(comparisonMatch[3]),
  };
}

function parseNumericFilters(value: unknown): NumericFilterCondition[][] {
  return toFilterGroups<string>(value)
    .map((group) => group.map(parseNumericFilter).filter((item): item is NumericFilterCondition => item !== null))
    .filter((group) => group.length > 0);
}

function parseFiltersString(value: unknown): {
  facetFilters: FacetFilterCondition[][];
  numericFilters: NumericFilterCondition[][];
} {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      facetFilters: [],
      numericFilters: [],
    };
  }

  const facetFilters: FacetFilterCondition[][] = [];
  const numericFilters: NumericFilterCondition[][] = [];
  const filterParts = value
    .split(/\s+AND\s+/i)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const part of filterParts) {
    const numericFilter = parseNumericFilter(part);
    if (numericFilter) {
      numericFilters.push([numericFilter]);
      continue;
    }

    const facetMatch = part.match(/^([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
    if (!facetMatch) {
      continue;
    }

    facetFilters.push([
      {
        attribute: facetMatch[1],
        value: stripWrappingQuotes(facetMatch[2]),
        negated: false,
      },
    ]);
  }

  return {
    facetFilters,
    numericFilters,
  };
}

function getRequestedFacets(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  if (normalized.includes("*")) {
    return [...FALLBACK_FACET_ATTRIBUTES];
  }

  return normalized;
}

function normalizeSearchParams(params: SearchOptions): NormalizedFallbackSearchParams {
  const filterStringState = parseFiltersString(params.filters);

  const query = typeof params.query === "string" ? params.query : "";
  const page = typeof params.page === "number" && params.page >= 0 ? params.page : 0;
  const hitsPerPage =
    typeof params.hitsPerPage === "number" && params.hitsPerPage > 0
      ? params.hitsPerPage
      : 20;

  return {
    query,
    page,
    hitsPerPage,
    facetFilters: [...parseFacetFilters(params.facetFilters), ...filterStringState.facetFilters],
    numericFilters: [
      ...parseNumericFilters(params.numericFilters),
      ...filterStringState.numericFilters,
    ],
    requestedFacets: getRequestedFacets(params.facets),
    maxValuesPerFacet:
      typeof params.maxValuesPerFacet === "number" && params.maxValuesPerFacet > 0
        ? params.maxValuesPerFacet
        : 100,
  };
}

function getRecordValue(record: AlgoliaCarRecord, attribute: string): string | number | boolean | undefined {
  return record[attribute as keyof AlgoliaCarRecord] as
    | string
    | number
    | boolean
    | undefined;
}

function matchesFacetCondition(
  record: AlgoliaCarRecord,
  condition: FacetFilterCondition,
): boolean {
  const rawValue = getRecordValue(record, condition.attribute);
  if (rawValue === null || rawValue === undefined) {
    return condition.negated;
  }

  const normalizedRecordValue =
    typeof rawValue === "boolean" ? String(rawValue) : normalizeText(String(rawValue));
  const normalizedConditionValue =
    condition.value === "true" || condition.value === "false"
      ? condition.value
      : normalizeText(condition.value);
  const isMatch = normalizedRecordValue === normalizedConditionValue;

  return condition.negated ? !isMatch : isMatch;
}

function matchesNumericCondition(
  record: AlgoliaCarRecord,
  condition: NumericFilterCondition,
): boolean {
  const rawValue = getRecordValue(record, condition.attribute);
  const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);

  if (!Number.isFinite(numericValue)) {
    return false;
  }

  switch (condition.operator) {
    case ">":
      return numericValue > condition.value;
    case ">=":
      return numericValue >= condition.value;
    case "<":
      return numericValue < condition.value;
    case "<=":
      return numericValue <= condition.value;
    case "=":
      return numericValue === condition.value;
    case "range":
      return (
        numericValue >= condition.value &&
        numericValue <= (condition.endValue ?? condition.value)
      );
    default:
      return true;
  }
}

function matchesGroupedConditions<T>(
  groups: T[][],
  matcher: (condition: T) => boolean,
): boolean {
  return groups.every((group) => group.some((condition) => matcher(condition)));
}

function resolveSortOption(indexName: string): FallbackSortOption {
  const baseIndex = getCarsIndexName();
  const sortOverrides = getCarsSortIndexOverrides();
  const newestIndex = sortOverrides.newest ?? baseIndex;
  const sortReplicaOverrides: Record<Exclude<FallbackSortOption, "newest">, string | null> = {
    price_asc: sortOverrides.price_asc,
    price_desc: sortOverrides.price_desc,
    year_desc: sortOverrides.year_desc,
    mileage_asc: sortOverrides.mileage_asc,
  };

  if (indexName === newestIndex || indexName === baseIndex) {
    return "newest";
  }

  for (const [sortOption, overrideIndex] of Object.entries(sortReplicaOverrides) as Array<
    [Exclude<FallbackSortOption, "newest">, string | null]
  >) {
    if (overrideIndex && indexName === overrideIndex) {
      return sortOption;
    }
  }

  if (indexName.endsWith("_price_asc")) return "price_asc";
  if (indexName.endsWith("_price_desc")) return "price_desc";
  if (indexName.endsWith("_year_desc")) return "year_desc";
  if (indexName.endsWith("_mileage_asc")) return "mileage_asc";

  return "newest";
}

function compareByNewest(left: AlgoliaCarRecord, right: AlgoliaCarRecord): number {
  return (right.created_at || 0) - (left.created_at || 0);
}

function createSortComparator(sortOption: FallbackSortOption) {
  return (left: AlgoliaCarRecord, right: AlgoliaCarRecord) => {
    switch (sortOption) {
      case "price_asc":
        return (
          (left.price_eur || 0) - (right.price_eur || 0) ||
          compareByNewest(left, right)
        );
      case "price_desc":
        return (
          (right.price_eur || 0) - (left.price_eur || 0) ||
          compareByNewest(left, right)
        );
      case "year_desc":
        return (right.year || 0) - (left.year || 0) || compareByNewest(left, right);
      case "mileage_asc":
        return (
          (left.mileage_km || 0) - (right.mileage_km || 0) ||
          compareByNewest(left, right)
        );
      case "newest":
      default:
        return compareByNewest(left, right);
    }
  };
}

function collectFacetValues(
  records: AlgoliaCarRecord[],
  attribute: string,
  maxValuesPerFacet: number,
): Record<string, number> {
  const counts = new Map<string, number>();

  for (const record of records) {
    const rawValue = getRecordValue(record, attribute);
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      continue;
    }

    const facetValue =
      typeof rawValue === "boolean" ? String(rawValue) : String(rawValue);
    counts.set(facetValue, (counts.get(facetValue) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "sk"))
      .slice(0, maxValuesPerFacet),
  );
}

function collectFacetStats(
  records: AlgoliaCarRecord[],
): Record<FallbackNumericAttribute, { min: number; max: number; avg: number; sum: number }> {
  return Object.fromEntries(
    FALLBACK_NUMERIC_ATTRIBUTES.map((attribute) => {
      const values = records
        .map((record) => getRecordValue(record, attribute))
        .map((value) => (typeof value === "number" ? value : Number(value)))
        .filter((value) => Number.isFinite(value));

      if (values.length === 0) {
        return [
          attribute,
          {
            min: 0,
            max: 0,
            avg: 0,
            sum: 0,
          },
        ];
      }

      const sum = values.reduce((total, value) => total + value, 0);
      return [
        attribute,
        {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: sum / values.length,
          sum,
        },
      ];
    }),
  ) as Record<
    FallbackNumericAttribute,
    { min: number; max: number; avg: number; sum: number }
  >;
}

export function searchFallbackCatalog(
  catalog: AlgoliaCarRecord[],
  request: FallbackRequest,
): SearchResponse<AlgoliaCarRecord> {
  const startedAt = Date.now();
  const normalizedParams = normalizeSearchParams(request.params);
  const filteredRecords = catalog.filter((record) => {
    return (
      matchesQuery(record, normalizedParams.query) &&
      matchesGroupedConditions(normalizedParams.facetFilters, (condition) =>
        matchesFacetCondition(record, condition),
      ) &&
      matchesGroupedConditions(normalizedParams.numericFilters, (condition) =>
        matchesNumericCondition(record, condition),
      )
    );
  });

  const sortedRecords = [...filteredRecords].sort(
    createSortComparator(resolveSortOption(request.indexName)),
  );
  const startIndex = normalizedParams.page * normalizedParams.hitsPerPage;
  const endIndex = startIndex + normalizedParams.hitsPerPage;
  const hits = sortedRecords.slice(startIndex, endIndex);
  const facets = Object.fromEntries(
    normalizedParams.requestedFacets.map((attribute) => [
      attribute,
      collectFacetValues(
        filteredRecords,
        attribute,
        normalizedParams.maxValuesPerFacet,
      ),
    ]),
  );
  const nbHits = filteredRecords.length;
  const nbPages =
    nbHits === 0 ? 0 : Math.ceil(nbHits / normalizedParams.hitsPerPage);

  return {
    hits,
    nbHits,
    page: normalizedParams.page,
    nbPages,
    hitsPerPage: normalizedParams.hitsPerPage,
    processingTimeMS: Date.now() - startedAt,
    query: normalizedParams.query,
    params: "",
    index: request.indexName,
    facets,
    facets_stats: collectFacetStats(filteredRecords),
    exhaustiveNbHits: true,
    exhaustiveFacetsCount: true,
  } as SearchResponse<AlgoliaCarRecord>;
}

export function createFallbackSearchClient(
  loadCatalog: () => Promise<AlgoliaCarRecord[]>,
): SearchClient {
  return {
    async search<TObject>(
      requests: Array<{ indexName: string; params: SearchOptions }>,
    ): Promise<SearchResponses<TObject>> {
      const catalog = await loadCatalog();

      return {
        results: requests.map((request) =>
          searchFallbackCatalog(catalog, request) as unknown as SearchResponse<TObject>,
        ),
      } as SearchResponses<TObject>;
    },
    addAlgoliaAgent() {
      // No-op: this client doesn't forward requests to Algolia.
    },
  };
}

export function isRecoverableAlgoliaSearchError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeStatus = "status" in error ? error.status : undefined;
  const maybeMessage = "message" in error ? error.message : undefined;
  const message =
    typeof maybeMessage === "string" ? maybeMessage.toLowerCase() : "";

  return (
    maybeStatus === 401 ||
    maybeStatus === 403 ||
    message.includes("application is blocked") ||
    message.includes("forbidden") ||
    message.includes("network") ||
    message.includes("failed to fetch")
  );
}
