export interface CarDetailBreadcrumbSource {
  brand: string;
  model: string;
  year: number;
  engine_volume_cm3?: number;
  fuel?: string;
  transmission?: string;
}

export interface CarDetailBreadcrumbItem {
  label: string;
  href?: string;
}

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

function normalizeText(value?: string): string {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function labelFromMap(value: string | undefined, labels: Record<string, string>): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  return labels[normalized.toLowerCase()] || normalized;
}

function formatEngineVolume(engineVolumeCm3?: number): string {
  if (!engineVolumeCm3 || !Number.isFinite(engineVolumeCm3) || engineVolumeCm3 < 500) {
    return "";
  }

  return (Math.round(engineVolumeCm3 / 100) / 10).toFixed(1);
}

function buildMakeModelLabel(car: CarDetailBreadcrumbSource): string {
  return [normalizeText(car.brand), normalizeText(car.model)]
    .filter(Boolean)
    .join(" ")
    || "Inzerát";
}

function buildModelSearchHref(car: CarDetailBreadcrumbSource): string {
  const params = new URLSearchParams();
  const brand = normalizeText(car.brand);
  const model = normalizeText(car.model);

  if (brand) {
    params.set("brand", brand);
  }

  if (model) {
    params.set("model", model);
  }

  const query = params.toString();
  return query ? `/vysledky?${query}` : "/vysledky";
}

export function buildCarDetailBreadcrumbCurrentLabel(
  car: CarDetailBreadcrumbSource,
): string {
  const makeModel = buildMakeModelLabel(car);
  const detailParts = [
    formatEngineVolume(car.engine_volume_cm3),
    labelFromMap(car.fuel, FUEL_LABELS),
    labelFromMap(car.transmission, TRANSMISSION_LABELS),
  ].filter(Boolean);
  const detailLabel = detailParts.length > 0 ? ` ${detailParts.join(" ")}` : "";
  const yearLabel = car.year ? `, ${car.year}` : "";

  return `${makeModel}${detailLabel}${yearLabel}`;
}

export function buildCarDetailBreadcrumbItems(
  car: CarDetailBreadcrumbSource,
): CarDetailBreadcrumbItem[] {
  return [
    { label: "Inzeráty", href: "/vysledky" },
    {
      label: buildMakeModelLabel(car),
      href: buildModelSearchHref(car),
    },
    { label: buildCarDetailBreadcrumbCurrentLabel(car) },
  ];
}

function toAbsoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${normalizedSiteUrl}${normalizedPath}`;
}

export function buildCarDetailBreadcrumbJsonLd(input: {
  car: CarDetailBreadcrumbSource;
  canonicalUrl: string;
  siteUrl: string;
}) {
  const items = buildCarDetailBreadcrumbItems(input.car);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: index === items.length - 1
        ? input.canonicalUrl
        : toAbsoluteUrl(input.siteUrl, item.href || "/"),
    })),
  };
}
