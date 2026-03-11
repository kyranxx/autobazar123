export type SeoBrandTaxonomyEntry = {
  name: string;
  models: readonly string[];
};

export type SeoCityTaxonomyEntry = {
  name: string;
  region: string;
};

export type SeoBrandModelPair = {
  brandSlug: string;
  modelSlug: string;
};

export type SeoBrandModelCityTriple = {
  brandSlug: string;
  modelSlug: string;
  citySlug: string;
};

export const SEO_BRANDS: Record<string, SeoBrandTaxonomyEntry> = {
  skoda: {
    name: "\u0160koda",
    models: [
      "octavia",
      "fabia",
      "superb",
      "kodiaq",
      "karoq",
      "scala",
      "kamiq",
      "enyaq",
    ],
  },
  volkswagen: {
    name: "Volkswagen",
    models: [
      "golf",
      "passat",
      "tiguan",
      "polo",
      "arteon",
      "touareg",
      "t-roc",
      "id4",
    ],
  },
  audi: {
    name: "Audi",
    models: ["a3", "a4", "a6", "q3", "q5", "q7", "q8", "e-tron"],
  },
  bmw: {
    name: "BMW",
    models: ["3-series", "5-series", "x1", "x3", "x5", "x6", "i4", "ix"],
  },
  mercedes: {
    name: "Mercedes-Benz",
    models: [
      "c-class",
      "e-class",
      "s-class",
      "glc",
      "gle",
      "gla",
      "eqc",
      "eqs",
    ],
  },
  ford: {
    name: "Ford",
    models: ["focus", "fiesta", "mondeo", "kuga", "puma", "mustang"],
  },
  toyota: {
    name: "Toyota",
    models: ["corolla", "yaris", "camry", "rav4", "c-hr", "land-cruiser"],
  },
  hyundai: {
    name: "Hyundai",
    models: ["i20", "i30", "tucson", "kona", "ioniq", "santa-fe"],
  },
  kia: {
    name: "Kia",
    models: ["ceed", "sportage", "sorento", "niro", "stonic", "ev6"],
  },
};

export const SEO_CITIES: Record<string, SeoCityTaxonomyEntry> = {
  bratislava: { name: "Bratislava", region: "Bratislavsk\u00fd kraj" },
  kosice: { name: "Ko\u0161ice", region: "Ko\u0161ick\u00fd kraj" },
  zilina: { name: "\u017dilina", region: "\u017dilinsk\u00fd kraj" },
  presov: { name: "Pre\u0161ov", region: "Pre\u0161ovsk\u00fd kraj" },
  nitra: { name: "Nitra", region: "Nitriansky kraj" },
  "banska-bystrica": {
    name: "Bansk\u00e1 Bystrica",
    region: "Banskobystrick\u00fd kraj",
  },
  trnava: { name: "Trnava", region: "Trnavsk\u00fd kraj" },
  trencin: { name: "Tren\u010d\u00edn", region: "Tren\u010diansky kraj" },
};

export const SEO_BRAND_SLUGS = Object.freeze(Object.keys(SEO_BRANDS));
export const SEO_CITY_SLUGS = Object.freeze(Object.keys(SEO_CITIES));

export const SEO_TOP_BRANDS_FOR_CITY_PAGES = Object.freeze([
  "skoda",
  "volkswagen",
  "audi",
  "bmw",
  "mercedes",
]);

export const SEO_TOP_MODELS_FOR_CITY_PAGES: Record<string, readonly string[]> = {
  skoda: ["octavia", "fabia", "superb"],
  volkswagen: ["golf", "passat", "tiguan"],
  audi: ["a4", "a6", "q5"],
  bmw: ["3-series", "5-series", "x5"],
  mercedes: ["c-class", "e-class", "glc"],
};

