import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { SeoListingCard } from "@/components/seo/SeoListingCard";
import { getSeoInventoryListings, type SeoInventoryListing } from "@/lib/seo/inventory";
import { buildAdPath } from "@/lib/cars/ad-path";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import {
  SEO_CITIES,
  formatModelSlug,
  getBrandTaxonomy,
  getCityTaxonomy,
  getTopSeoBrandModelCityTriples,
  hasModelForBrand,
} from "@/lib/seo/programmatic-taxonomy";
const CITIES = SEO_CITIES;
const SITE_URL = "https://autobazar123.sk";

// Generate static params for popular combinations
export async function generateStaticParams() {
  return getTopSeoBrandModelCityTriples().map(
    ({ brandSlug, modelSlug, citySlug }) => ({
      brand: brandSlug,
      model: modelSlug,
      city: citySlug,
    }),
  );
}

function formatModelName(model: string): string {
  return formatModelSlug(model);
}

function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${normalizedPath}`;
}

function buildSearchHref(brandName: string, modelName: string, cityName: string): string {
  const params = new URLSearchParams({
    brand: brandName,
    model: modelName,
    location: cityName,
  });
  return `/vysledky?${params.toString()}`;
}

function createCityInventoryItemListJsonLd(
  cars: SeoInventoryListing[],
  brandName: string,
  modelName: string,
  cityName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brandName} ${modelName} v ${cityName} - ponuky`,
    numberOfItems: cars.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: cars.map((car, index) => {
      const carPath = buildAdPath({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
      });
      const carUrl = toAbsoluteUrl(carPath);
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
          image: toAbsoluteUrl(car.image),
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string; city: string }>;
}): Promise<Metadata> {
  const { brand, model, city } = await params;
  const brandData = getBrandTaxonomy(brand);
  const cityData = getCityTaxonomy(city);

  if (!brandData || !hasModelForBrand(brand, model) || !cityData) {
    return { title: "Nenájdené" };
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);
  const cityName = cityData.name;

  return {
    title: `${brandName} ${modelName} ${cityName} | Autobazar123`,
    description: `${brandName} ${modelName} na predaj v ${cityName} a okolí (${cityData.region}). Porovnajte aktuálne ponuky od overených predajcov na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName} ${cityName}`,
      `${brandName} ${modelName} ${cityData.region}`,
      `predaj ${brandName} ${cityName}`,
      `${modelName} bazar ${cityName}`,
      `${brandName} ${modelName} autobazar`,
    ],
    openGraph: {
      title: `${brandName} ${modelName} na predaj - ${cityName} | Autobazar123`,
      description: `Najlepšie ponuky ${brandName} ${modelName} v ${cityName} a okolí.`,
      url: `${SITE_URL}/${brand}/${model}/${city}`,
      siteName: "Autobazar123",
      type: "website",
      locale: "sk_SK",
    },
    twitter: {
      card: "summary_large_image",
      title: `${brandName} ${modelName} v ${cityName} | Autobazar123`,
      description: `Porovnajte ponuky ${brandName} ${modelName} v ${cityData.region}.`,
    },
    alternates: {
      canonical: `${SITE_URL}/${brand}/${model}/${city}`,
    },
  };
}

