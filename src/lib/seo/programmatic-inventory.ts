import type { Metadata } from "next";
import { BRAND_URL } from "@/config/brand";
import type { SeoInventoryListing } from "@/lib/seo/inventory";
import { buildAdPath } from "@/lib/cars/ad-path";
import type { MarketCode } from "@/config/markets";
import { getMarketPath } from "@/lib/routes";

export const PROGRAMMATIC_SITE_URL = BRAND_URL;

function toAbsoluteProgrammaticUrl(pathOrUrl: string, siteUrl = PROGRAMMATIC_SITE_URL): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl}${normalizedPath}`;
}

export function buildInventorySearchHref({
  brandName,
  modelName,
  cityName,
  marketCode = "SK",
}: {
  brandName: string;
  modelName: string;
  cityName?: string;
  marketCode?: MarketCode;
}): string {
  const params = new URLSearchParams({
    brand: brandName,
    model: modelName,
  });

  if (cityName) {
    params.set("location", cityName);
  }

  return getMarketPath(`/vysledky?${params.toString()}`, marketCode);
}

export function createInventoryItemListJsonLd({
  cars,
  listName,
  siteUrl = PROGRAMMATIC_SITE_URL,
  marketCode = "SK",
}: {
  cars: SeoInventoryListing[];
  listName: string;
  siteUrl?: string;
  marketCode?: MarketCode;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: cars.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: cars.map((car, index) => {
      const carPath = getMarketPath(buildAdPath({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
      }), marketCode);
      const carUrl = toAbsoluteProgrammaticUrl(carPath, siteUrl);
      const listingName = `${car.brand} ${car.model}${car.year ? ` ${car.year}` : ""}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: carUrl,
        name: listingName,
        item: {
          "@type": "Vehicle",
          name: listingName,
          brand: {
            "@type": "Brand",
            name: car.brand,
          },
          model: car.model,
          image: toAbsoluteProgrammaticUrl(car.image, siteUrl),
          mileageFromOdometer:
            typeof car.mileageKm === "number"
              ? {
                  "@type": "QuantitativeValue",
                  value: car.mileageKm,
                  unitCode: "KMT",
                }
              : undefined,
          offers:
            typeof car.priceEur === "number"
              ? {
                  "@type": "Offer",
                  price: car.priceEur,
                  priceCurrency: "EUR",
                  availability: "https://schema.org/InStock",
                  url: carUrl,
                }
              : undefined,
        },
      };
    }),
  };
}

export function summarizeInventory(cars: SeoInventoryListing[]) {
  const pricedCars = cars.filter(
    (car): car is SeoInventoryListing & { priceEur: number } =>
      typeof car.priceEur === "number",
  );

  const averagePriceEur =
    pricedCars.length > 0
      ? Math.round(pricedCars.reduce((sum, car) => sum + car.priceEur, 0) / pricedCars.length)
      : null;

  const newestYear = cars.reduce((latest, car) => {
    if (typeof car.year !== "number") {
      return latest;
    }

    return car.year > latest ? car.year : latest;
  }, 0);

  return {
    averagePriceEur,
    newestYear,
  };
}

export function buildProgrammaticMetadata({
  title,
  description,
  keywords,
  canonicalPath,
  openGraphTitle,
  twitterTitle,
  twitterDescription,
  siteUrl = PROGRAMMATIC_SITE_URL,
  locale = "sk_SK",
}: {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
  openGraphTitle: string;
  twitterTitle: string;
  twitterDescription: string;
  siteUrl?: string;
  locale?: string;
}): Metadata {
  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: openGraphTitle,
      description,
      url: canonicalUrl,
      siteName: "Autobazar123",
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
