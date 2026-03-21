import { cache } from "react";
import { getPublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/public";

export interface SeoModelTaxonomyEntry {
  name: string;
  slug: string;
  isCityIndexable: boolean;
}

export interface SeoBrandTaxonomyEntry {
  name: string;
  slug: string;
  models: readonly SeoModelTaxonomyEntry[];
}

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

export interface SeoProgrammaticTaxonomy {
  brandsBySlug: Record<string, SeoBrandTaxonomyEntry>;
  brandSlugs: readonly string[];
}

export const SEO_CITIES: Record<string, SeoCityTaxonomyEntry> = {
  bratislava: { name: "Bratislava", region: "Bratislavský kraj" },
  kosice: { name: "Košice", region: "Košický kraj" },
  zilina: { name: "Žilina", region: "Žilinský kraj" },
  presov: { name: "Prešov", region: "Prešovský kraj" },
  nitra: { name: "Nitra", region: "Nitriansky kraj" },
  "banska-bystrica": {
    name: "Banská Bystrica",
    region: "Banskobystrický kraj",
  },
  trnava: { name: "Trnava", region: "Trnavský kraj" },
  trencin: { name: "Trenčín", region: "Trenčiansky kraj" },
};

export const SEO_CITY_SLUGS = Object.freeze(Object.keys(SEO_CITIES));
export const SEO_TOP_CITY_SLUGS = SEO_CITY_SLUGS;

function sortBrandModels(
  left: SeoModelTaxonomyEntry,
  right: SeoModelTaxonomyEntry,
): number {
  return left.name.localeCompare(right.name, "sk");
}

export function normalizeSeoSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatModelSlug(modelSlug: string): string {
  return modelSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const getProgrammaticSeoTaxonomy = cache(
  async (): Promise<SeoProgrammaticTaxonomy> => {
    const taxonomy = await getPublicVehicleTaxonomy();

    const brandsBySlug = taxonomy.brands.reduce<Record<string, SeoBrandTaxonomyEntry>>(
      (accumulator, brand) => {
        accumulator[brand.slug] = {
          name: brand.name,
          slug: brand.slug,
          models:
            taxonomy.modelsByBrandId[brand.id]?.map((model) => ({
              name: model.name,
              slug: model.slug,
              isCityIndexable: brand.isPopular,
            })) ?? [],
        };
        accumulator[brand.slug].models = [...accumulator[brand.slug].models].sort(
          sortBrandModels,
        );
        return accumulator;
      },
      {},
    );

    const brandSlugs = Object.keys(brandsBySlug).sort((left, right) =>
      brandsBySlug[left].name.localeCompare(brandsBySlug[right].name, "sk"),
    );

    return {
      brandsBySlug,
      brandSlugs,
    };
  },
);

export function getCityTaxonomy(citySlug: string): SeoCityTaxonomyEntry | null {
  return SEO_CITIES[citySlug] ?? null;
}

export async function getBrandTaxonomy(
  brandSlug: string,
): Promise<SeoBrandTaxonomyEntry | null> {
  const taxonomy = await getProgrammaticSeoTaxonomy();
  return taxonomy.brandsBySlug[brandSlug] ?? null;
}

export async function getSeoBrandSlugs(): Promise<readonly string[]> {
  const taxonomy = await getProgrammaticSeoTaxonomy();
  return taxonomy.brandSlugs;
}

export async function getAllSeoBrands(): Promise<SeoBrandTaxonomyEntry[]> {
  const taxonomy = await getProgrammaticSeoTaxonomy();
  return taxonomy.brandSlugs.map((brandSlug) => taxonomy.brandsBySlug[brandSlug]);
}

export async function hasModelForBrand(
  brandSlug: string,
  modelSlug: string,
): Promise<boolean> {
  return Boolean(await getModelTaxonomy(brandSlug, modelSlug));
}

export async function getModelTaxonomy(
  brandSlug: string,
  modelSlug: string,
): Promise<SeoModelTaxonomyEntry | null> {
  const brand = await getBrandTaxonomy(brandSlug);
  if (!brand) {
    return null;
  }

  return brand.models.find((model) => model.slug === modelSlug) ?? null;
}

export async function getAllSeoBrandModelPairs(): Promise<SeoBrandModelPair[]> {
  const taxonomy = await getProgrammaticSeoTaxonomy();
  const pairs: SeoBrandModelPair[] = [];

  for (const brandSlug of taxonomy.brandSlugs) {
    for (const model of taxonomy.brandsBySlug[brandSlug]?.models ?? []) {
      pairs.push({
        brandSlug,
        modelSlug: model.slug,
      });
    }
  }

  return pairs;
}

export async function getTopSeoBrandModelCityTriples(): Promise<SeoBrandModelCityTriple[]> {
  const taxonomy = await getProgrammaticSeoTaxonomy();
  const triples: SeoBrandModelCityTriple[] = [];

  for (const brandSlug of taxonomy.brandSlugs) {
    for (const model of taxonomy.brandsBySlug[brandSlug]?.models ?? []) {
      if (!model.isCityIndexable) {
        continue;
      }

      for (const citySlug of SEO_TOP_CITY_SLUGS) {
        triples.push({
          brandSlug,
          modelSlug: model.slug,
          citySlug,
        });
      }
    }
  }

  return triples;
}

export async function resolveBrandSlugFromValue(
  value: string,
): Promise<string | null> {
  const normalized = normalizeSeoSegment(value);
  if (!normalized) {
    return null;
  }

  const taxonomy = await getProgrammaticSeoTaxonomy();
  for (const brandSlug of taxonomy.brandSlugs) {
    const brand = taxonomy.brandsBySlug[brandSlug];
    if (
      brandSlug === normalized ||
      normalizeSeoSegment(brand.name) === normalized
    ) {
      return brandSlug;
    }
  }

  return null;
}

export async function resolveModelSlugForBrand(
  brandSlug: string,
  value: string,
): Promise<string | null> {
  const normalized = normalizeSeoSegment(value);
  if (!normalized) {
    return null;
  }

  const brand = await getBrandTaxonomy(brandSlug);
  if (!brand) {
    return null;
  }

  return (
    brand.models.find(
      (model) =>
        model.slug === normalized ||
        normalizeSeoSegment(model.name) === normalized,
    )?.slug ?? null
  );
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

export async function buildProgrammaticSeoPath({
  brandSlug,
  modelSlug,
  citySlug,
}: {
  brandSlug: string | null;
  modelSlug: string | null;
  citySlug: string | null;
}): Promise<string | null> {
  if (!brandSlug) {
    return null;
  }

  const brand = await getBrandTaxonomy(brandSlug);
  if (!brand) {
    return null;
  }

  if (citySlug && !modelSlug) {
    return null;
  }

  if (modelSlug && !brand.models.some((model) => model.slug === modelSlug)) {
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