export default async function BrandModelCityPage({
  params,
}: {
  params: Promise<{ brand: string; model: string; city: string }>;
}) {
  const { brand, model, city } = await params;
  const brandData = getBrandTaxonomy(brand);
  const cityData = getCityTaxonomy(city);

  if (!brandData || !hasModelForBrand(brand, model) || !cityData) {
    notFound();
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);
  const cityName = cityData.name;
  const routeUrl = `${SITE_URL}/${brand}/${model}/${city}`;
  const breadcrumbItems = [
    { name: "Domov", url: SITE_URL },
    { name: "Autá", url: `${SITE_URL}/vysledky` },
    { name: brandName, url: `${SITE_URL}/${brand}` },
    { name: `${brandName} ${modelName}`, url: `${SITE_URL}/${brand}/${model}` },
    { name: cityName, url: routeUrl },
  ];

  const cars = await getSeoInventoryListings({
    brandName,
    modelName,
    cityName,
    limit: 8,
  });
  const searchHref = buildSearchHref(brandName, modelName, cityName);
  const inventoryItemListSchema =
    cars.length > 0 ? createCityInventoryItemListJsonLd(cars, brandName, modelName, cityName) : null;
  const pricedCars = cars.filter(
    (car): car is SeoInventoryListing & { priceEur: number } => typeof car.priceEur === "number",
  );
  const averagePriceEur =
    pricedCars.length > 0
      ? Math.round(pricedCars.reduce((sum, car) => sum + car.priceEur, 0) / pricedCars.length)
      : null;
  const newestYear = cars.reduce((latest, car) => {
    if (typeof car.year !== "number") return latest;
    return car.year > latest ? car.year : latest;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {inventoryItemListSchema ? (
        <script type="application/ld+json" suppressHydrationWarning>
          {serializeJsonLd(inventoryItemListSchema)}
        </script>
      ) : null}
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-secondary flex-wrap">
              <li>
                <Link href="/" className="hover:text-accent">
                  Domov
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/vysledky" className="hover:text-accent">
                  Autá
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/${brand}`} className="hover:text-accent">
                  {brandName}
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/${brand}/${model}`} className="hover:text-accent">
                  {modelName}
                </Link>
              </li>
              <li>/</li>
              <li className="text-primary font-medium">{cityName}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                📍 {cityName}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              {brandName} {modelName} - {cityName}
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Najlepšie ponuky {brandName} {modelName} v meste {cityName} a v{" "}
              regióne {cityData.region}. Lokálni predajcovia s možnosťou
              osobnej obhliadky.
            </p>
          </div>

          {/* Local Benefits */}
          <div className="mb-8 p-6 rounded-2xl bg-success/5 border border-success/20">
            <h2 className="font-semibold text-primary mb-3">
              ✅ Výhody lokálneho nákupu v {cityName}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 text-sm text-secondary">
              <li>• Možnosť osobnej obhliadky vozidla</li>
              <li>• Bez nákladov na prepravu</li>
              <li>• Jednoduchšie vybavenie dokladov</li>
              <li>• Lokálni overení predajcovia</li>
            </ul>
          </div>

          {cars.length > 0 ? (
            <div className="mb-8 rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <h2 className="text-base font-semibold text-primary">
                Chcete širší výber pre {brandName} {modelName}?
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-secondary">
                Otvorte kompletné vyhľadávanie a porovnajte viac ponúk,
                filtrov a cenových variantov pre lokalitu {cityName}.
              </p>
              <Link
                href={searchHref}
                className="mt-4 inline-flex rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Zobraziť všetky výsledky vo vyhľadávaní
              </Link>
            </div>
          ) : null}

          {/* Cars Grid */}
          {cars.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cars.map((car, index) => (
                <SeoListingCard
                  key={car.id}
                  car={car}
                  source="seo_city_route"
                  position={index + 1}
                  imageSizes="(max-width: 768px) 100vw, 25vw"
                  showCityBadge
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary">
                Momentálne nemáme {brandName} {modelName} v okolí {cityName}.
              </p>
              <Link
                href={searchHref}
                className="mt-4 inline-flex rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Zobraziť výsledky vo vyhľadávaní
              </Link>
            </div>
          )}

          {/* Other Cities */}
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {brandName} {modelName} v iných mestách
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CITIES)
                .filter(([key]) => key !== city)
                .map(([key, data]) => (
                  <Link
                    key={key}
                    href={`/${brand}/${model}/${key}`}
                    className="px-4 py-2 rounded-full border border-border text-sm text-secondary hover:border-accent hover:text-accent transition-colors"
                  >
                    {data.name}
                  </Link>
                ))}
            </div>
          </div>

          {/* SEO Content */}
          <div className="mt-16 prose max-w-none">
            <h2 className="text-xl font-bold text-primary mb-4">
              {brandName} {modelName} v {cityName} a okolí
            </h2>
            <p className="text-secondary">
              Hľadáte {brandName} {modelName} v okolí {cityName}? Na
              Autobazar123 nájdete overených predajcov z {cityData.region},
              ktorí ponúkajú kvalitné vozidlá s možnosťou osobnej obhliadky.
            </p>
            {cars.length > 0 ? (
              <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                <h3 className="text-base font-semibold text-primary">
                  Rýchly prehľad trhu v lokalite {cityName}
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-secondary">
                  <li>Dostupné ponuky na stránke: {cars.length}</li>
                  {averagePriceEur !== null ? (
                    <li>Priemerná cena: {averagePriceEur.toLocaleString("sk-SK")} EUR</li>
                  ) : null}
                  {newestYear > 0 ? <li>Najnovší modelový rok: {newestYear}</li> : null}
                </ul>
              </div>
            ) : null}
            <p className="text-secondary mt-4">
              Lokálny nákup vám ušetrí čas aj peniaze za prepravu. Všetci naši
              predajcovia v {cityName} prešli overením a poskytujú transparentné
              informácie o histórii vozidla.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}




