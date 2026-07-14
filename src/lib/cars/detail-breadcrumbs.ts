import { BRAND_URL } from "@/config/brand";
import type { CarData } from "@/lib/cars/car-detail";
import type { MarketCode } from "@/config/markets";
import { getMarketPath } from "@/lib/routes";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbSchemaItem,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";

const FUEL_LABELS: Record<string, string> = {
  petrol: "Benzín",
  diesel: "Nafta",
  electric: "Elektro",
  hybrid: "Hybrid",
  lpg: "LPG",
  cng: "CNG",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: "Manuál",
  automatic: "Automat",
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

function formatKnownLabel(value: string, labels: Record<string, string>) {
  return labels[value.toLowerCase()] ?? value;
}

export function buildCarDetailBreadcrumbTitle(car: CarData) {
  const engine = formatEngineLiters(car.engine_volume_cm3);
  const fuel = car.fuel ? formatKnownLabel(car.fuel, FUEL_LABELS) : null;
  const transmission = car.transmission
    ? formatKnownLabel(car.transmission, TRANSMISSION_LABELS)
    : null;
  const detailParts = [engine, fuel, transmission].filter(Boolean);
  const vehicleName = [car.brand, car.model, ...detailParts].filter(Boolean).join(" ");

  return car.year ? `${vehicleName}, ${car.year}` : vehicleName;
}

export function buildCarDetailBreadcrumbItems(car: CarData, marketCode: MarketCode = "SK"): BreadcrumbTrailItem[] {
  return [
    { label: marketCode === "RO" ? "Anunțuri" : "Inzeráty", href: getMarketPath("/vysledky", marketCode) },
    { label: car.brand, href: buildSearchHref({ brand: car.brand, marketCode }) },
    {
      label: car.model,
      href: buildSearchHref({ brand: car.brand, model: car.model, marketCode }),
    },
    { label: buildCarDetailBreadcrumbTitle(car) },
  ];
}

export function buildCarDetailBreadcrumbSchemaItems(
  car: CarData,
  {
    currentHref,
    siteUrl = BRAND_URL,
    marketCode = "SK",
  }: {
    currentHref: string;
    siteUrl?: string;
    marketCode?: MarketCode;
  },
): BreadcrumbSchemaItem[] {
  return buildBreadcrumbSchemaItems({
    items: buildCarDetailBreadcrumbItems(car, marketCode),
    currentHref,
    siteUrl,
  });
}
