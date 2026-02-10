import { normalizeText } from "./formatters";
import { BRAND_ALIASES, MODEL_ALIASES } from "@/config/cars";

// Find matching brand from query
export function findBrandInQuery(
  query: string,
  availableBrands: string[],
): string | null {
  const normalizedQuery = normalizeText(query);
  const words = normalizedQuery.split(/\s+/);

  // Check each word against brand aliases
  for (const word of words) {
    if (BRAND_ALIASES[word]) {
      const matchedBrand = BRAND_ALIASES[word];
      if (availableBrands.some((b) => b === matchedBrand)) {
        return matchedBrand;
      }
    }
  }

  // Check two-word combinations (e.g., "alfa romeo")
  for (let i = 0; i < words.length - 1; i++) {
    const twoWords = `${words[i]} ${words[i + 1]}`;
    if (BRAND_ALIASES[twoWords]) {
      const matchedBrand = BRAND_ALIASES[twoWords];
      if (availableBrands.some((b) => b === matchedBrand)) {
        return matchedBrand;
      }
    }
  }

  // Direct match against available brands
  for (const brand of availableBrands) {
    const normalizedBrand = normalizeText(brand);
    if (words.some((w) => w === normalizedBrand)) {
      return brand;
    }
  }

  return null;
}

// Find matching model from query
export function findModelInQuery(
  query: string,
  availableModels: string[],
  brandToRemove?: string,
): string | null {
  let normalizedQuery = normalizeText(query);

  // Remove brand from query
  if (brandToRemove) {
    const normalizedBrand = normalizeText(brandToRemove);
    normalizedQuery = normalizedQuery
      .replace(new RegExp(normalizedBrand, "g"), "")
      .trim();
    // Also remove alias versions
    for (const [alias, brand] of Object.entries(BRAND_ALIASES)) {
      if (brand === brandToRemove) {
        normalizedQuery = normalizedQuery
          .replace(new RegExp(alias, "g"), "")
          .trim();
      }
    }
  }

  const words = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);

  // Check against model aliases
  for (const word of words) {
    if (MODEL_ALIASES[word]) {
      const matchedModel = MODEL_ALIASES[word];
      if (availableModels.some((m) => m === matchedModel)) {
        return matchedModel;
      }
    }
  }

  // Direct match against available models
  for (const model of availableModels) {
    const normalizedModel = normalizeText(model);
    if (words.some((w) => w === normalizedModel)) {
      return model;
    }
  }

  return null;
}
