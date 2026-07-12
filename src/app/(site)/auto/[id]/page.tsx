import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import CarDetailClient from "./CarDetailClient";
import { createClient } from "@/lib/supabase/server";
import { getFlagsForClient } from "@/lib/feature-flags";
import type { MarketCode } from "@/config/markets";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { normalizeOgImageUrl } from "@/lib/seo/og-image";
import { getRequestMarketConfig } from "@/lib/market/request";
import {
  formatMarketCurrency,
  formatMarketNumber,
  formatPublicCarValue,
  getPublicMarketCopy,
} from "@/lib/market/public-copy";
import { buildAdPath, extractAdIdFromRouteParam } from "@/lib/cars/ad-path";
import {
  buildCarDetailBreadcrumbItems,
  buildCarDetailBreadcrumbSchemaItems,
} from "@/lib/cars/detail-breadcrumbs";
import { getPublicCarData } from "@/lib/cars/public-car-detail";
import { type CarData, type SimilarCar } from "@/lib/cars/car-detail";
import { getMarketPath } from "@/lib/routes";

const getCarData = cache(
  async (id: string, marketCode: MarketCode): Promise<CarData | null> => {
    return getPublicCarData(id, marketCode);
  },
);

const getSimilarCars = cache(
  async (
    brand: string,
    model: string,
    year: number,
    transmission: string,
    excludedId: string,
    marketCode: MarketCode,
  ): Promise<SimilarCar[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ads")
      .select(
        "id, brand, model, year, price_eur, mileage_km, fuel, transmission, photos_json, location_city",
      )
      .eq("brand", brand)
      .neq("id", excludedId)
      .eq("status", "active")
      .eq("market_code", marketCode)
      .limit(36);

    if (error) {
      console.error("Error fetching similar cars:", error);
      return [];
    }

    const rows = (data || []) as SimilarCar[];
    const ranked = rows
      .map((candidate) => {
        let score = 0;

        if (candidate.model === model) {
          score += 60;
        }

        if (candidate.transmission === transmission) {
          score += 20;
        }

        const yearDistance = Math.abs((candidate.year || 0) - year);
        const yearScore = Math.max(0, 20 - yearDistance * 3);
        score += yearScore;

        return { candidate, score, yearDistance };
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        if (left.yearDistance !== right.yearDistance) {
          return left.yearDistance - right.yearDistance;
        }

        return left.candidate.price_eur - right.candidate.price_eur;
      })
      .slice(0, 3)
      .map((entry) => entry.candidate);

    return ranked;
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const adId = extractAdIdFromRouteParam(id);
  const market = await getRequestMarketConfig();
  const copy = getPublicMarketCopy(market);
  const car = await getCarData(adId, market.code);

  if (!car) {
    return {
      title:
        market.code === "RO"
          ? "Anunț negăsit | Autobazar123"
          : "Inzerát nenájdený | Autobazar123",
      description:
        market.code === "RO"
          ? "Acest anunț nu există sau a fost eliminat."
          : "Tento inzerát neexistuje alebo bol odstránený.",
    };
  }

  const price = formatMarketCurrency(car.price_eur, copy);
  const fuel = formatPublicCarValue(car.fuel, market.code, "fuel");
  const transmission = formatPublicCarValue(
    car.transmission,
    market.code,
    "transmission",
  );
  const title = `${car.brand} ${car.model} ${car.year} - ${price} | Autobazar123`;
  const descriptionAction =
    market.code === "RO" ? "Cumpără pe Autobazar123." : "Kúpte na Autobazar123.";
  const description = `${car.brand} ${car.model}, ${car.year}, ${formatMarketNumber(car.mileage_km, copy)} km, ${fuel}, ${transmission}. ${car.location_city || copy.locationFallback}. ${descriptionAction}`;

  const ogImage = normalizeOgImageUrl(car.photos_json?.[0]);
  return {
    title,
    description,
    alternates: {
      canonical: `${market.origin}${getMarketPath(buildAdPath({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
      }), market.code)}`,
    },
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      locale: copy.openGraphLocale,
      type: "website",
    },
  };
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adId = extractAdIdFromRouteParam(id);
  const market = await getRequestMarketConfig();
  const copy = getPublicMarketCopy(market);
  const car = await getCarData(adId, market.code);

  if (!car) {
    notFound();
  }

  const [similarCars, flags] = await Promise.all([
    getSimilarCars(
      car.brand,
      car.model,
      car.year,
      car.transmission,
      adId,
      market.code,
    ),
    getFlagsForClient(),
  ]);

  const carHref = getMarketPath(buildAdPath({
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
  }), market.code);
  const breadcrumbItems = buildCarDetailBreadcrumbItems(car, {
    listingsLabel: copy.listingsLabel,
    marketCode: market.code,
  });
  const breadcrumbSchemaItems = buildCarDetailBreadcrumbSchemaItems(car, {
    currentHref: carHref,
    listingsLabel: copy.listingsLabel,
    marketCode: market.code,
    siteUrl: market.origin,
  });
  const jsonLd = car
    ? {
        "@context": "https://schema.org",
        "@type": "Vehicle",
        name: `${car.brand} ${car.model}`,
        brand: { "@type": "Brand", name: car.brand },
        model: car.model,
        vehicleModelDate: String(car.year),
        mileageFromOdometer: {
          "@type": "QuantitativeValue",
          value: car.mileage_km,
          unitCode: "KMT",
        },
        fuelType: car.fuel,
        vehicleTransmission: car.transmission,
        bodyType: car.body_style,
        description: car.description,
        image: car.photos_json?.[0],
        offers: {
          "@type": "Offer",
          price: car.price_eur,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${market.origin}${carHref}`,
        },
      }
    : null;
  const jsonLdMarkup = jsonLd ? serializeJsonLd(jsonLd) : null;

  return (
    <ThemePreviewShell scopeLabel="/auto/[id]">
      {jsonLdMarkup && (
        <script type="application/ld+json" suppressHydrationWarning>
          {jsonLdMarkup}
        </script>
      )}
      <BreadcrumbJsonLd items={breadcrumbSchemaItems} />
      <div className="market-page min-h-screen">
        <CarDetailClient
          carId={adId}
          initialCar={car}
          initialSimilarCars={similarCars}
          enableViewTransitions={flags.view_transitions ?? true}
          breadcrumbItems={breadcrumbItems}
        />
      </div>
    </ThemePreviewShell>
  );
}
