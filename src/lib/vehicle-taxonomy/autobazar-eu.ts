import {
  normalizeTaxonomyLookupKey,
  normalizeTaxonomyName,
  normalizeTaxonomySlug,
} from "./normalize";

export const AUTOBazar_EU_FILTER_SOURCE = "autobazar_eu_filter";
export const AUTOBazar_EU_BASE_URL = "https://www.autobazar.eu";
export const AUTOBazar_EU_RESULTS_PATH = "/vysledky/osobne-vozidla";

export interface AutobazarEuModel {
  name: string;
  slug: string;
}

export interface AutobazarEuBrand {
  name: string;
  slug: string;
  sourceUrl: string;
  models?: AutobazarEuModel[];
}

export interface FetchAutobazarEuTaxonomyOptions {
  brandSlugs?: readonly string[];
  concurrency?: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const FILTER_LABEL_CLASS_TOKENS = [
  "text-[14px]",
  "font-semibold",
  "text-[rgba(235,235,245,.6)]",
];

const FUEL_FILTER_LABELS = new Set(
  [
    "Diesel",
    "Benzín",
    "Benzin",
    "Hybrid (Elektrina - benzín)",
    "Hybrid (Elektrina - benzin)",
    "Hybrid (Elektrina - diesel)",
    "Elektromotor",
    "Plug-in hybrid",
    "LPG + benzín",
    "LPG + benzin",
    "CNG + benzín",
    "CNG + benzin",
    "Bioetanol",
    "Vodík",
    "Vodik",
    "Hydrogen",
  ].map(normalizeTaxonomyLookupKey),
);

function dedupeBySlug<T extends { slug: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const entry of entries) {
    if (seen.has(entry.slug)) {
      continue;
    }

    seen.add(entry.slug);
    result.push(entry);
  }

  return result;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/gu, " ");
}

function extractFilterLabels(html: string): string[] {
  const labels: string[] = [];
  const spanPattern = /<span\b([^>]*)>([\s\S]*?)<\/span>/giu;

  for (const match of html.matchAll(spanPattern)) {
    const attrs = match[1] ?? "";
    const classMatch = attrs.match(/\bclass=["']([^"']+)["']/iu);
    const className = classMatch?.[1] ?? "";
    const isFilterLabel = FILTER_LABEL_CLASS_TOKENS.every((token) =>
      className.includes(token),
    );

    if (!isFilterLabel) {
      continue;
    }

    const label = normalizeTaxonomyName(match[2] ?? "");
    if (label) {
      labels.push(label);
    }
  }

  return labels;
}

function labelsBeforeFuelFilters(labels: readonly string[]): string[] {
  const result: string[] = [];

  for (const label of labels) {
    if (FUEL_FILTER_LABELS.has(normalizeTaxonomyLookupKey(label))) {
      break;
    }

    result.push(label);
  }

  return result;
}

function extractStaticModelLinks(html: string, brandSlug: string): AutobazarEuModel[] {
  const models: AutobazarEuModel[] = [];
  const linkPattern =
    /<a\b[^>]*href=["']\/(?:en\/)?vysledky\/osobne-vozidla\/([^\/"']+)\/([^\/"']+)\/["'][^>]*>([\s\S]*?)<\/a>/giu;

  for (const match of html.matchAll(linkPattern)) {
    if (match[1] !== brandSlug) {
      continue;
    }

    const content = match[3] ?? "";
    const firstSpan = content.match(/<span\b[^>]*>([\s\S]*?)<\/span>/iu);
    const name = normalizeTaxonomyName(firstSpan?.[1] ?? stripTags(content));
    const slug = normalizeTaxonomySlug(name || match[2] || "");
    if (!name || !slug) {
      continue;
    }

    models.push({ name, slug });
  }

  return dedupeBySlug(models);
}

export function buildAutobazarEuBrandUrl(brandSlug: string): string {
  return `${AUTOBazar_EU_BASE_URL}${AUTOBazar_EU_RESULTS_PATH}/${brandSlug}/`;
}

export function parseAutobazarEuBrandsFromHtml(html: string): AutobazarEuBrand[] {
  const labels = labelsBeforeFuelFilters(extractFilterLabels(html));
  const brands = labels
    .map((name) => {
      const slug = normalizeTaxonomySlug(name);
      if (!slug) {
        return null;
      }

      return {
        name,
        slug,
        sourceUrl: buildAutobazarEuBrandUrl(slug),
      };
    })
    .filter((brand): brand is AutobazarEuBrand => Boolean(brand));

  return dedupeBySlug(brands);
}

export function parseAutobazarEuModelsFromHtml(
  html: string,
  brandSlug: string,
): AutobazarEuModel[] {
  const filterModels = labelsBeforeFuelFilters(extractFilterLabels(html))
    .map((name) => {
      const slug = normalizeTaxonomySlug(name);
      if (!slug) {
        return null;
      }

      return { name, slug };
    })
    .filter((model): model is AutobazarEuModel => Boolean(model));

  if (filterModels.length > 0) {
    return dedupeBySlug(filterModels);
  }

  return extractStaticModelLinks(html, brandSlug);
}

async function fetchTextWithTimeout({
  fetchImpl,
  timeoutMs,
  url,
}: {
  fetchImpl: typeof fetch;
  timeoutMs: number;
  url: string;
}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      headers: {
        "user-agent": "Autobazar123 taxonomy sync/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`autobazar.eu returned HTTP ${response.status} for ${url}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, () =>
      worker(),
    ),
  );

  return results;
}

export async function fetchAutobazarEuTaxonomy({
  brandSlugs,
  concurrency = 4,
  fetchImpl = fetch,
  timeoutMs = 30_000,
}: FetchAutobazarEuTaxonomyOptions = {}): Promise<AutobazarEuBrand[]> {
  const baseUrl = `${AUTOBazar_EU_BASE_URL}${AUTOBazar_EU_RESULTS_PATH}/`;
  const baseHtml = await fetchTextWithTimeout({ fetchImpl, timeoutMs, url: baseUrl });
  const parsedBrands = parseAutobazarEuBrandsFromHtml(baseHtml);
  const requestedBrandSlugs = brandSlugs?.length ? new Set(brandSlugs) : null;
  const brands = requestedBrandSlugs
    ? parsedBrands.filter((brand) => requestedBrandSlugs.has(brand.slug))
    : parsedBrands;

  if (requestedBrandSlugs && brands.length !== requestedBrandSlugs.size) {
    const found = new Set(brands.map((brand) => brand.slug));
    const missing = [...requestedBrandSlugs].filter((slug) => !found.has(slug));
    throw new Error(`Source brand filter did not contain requested brand(s): ${missing.join(", ")}`);
  }

  return mapWithConcurrency(brands, concurrency, async (brand) => {
    const html = await fetchTextWithTimeout({
      fetchImpl,
      timeoutMs,
      url: brand.sourceUrl,
    });

    return {
      ...brand,
      models: parseAutobazarEuModelsFromHtml(html, brand.slug),
    };
  });
}
