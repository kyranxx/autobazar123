import { BRAND_URL } from "@/config/brand";
import type { CarData } from "@/lib/cars/car-detail";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbSchemaItem,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";

function buildSearchHref({
  brand,
  model,
}: {
  brand?: string;
  model?: string;
}) {
  const params = new URLSearchParams();

  if (brand) {
    params.set("brand", brand);
  }

  if (brand && model) {
    params.set("model", model);
  }

  const query = params.toString();
  return query ? `/vysledky?${query}` : "/vysledky";
}

function formatEngineLiters(engineVolumeCm3: number) {
  if (!Number.isFinite(engineVolumeCm3) || engineVolumeCm3 <= 0) {
    return null;
  }

  return `${(engineVolumeCm3 / 1000).toFixed(1)}`;
}

export function buildCarDetailBreadcrumbTitle(car: CarData) {
  const engine = formatEngineLiters(car.engine_volume_cm3);
  const detailParts = [engine, car.fuel, car.transmission].filter(Boolean);
  const vehicleName = [car.brand, car.model, ...detailParts].filter(Boolean).join(" ");

  return car.year ? `${vehicleName}, ${car.year}` : vehicleName;
}

export function buildCarDetailBreadcrumbItems(car: CarData): BreadcrumbTrailItem[] {
  return [
    { label: "Inzeráty", href: "/vysledky" },
    { label: car.brand, href: buildSearchHref({ brand: car.brand }) },
    {
      label: car.model,
      href: buildSearchHref({ brand: car.brand, model: car.model }),
    },
    { label: buildCarDetailBreadcrumbTitle(car) },
  ];
}

export function buildCarDetailBreadcrumbSchemaItems(
  car: CarData,
  {
    currentHref,
    siteUrl = BRAND_URL,
  }: {
    currentHref: string;
    siteUrl?: string;
  },
): BreadcrumbSchemaItem[] {
  return buildBreadcrumbSchemaItems({
    items: buildCarDetailBreadcrumbItems(car),
    currentHref,
    siteUrl,
  });
}
