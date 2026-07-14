import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import CarDetailClient from "./CarDetailClient";
import { createClient } from "@/lib/supabase/server";
import { getFlagsForClient } from "@/lib/feature-flags";
import { formatCurrency } from "@/config/vat";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { normalizeOgImageUrl } from "@/lib/seo/og-image";
import { buildAdPath, extractAdIdFromRouteParam } from "@/lib/cars/ad-path";
import {
  buildCarDetailBreadcrumbItems,
  buildCarDetailBreadcrumbSchemaItems,
} from "@/lib/cars/detail-breadcrumbs";
import { getPublicCarData } from "@/lib/cars/public-car-detail";
import { type CarData, type SimilarCar } from "@/lib/cars/car-detail";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";

const getCarData = cache(async (id: string): Promise<CarData | null> => {
  return getPublicCarData(id);
});

const getSimilarCars = cache(
  async (
    brand: string,
    model: string,
    year: number,
    transmission: string,
    excludedId: string,
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
  const market = await getRequestMarketConfig();
  const adId = extractAdIdFromRouteParam(id);
  const car = await getCarData(adId);

  if (!car) {
    return {
      title: "Inzerát nenájdený | Autobazar123",
      description: "Tento inzerát neexistuje alebo bol odstránený.",
    };
  }

  const title = `${car.brand} ${car.model} ${car.year} – ${formatCurrency(car.price_eur)} | Autobazar123`;
  const description = `${car.brand} ${car.model}, ${car.year}, ${car.mileage_km.toLocaleString("sk-SK")} km, ${car.fuel}, ${car.transmission}. ${car.location_city || "Slovensko"}. Kúpte na Autobazar123.`;

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
  const market = await getRequestMarketConfig();
  const adId = extractAdIdFromRouteParam(id);
  const car = await getCarData(adId);

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
    ),
    getFlagsForClient(),
  ]);

  const carHref = getMarketPath(buildAdPath({
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
  }), market.code);
  const breadcrumbItems = buildCarDetailBreadcrumbItems(car, market.code);
  const breadcrumbSchemaItems = buildCarDetailBreadcrumbSchemaItems(car, {
    currentHref: carHref,
    siteUrl: market.origin,
    marketCode: market.code,
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
          marketCode={market.code}
        />
      </div>
    </ThemePreviewShell>
  );
}
