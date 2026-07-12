import { BRAND_URL } from "@/config/brand";
import type { MarketCode } from "@/config/markets";
import type { CarData } from "@/lib/cars/car-detail";
import { PUBLIC_MARKET_COPY, formatPublicCarValue } from "@/lib/market/public-copy";
import { getMarketPath } from "@/lib/routes";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbSchemaItem,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";

type CarDetailBreadcrumbOptions = {
  listingsLabel?: string;
  marketCode?: MarketCode;
};

function buildSearchHref({
  brand,
  model,
  marketCode,
}: {
  brand?: string;
  model?: string;
  marketCode: MarketCode;
}) {
  const params = new URLSearchParams();

  if (brand) {
    params.set("brand", brand);
  }

  if (brand && model) {
    params.set("model", model);
  }

  const query = params.toString();
  return getMarketPath(query ? `/vysledky?${query}` : "/vysledky", marketCode);
}

function formatEngineLiters(engineVolumeCm3: number) {
  if (!Number.isFinite(engineVolumeCm3) || engineVolumeCm3 <= 0) {
    return null;
  }

  return `${(engineVolumeCm3 / 1000).toFixed(1)}`;
}

export function buildCarDetailBreadcrumbTitle(
  car: CarData,
  { marketCode = "SK" }: Pick<CarDetailBreadcrumbOptions, "marketCode"> = {},
) {
  const engine = formatEngineLiters(car.engine_volume_cm3);
  const fuel = formatPublicCarValue(car.fuel, marketCode, "fuel") || null;
  const transmission =
    formatPublicCarValue(car.transmission, marketCode, "transmission") || null;
  const detailParts = [engine, fuel, transmission].filter(Boolean);
  const vehicleName = [car.brand, car.model, ...detailParts].filter(Boolean).join(" ");

  return car.year ? `${vehicleName}, ${car.year}` : vehicleName;
}

export function buildCarDetailBreadcrumbItems(
  car: CarData,
  options: CarDetailBreadcrumbOptions = {},
): BreadcrumbTrailItem[] {
  const marketCode = options.marketCode ?? "SK";
  const listingsLabel =
    options.listingsLabel ?? PUBLIC_MARKET_COPY[marketCode].listingsLabel;

  return [
    { label: listingsLabel, href: getMarketPath("/vysledky", marketCode) },
    { label: car.brand, href: buildSearchHref({ brand: car.brand, marketCode }) },
    {
      label: car.model,
      href: buildSearchHref({ brand: car.brand, model: car.model, marketCode }),
    },
    { label: buildCarDetailBreadcrumbTitle(car, { marketCode }) },
  ];
}

export function buildCarDetailBreadcrumbSchemaItems(
  car: CarData,
  {
    currentHref,
    siteUrl = BRAND_URL,
    listingsLabel,
    marketCode = "SK",
  }: {
    currentHref: string;
    siteUrl?: string;
  } & CarDetailBreadcrumbOptions,
): BreadcrumbSchemaItem[] {
  return buildBreadcrumbSchemaItems({
    items: buildCarDetailBreadcrumbItems(car, { listingsLabel, marketCode }),
    currentHref,
    siteUrl,
  });
}
