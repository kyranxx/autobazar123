import { BRAND_URL } from "@/config/brand";
import type { MarketCode } from "@/config/markets";
import { getMarketPath } from "@/lib/routes";

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
  marketCode = "SK",
}: {
  brand?: string | null;
  model?: string | null;
  marketCode?: MarketCode;
}): string {
  const queryParts: string[] = [];

  if (brand) {
    queryParts.push(`brand=${encodeURIComponent(brand)}`);
  }

  if (brand && model) {
    queryParts.push(`model=${encodeURIComponent(model)}`);
  }

  return getMarketPath(
    queryParts.length > 0 ? `/vysledky?${queryParts.join("&")}` : "/vysledky",
    marketCode,
  );
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
  {
    listingsLabel = "Inzeráty",
    marketCode = "SK",
  }: {
    listingsLabel?: string;
    marketCode?: MarketCode;
  } = {},
): BreadcrumbTrailItem[] {
  const brand = getSingleParam(searchParams.brand);
  const model = brand ? getSingleParam(searchParams.model) : null;
  const brandHref = buildSearchResultsHref({ brand, marketCode });
  const items: BreadcrumbTrailItem[] = [
    { label: listingsLabel, href: brand ? getMarketPath("/vysledky", marketCode) : undefined },
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
  marketCode: MarketCode = "SK",
): string {
  const brand = getSingleParam(searchParams.brand);
  const model = brand ? getSingleParam(searchParams.model) : null;

  return buildSearchResultsHref({ brand, model, marketCode });
}

export function buildSearchResultsBreadcrumbSchemaItems(
  searchParams: BreadcrumbSearchParams,
  options:
    | string
    | {
    siteUrl?: string;
    listingsLabel?: string;
    marketCode?: MarketCode;
      } = {},
): BreadcrumbSchemaItem[] {
  const { siteUrl = BRAND_URL, listingsLabel = "Inzeráty", marketCode = "SK" } =
    typeof options === "string" ? { siteUrl: options } : options;

  return buildBreadcrumbSchemaItems({
    items: buildSearchResultsBreadcrumbItems(searchParams, { listingsLabel, marketCode }),
    currentHref: buildSearchResultsCurrentHref(searchParams, marketCode),
    siteUrl,
  });
}
