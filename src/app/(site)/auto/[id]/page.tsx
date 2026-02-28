import { cache } from "react";
import { Metadata } from "next";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import CarDetailClient from "./CarDetailClient";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/config/vat";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { normalizeOgImageUrl } from "@/lib/seo/og-image";
import {
  mapCarQueryRowToCarData,
  type CarData,
  type CarQueryRow,
  type SimilarCar,
} from "@/lib/cars/car-detail";

// Revalidate every 10 minutes (car details change when sold/updated)
export const revalidate = 600;

const getCarData = cache(async (id: string): Promise<CarData | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ads")
    .select(
      "*, seller:profiles!seller_id (id, full_name, phone, is_verified, created_at)",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    if (error) {
      console.error("Error fetching car detail:", error);
    }
    return null;
  }

  return mapCarQueryRowToCarData(data as CarQueryRow);
});

const getSimilarCars = cache(
  async (brand: string, excludedId: string): Promise<SimilarCar[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ads")
      .select(
        "id, brand, model, year, price_eur, mileage_km, fuel, transmission, photos_json, location_city",
      )
      .eq("brand", brand)
      .neq("id", excludedId)
      .eq("status", "active")
      .limit(3);

    if (error) {
      console.error("Error fetching similar cars:", error);
      return [];
    }

    return (data || []) as SimilarCar[];
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const car = await getCarData(id);

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
  const car = await getCarData(id);
  const similarCars = car ? await getSimilarCars(car.brand, id) : [];

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
          url: `https://autobazar123.sk/auto/${car.id}`,
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
      <div className="min-h-screen bg-background">
        <CarDetailClient
          carId={id}
          initialCar={car}
          initialSimilarCars={similarCars}
        />
      </div>
    </ThemePreviewShell>
  );
}
