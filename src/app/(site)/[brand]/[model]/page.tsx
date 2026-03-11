import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { SeoListingCard } from "@/components/seo/SeoListingCard";
import { getSeoInventoryListings, type SeoInventoryListing } from "@/lib/seo/inventory";
import { buildAdPath } from "@/lib/cars/ad-path";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import {
  SEO_CITY_SLUGS,
  formatModelSlug,
  getBrandTaxonomy,
  getAllSeoBrandModelPairs,
  getCityTaxonomy,
  hasModelForBrand,
} from "@/lib/seo/programmatic-taxonomy";

const CITIES = SEO_CITY_SLUGS;
const SITE_URL = "https://autobazar123.sk";

// Generate static params for all brand/model combinations
export async function generateStaticParams() {
  return getAllSeoBrandModelPairs().map(({ brandSlug, modelSlug }) => ({
    brand: brandSlug,
    model: modelSlug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand, model } = await params;
  const brandData = getBrandTaxonomy(brand);

  if (!brandData || !hasModelForBrand(brand, model)) {
    return { title: "Nenájdené" };
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);

  return {
    title: `${brandName} ${modelName} | Predaj na Slovensku | Autobazar123`,
    description: `Najlepšie ponuky ${brandName} ${modelName} na Slovensku. Preskúmajte stovky overených inzerátov s garanciou kvality na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName}`,
      `${brandName} ${modelName} predaj`,
      `${brandName} ${modelName} bazar`,
      `${brandName} ${modelName} ojazdené`,
      `kúpiť ${brandName} ${modelName}`,
    ],
    openGraph: {
      title: `${brandName} ${modelName} na predaj | Autobazar123`,
      description: `Najlepšie ponuky ${brandName} ${modelName} na Slovensku.`,
      url: `${SITE_URL}/${brand}/${model}`,
      siteName: "Autobazar123",
      type: "website",
      locale: "sk_SK",
    },
    twitter: {
      card: "summary_large_image",
      title: `${brandName} ${modelName} na predaj | Autobazar123`,
      description: `Porovnajte aktuálne ponuky modelu ${brandName} ${modelName}.`,
    },
    alternates: {
      canonical: `${SITE_URL}/${brand}/${model}`,
    },
  };
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

function buildSearchHref(brandName: string, modelName: string): string {
  const params = new URLSearchParams({
    brand: brandName,
    model: modelName,
  });
  return `/vysledky?${params.toString()}`;
}

function createModelInventoryItemListJsonLd(
  cars: SeoInventoryListing[],
  brandName: string,
  modelName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brandName} ${modelName} - ponuky`,
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

export default async function BrandModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand, model } = await params;
  const brandData = getBrandTaxonomy(brand);

  if (!brandData || !hasModelForBrand(brand, model)) {
    notFound();
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);
  const routeUrl = `${SITE_URL}/${brand}/${model}`;
  const breadcrumbItems = [
    { name: "Domov", url: SITE_URL },
    { name: "Autá", url: `${SITE_URL}/vysledky` },
    { name: brandName, url: `${SITE_URL}/${brand}` },
    { name: `${brandName} ${modelName}`, url: routeUrl },
  ];

  const cars = await getSeoInventoryListings({
    brandName,
    modelName,
    limit: 12,
  });
  const searchHref = buildSearchHref(brandName, modelName);
  const inventoryItemListSchema =
    cars.length > 0 ? createModelInventoryItemListJsonLd(cars, brandName, modelName) : null;
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
            <ol className="flex items-center gap-2 text-secondary">
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
              <li className="text-primary font-medium">{modelName}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              {brandName} {modelName} na predaj
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Preskúmajte najlepšie ponuky {brandName} {modelName} na Slovensku.
              Všetky inzeráty od overených predajcov s garanciou kvality.
            </p>
          </div>

          {/* Quick Filters by City */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-secondary mb-3">
              {brandName} {modelName} podľa mesta:
            </h2>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((city) => (
                <Link
                  key={city}
                  href={`/${brand}/${model}/${city}`}
                  className="px-4 py-2 rounded-full bg-surface border border-border text-sm text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  {getCityTaxonomy(city)?.name ?? city}
                </Link>
              ))}
            </div>
          </div>

          {cars.length > 0 ? (
            <div className="mb-8 rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <h2 className="text-base font-semibold text-primary">
                Chcete širší výber pre {brandName} {modelName}?
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-secondary">
                Otvorte kompletné vyhľadávanie, porovnajte viac ponúk a
                nastavte si filtre podľa ceny, roku, paliva a lokality.
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((car, index) => (
                <SeoListingCard
                  key={car.id}
                  car={car}
                  source="seo_model_route"
                  position={index + 1}
                  imageSizes="(max-width: 768px) 100vw, 33vw"
                  extraMetaLine={car.fuel || "-"}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-secondary">
                Momentálne nemáme reálne inzeráty pre {brandName} {modelName}.
              </p>
              <Link
                href={searchHref}
                className="mt-4 inline-flex rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Zobraziť výsledky vo vyhľadávaní
              </Link>
            </div>
          )}

          {/* SEO Content */}
          <div className="mt-16 prose max-w-none">
            <h2 className="text-2xl font-bold text-primary mb-4">
              O modeli {brandName} {modelName}
            </h2>
            <p className="text-secondary mb-4">
              {brandName} {modelName} je jedným z najpopulárnejších modelov na
              slovenskom trhu. Vďaka svojmu výkonu, spoľahlivosti a moderným
              technológiám si získal srdcia mnohých slovenských motoristov.
            </p>
            <p className="text-secondary mb-4">
              Na Autobazar123 nájdete široký výber {brandName} {modelName} od
              súkromných predajcov aj overených autobazárov. Každý inzerát
              obsahuje detailné informácie o vozidle, fotogalériu a kontakt na
              predajcu.
            </p>
            {cars.length > 0 ? (
              <div className="mb-4 rounded-xl border border-border bg-surface p-4">
                <h3 className="text-base font-semibold text-primary">
                  Rýchly prehľad trhu pre model {brandName} {modelName}
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

            <h2 className="text-xl font-bold text-primary mt-8 mb-4">
              Prečo kúpiť {brandName} {modelName} cez Autobazar123?
            </h2>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li>Overení predajcovia s garanciou kvality</li>
              <li>Detailné fotografie a technické údaje</li>
              <li>Transparentná história vozidlá</li>
              <li>Bezpečná komunikácia s predajcom</li>
              <li>Kalkulačka leasingu a financovania</li>
            </ul>
          </div>

          {/* Related Models */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-primary mb-6">
              Ďalšie modely {brandName}
            </h2>
            <div className="flex flex-wrap gap-3">
              {brandData.models
                .filter((m) => m !== model)
                .map((relatedModel) => (
                  <Link
                    key={relatedModel}
                    href={`/${brand}/${relatedModel}`}
                    className="px-5 py-2.5 rounded-full border border-border text-primary hover:border-accent hover:text-accent transition-colors"
                  >
                    {brandName} {formatModelName(relatedModel)}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}




