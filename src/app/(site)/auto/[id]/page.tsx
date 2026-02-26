import { Metadata } from "next";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import CarDetailClient from "./CarDetailClient";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/config/vat";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { normalizeOgImageUrl } from "@/lib/seo/og-image";

// Revalidate every 10 minutes (car details change when sold/updated)
export const revalidate = 600;

async function getCarData(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ads")
    .select(
      "id, brand, model, year, price_eur, mileage_km, fuel, transmission, body_style, description, photos_json, location_city",
    )
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const car = await getCarData(id);

  if (!car) {
    return {
      title: "InzerĂˇt nenĂˇjdenĂ˝ | Autobazar123",
      description: "Tento inzerĂˇt neexistuje alebo bol odstrĂˇnenĂ˝.",
    };
  }

  const title = `${car.brand} ${car.model} ${car.year} â€“ ${formatCurrency(car.price_eur)} | Autobazar123`;
  const description = `${car.brand} ${car.model}, ${car.year}, ${car.mileage_km.toLocaleString("sk-SK")} km, ${car.fuel}, ${car.transmission}. ${car.location_city || "Slovensko"}. KĂşpte na Autobazar123.`;

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
        <CarDetailClient carId={id} />
      </div>
    </ThemePreviewShell>
  );
}

