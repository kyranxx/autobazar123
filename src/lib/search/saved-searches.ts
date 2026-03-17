export type SavedSearchFilters = {
  q: string;
  brand: string[];
  model: string;
  fuel: string;
  transmission: string;
  bodyStyle: string;
  location: string;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  yearFrom?: number;
  yearTo?: number;
  hasServiceBook: boolean;
  notCrashed: boolean;
  boughtInSk: boolean;
};

export function normalizeSavedSearchText(value: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function normalizeSavedSearchInteger(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return undefined;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSavedSearchBoolean(value: string | null): boolean {
  return value === "true";
}

export function parseSavedSearchFilters(searchParams: URLSearchParams): SavedSearchFilters {
  const brand = Array.from(
    new Set(
      searchParams
        .getAll("brand")
        .map((value) => normalizeSavedSearchText(value))
        .filter((value) => value.length > 0),
    ),
  );

  return {
    q: normalizeSavedSearchText(searchParams.get("q")),
    brand,
    model: normalizeSavedSearchText(searchParams.get("model")),
    fuel: normalizeSavedSearchText(searchParams.get("fuel")).toLowerCase(),
    transmission: normalizeSavedSearchText(searchParams.get("transmission")).toLowerCase(),
    bodyStyle: normalizeSavedSearchText(searchParams.get("bodyStyle")).toLowerCase(),
    location: normalizeSavedSearchText(searchParams.get("location")),
    priceFrom: normalizeSavedSearchInteger(searchParams.get("priceFrom")),
    priceTo: normalizeSavedSearchInteger(searchParams.get("priceTo")),
    mileageFrom: normalizeSavedSearchInteger(searchParams.get("mileageFrom")),
    mileageTo: normalizeSavedSearchInteger(searchParams.get("mileageTo")),
    yearFrom: normalizeSavedSearchInteger(searchParams.get("yearFrom")),
    yearTo: normalizeSavedSearchInteger(searchParams.get("yearTo")),
    hasServiceBook: normalizeSavedSearchBoolean(searchParams.get("hasServiceBook")),
    notCrashed: normalizeSavedSearchBoolean(searchParams.get("notCrashed")),
    boughtInSk: normalizeSavedSearchBoolean(searchParams.get("boughtInSk")),
  };
}

export function savedSearchFiltersToParams(filters: SavedSearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  filters.brand.forEach((brand) => params.append("brand", brand));
  if (filters.model) params.set("model", filters.model);
  if (filters.fuel) params.set("fuel", filters.fuel);
  if (filters.transmission) params.set("transmission", filters.transmission);
  if (filters.bodyStyle) params.set("bodyStyle", filters.bodyStyle);
  if (filters.location) params.set("location", filters.location);
  if (typeof filters.priceFrom === "number") params.set("priceFrom", String(filters.priceFrom));
  if (typeof filters.priceTo === "number") params.set("priceTo", String(filters.priceTo));
  if (typeof filters.mileageFrom === "number") {
    params.set("mileageFrom", String(filters.mileageFrom));
  }
  if (typeof filters.mileageTo === "number") {
    params.set("mileageTo", String(filters.mileageTo));
  }
  if (typeof filters.yearFrom === "number") params.set("yearFrom", String(filters.yearFrom));
  if (typeof filters.yearTo === "number") params.set("yearTo", String(filters.yearTo));
  if (filters.hasServiceBook) params.set("hasServiceBook", "true");
  if (filters.notCrashed) params.set("notCrashed", "true");
  if (filters.boughtInSk) params.set("boughtInSk", "true");

  return params;
}

export function normalizeSavedSearchFilters(filters: SavedSearchFilters): SavedSearchFilters {
  return {
    ...filters,
    brand: [...filters.brand].sort((left, right) => left.localeCompare(right, "sk")),
  };
}

export function createSavedSearchFingerprint(filters: SavedSearchFilters): string {
  const normalized = normalizeSavedSearchFilters(filters);
  const serialized = JSON.stringify(normalized);
  let hash = 5381;

  for (let index = 0; index < serialized.length; index += 1) {
    hash = ((hash << 5) + hash + serialized.charCodeAt(index)) >>> 0;
  }

  return `ss_${hash.toString(16)}`;
}

export function createSavedSearchLabel(filters: SavedSearchFilters): string {
  const parts: string[] = [];

  if (filters.q) {
    parts.push(filters.q);
  } else if (filters.brand.length > 0) {
    parts.push(filters.brand.join(", "));
  }

  if (filters.model) {
    parts.push(filters.model);
  }

  if (filters.location) {
    parts.push(filters.location);
  }

  if (typeof filters.priceTo === "number") {
    parts.push(`do ${filters.priceTo.toLocaleString("sk-SK")} EUR`);
  }
  if (typeof filters.mileageTo === "number") {
    parts.push(`do ${filters.mileageTo.toLocaleString("sk-SK")} km`);
  }

  if (parts.length === 0) {
    return "Uložené vyhľadávanie";
  }

  return parts.join(" • ").slice(0, 120);
}
