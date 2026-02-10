import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarDetailClient from "./CarDetailClient";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/config/vat";

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
      title: "Inzerát nenájdený | Autobazar123",
      description: "Tento inzerát neexistuje alebo bol odstránený.",
    };
  }

  const title = `${car.brand} ${car.model} ${car.year} – ${formatCurrency(car.price_eur)} | Autobazar123`;
  const description = `${car.brand} ${car.model}, ${car.year}, ${car.mileage_km.toLocaleString("sk-SK")} km, ${car.fuel}, ${car.transmission}. ${car.location_city || "Slovensko"}. Kúpte na Autobazar123.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: car.photos_json?.[0] ? [{ url: car.photos_json[0] }] : undefined,
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

  return (
    <div className="min-h-screen bg-background">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <Navbar />
      <CarDetailClient carId={id} />
      <Footer />
    </div>
  );
}