export const SEO_TOP_CITY_SLUGS = Object.freeze([
  normalizeSeoSegment("Bratislava"),
  normalizeSeoSegment("Košice"),
  normalizeSeoSegment("Žilina"),
  normalizeSeoSegment("Banská Bystrica"),
  normalizeSeoSegment("Nitra"),
  normalizeSeoSegment("Prešov"),
  normalizeSeoSegment("Trnava"),
  normalizeSeoSegment("Trenčín"),
]);

export function formatModelSlug(modelSlug: string): string {
  return modelSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeSeoSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBrandTaxonomy(brandSlug: string): SeoBrandTaxonomyEntry | null {
  return SEO_BRANDS[brandSlug] ?? null;
}

export function getCityTaxonomy(citySlug: string): SeoCityTaxonomyEntry | null {
  return SEO_CITIES[citySlug] ?? null;
}

export function hasModelForBrand(brandSlug: string, modelSlug: string): boolean {
  const brand = getBrandTaxonomy(brandSlug);
  if (!brand) {
    return false;
  }
  return brand.models.includes(modelSlug);
}

export function getAllSeoBrandModelPairs(): SeoBrandModelPair[] {
  const pairs: SeoBrandModelPair[] = [];

  for (const [brandSlug, brand] of Object.entries(SEO_BRANDS)) {
    for (const modelSlug of brand.models) {
      pairs.push({ brandSlug, modelSlug });
    }
  }

  return pairs;
}

export function getTopSeoBrandModelCityTriples(): SeoBrandModelCityTriple[] {
  const triples: SeoBrandModelCityTriple[] = [];

  for (const brandSlug of SEO_TOP_BRANDS_FOR_CITY_PAGES) {
    for (const modelSlug of SEO_TOP_MODELS_FOR_CITY_PAGES[brandSlug] || []) {
      for (const citySlug of SEO_TOP_CITY_SLUGS) {
        triples.push({ brandSlug, modelSlug, citySlug });
      }
    }
  }

  return triples;
}

export function resolveBrandSlugFromValue(value: string): string | null {
  const normalized = normalizeSeoSegment(value);
  if (!normalized) {
    return null;
  }

  for (const [brandSlug, brand] of Object.entries(SEO_BRANDS)) {
    if (brandSlug === normalized) {
      return brandSlug;
    }
    if (normalizeSeoSegment(brand.name) === normalized) {
      return brandSlug;
    }
  }

  return null;
}

export function resolveModelSlugForBrand(
  brandSlug: string,
  value: string,
): string | null {
  const normalized = normalizeSeoSegment(value);
  if (!normalized) {
    return null;
  }

  const brand = getBrandTaxonomy(brandSlug);
  if (!brand) {
    return null;
  }

  return brand.models.find((model) => normalizeSeoSegment(model) === normalized) ?? null;
}

export function resolveCitySlugFromValue(value: string): string | null {
  const normalized = normalizeSeoSegment(value);
  if (!normalized) {
    return null;
  }

  for (const [citySlug, city] of Object.entries(SEO_CITIES)) {
    if (citySlug === normalized) {
      return citySlug;
    }
    if (normalizeSeoSegment(city.name) === normalized) {
      return citySlug;
    }
  }

  return null;
}

export function buildProgrammaticSeoPath({
  brandSlug,
  modelSlug,
  citySlug,
}: {
  brandSlug: string | null;
  modelSlug: string | null;
  citySlug: string | null;
}): string | null {
  if (!brandSlug) {
    return null;
  }

  if (!getBrandTaxonomy(brandSlug)) {
    return null;
  }

  if (citySlug && !modelSlug) {
    return null;
  }

  if (modelSlug && !hasModelForBrand(brandSlug, modelSlug)) {
    return null;
  }

  if (citySlug && !getCityTaxonomy(citySlug)) {
    return null;
  }

  if (brandSlug && modelSlug && citySlug) {
    return `/${brandSlug}/${modelSlug}/${citySlug}`;
  }

  if (brandSlug && modelSlug) {
    return `/${brandSlug}/${modelSlug}`;
  }

  return `/${brandSlug}`;
}
