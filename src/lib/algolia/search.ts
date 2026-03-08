import { searchSingleIndex, CARS_INDEX } from "./index";

interface SearchFilters {
  query?: string;
  brand?: string;
  model?: string;
  fuel?: string;
  transmission?: string;
  bodyStyle?: string;
  priceFrom?: number;
  priceTo?: number;
  yearFrom?: number;
  yearTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
}

interface FacetValues {
  brands: { value: string; count: number }[];
  models: { value: string; count: number }[];
  fuels: { value: string; count: number }[];
  transmissions: { value: string; count: number }[];
  bodyStyles: { value: string; count: number }[];
}

interface SearchResult {
  count: number;
  facets: FacetValues;
}

/**
 * Direct search helper for homepage filters.
 * Returns count and facet values for filter dropdowns.
 */
export async function searchWithFilters(
  filters: SearchFilters,
): Promise<SearchResult> {
  // Build filter string
  const filterParts: string[] = [];
  if (filters.brand) filterParts.push(`brand:"${filters.brand}"`);
  if (filters.model) filterParts.push(`model:"${filters.model}"`);
  if (filters.fuel) filterParts.push(`fuel:"${filters.fuel}"`);
  if (filters.transmission)
    filterParts.push(`transmission:"${filters.transmission}"`);
  if (filters.bodyStyle) filterParts.push(`body_style:"${filters.bodyStyle}"`);
  if (filters.priceFrom) filterParts.push(`price_eur >= ${filters.priceFrom}`);
  if (filters.priceTo) filterParts.push(`price_eur <= ${filters.priceTo}`);
  if (filters.yearFrom) filterParts.push(`year >= ${filters.yearFrom}`);
  if (filters.yearTo) filterParts.push(`year <= ${filters.yearTo}`);
  if (filters.mileageFrom)
    filterParts.push(`mileage_km >= ${filters.mileageFrom}`);
  if (filters.mileageTo) filterParts.push(`mileage_km <= ${filters.mileageTo}`);

  const filtersString = filterParts.join(" AND ");

  try {
    const results = await searchSingleIndex({
      indexName: CARS_INDEX,
      searchParams: {
        query: filters.query || "",
        filters: filtersString,
        hitsPerPage: 0, // We only need count, not actual hits
        facets: ["brand", "model", "fuel", "transmission", "body_style"],
      },
    });

    // Transform facets into array format
    const transformFacet = (facet: Record<string, number> | undefined) => {
      if (!facet) return [];
      return Object.entries(facet)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      count: results.nbHits || 0,
      facets: {
        brands: transformFacet(results.facets?.brand),
        models: transformFacet(results.facets?.model),
        fuels: transformFacet(results.facets?.fuel),
        transmissions: transformFacet(results.facets?.transmission),
        bodyStyles: transformFacet(results.facets?.body_style),
      },
    };
  } catch (error) {
    console.error("Algolia search error:", error);
    return {
      count: 0,
      facets: {
        brands: [],
        models: [],
        fuels: [],
        transmissions: [],
        bodyStyles: [],
      },
    };
  }
}
