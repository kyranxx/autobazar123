import { BRAND_URL } from "@/config/brand";

export interface BreadcrumbTrailItem {
  label: string;
  href?: string;
}

export interface BreadcrumbSchemaItem {
  name: string;
  url: string;
}

export type BreadcrumbSearchParams = Record<string, string | string[] | undefined>;

function getSingleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      return null;
    }

    return getSingleParam(value[0]);
  }

  const trimmed = value?.trim();
  return trimmed || null;
}

function absoluteUrl(href: string, siteUrl = BRAND_URL): string {
  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  const normalizedHref = href.startsWith("/") ? href : `/${href}`;

  return `${normalizedSiteUrl}${normalizedHref}`;
}

function buildSearchResultsHref({
  brand,
  model,
}: {
  brand?: string | null;
  model?: string | null;
}): string {
  const queryParts: string[] = [];

  if (brand) {
    queryParts.push(`brand=${encodeURIComponent(brand)}`);
  }

  if (brand && model) {
    queryParts.push(`model=${encodeURIComponent(model)}`);
  }

  return queryParts.length > 0 ? `/vysledky?${queryParts.join("&")}` : "/vysledky";
}

export function buildBreadcrumbSchemaItems({
  items,
  currentHref,
  siteUrl = BRAND_URL,
}: {
  items: BreadcrumbTrailItem[];
  currentHref: string;
  siteUrl?: string;
}): BreadcrumbSchemaItem[] {
  return items.map((item) => ({
    name: item.label,
    url: absoluteUrl(item.href ?? currentHref, siteUrl),
  }));
}

export function buildSearchResultsBreadcrumbItems(
  searchParams: BreadcrumbSearchParams,
): BreadcrumbTrailItem[] {
  const brand = getSingleParam(searchParams.brand);
  const model = brand ? getSingleParam(searchParams.model) : null;
  const brandHref = buildSearchResultsHref({ brand });
  const items: BreadcrumbTrailItem[] = [
    { label: "Inzeráty", href: brand ? "/vysledky" : undefined },
  ];

  if (brand) {
    items.push({ label: brand, href: model ? brandHref : undefined });
  }

  if (brand && model) {
    items.push({ label: model });
  }

  return items;
}

export function buildSearchResultsCurrentHref(
  searchParams: BreadcrumbSearchParams,
): string {
  const brand = getSingleParam(searchParams.brand);
  const model = brand ? getSingleParam(searchParams.model) : null;

  return buildSearchResultsHref({ brand, model });
}

export function buildSearchResultsBreadcrumbSchemaItems(
  searchParams: BreadcrumbSearchParams,
  siteUrl = BRAND_URL,
): BreadcrumbSchemaItem[] {
  return buildBreadcrumbSchemaItems({
    items: buildSearchResultsBreadcrumbItems(searchParams),
    currentHref: buildSearchResultsCurrentHref(searchParams),
    siteUrl,
  });
}
