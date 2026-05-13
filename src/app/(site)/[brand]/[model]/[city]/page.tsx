import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import {
  InventoryEmptyState,
  InventoryMarketSummary,
  InventorySearchCta,
  ProgrammaticBreadcrumbs,
} from "@/components/seo/ProgrammaticInventorySections";
import { SeoListingCard } from "@/components/seo/SeoListingCard";
import { getSeoInventoryListings } from "@/lib/seo/inventory";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import {
  buildInventorySearchHref,
  buildProgrammaticMetadata,
  createInventoryItemListJsonLd,
  PROGRAMMATIC_SITE_URL,
  summarizeInventory,
} from "@/lib/seo/programmatic-inventory";
import {
  SEO_CITIES,
  getBrandTaxonomy,
  getCityTaxonomy,
  getTopSeoBrandModelCityTriples,
  hasModelForBrand,
  getModelTaxonomy,
} from "@/lib/seo/programmatic-taxonomy";

const CITIES = SEO_CITIES;

export async function generateStaticParams() {
  return (await getTopSeoBrandModelCityTriples()).map(
    ({ brandSlug, modelSlug, citySlug }) => ({
      brand: brandSlug,
      model: modelSlug,
      city: citySlug,
    }),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string; city: string }>;
}): Promise<Metadata> {
  const { brand, model, city } = await params;
  const [brandData, modelData] = await Promise.all([
    getBrandTaxonomy(brand),
    getModelTaxonomy(brand, model),
  ]);
  const cityData = getCityTaxonomy(city);

  if (!brandData || !modelData || !(await hasModelForBrand(brand, model)) || !cityData) {
    return { title: "Nenájdené" };
  }

  const brandName = brandData.name;
  const modelName = modelData.name;
  const cityName = cityData.name;

  return buildProgrammaticMetadata({
    title: `${brandName} ${modelName} ${cityName} | Autobazar123`,
    description: `${brandName} ${modelName} na predaj v ${cityName} a okolí (${cityData.region}). Porovnajte aktuálne ponuky od overených predajcov na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName} ${cityName}`,
      `${brandName} ${modelName} ${cityData.region}`,
      `predaj ${brandName} ${cityName}`,
      `${modelName} bazar ${cityName}`,
      `${brandName} ${modelName} autobazar`,
    ],
    canonicalPath: `/${brand}/${model}/${city}`,
    openGraphTitle: `${brandName} ${modelName} na predaj - ${cityName} | Autobazar123`,
    twitterTitle: `${brandName} ${modelName} v ${cityName} | Autobazar123`,
    twitterDescription: `Porovnajte ponuky ${brandName} ${modelName} v ${cityData.region}.`,
  });
}

export default async function BrandModelCityPage({
  params,
}: {
  params: Promise<{ brand: string; model: string; city: string }>;
}) {
  const { brand, model, city } = await params;
  const [brandData, modelData] = await Promise.all([
    getBrandTaxonomy(brand),
    getModelTaxonomy(brand, model),
  ]);
  const cityData = getCityTaxonomy(city);

  if (!brandData || !modelData || !(await hasModelForBrand(brand, model)) || !cityData) {
    notFound();
  }

  const brandName = brandData.name;
  const modelName = modelData.name;
  const cityName = cityData.name;
  const routeUrl = `${PROGRAMMATIC_SITE_URL}/${brand}/${model}/${city}`;
  const breadcrumbItems = [
    { name: "Domov", url: PROGRAMMATIC_SITE_URL },
    { name: "Autá", url: `${PROGRAMMATIC_SITE_URL}/vysledky` },
    { name: brandName, url: `${PROGRAMMATIC_SITE_URL}/${brand}` },
    { name: `${brandName} ${modelName}`, url: `${PROGRAMMATIC_SITE_URL}/${brand}/${model}` },
    { name: cityName, url: routeUrl },
  ];

  const cars = await getSeoInventoryListings({
    brandName,
    modelName,
    cityName,
    limit: 8,
  });
  const searchHref = buildInventorySearchHref({ brandName, modelName, cityName });
  const inventoryItemListSchema =
    cars.length > 0
      ? createInventoryItemListJsonLd({
          cars,
          listName: `${brandName} ${modelName} v ${cityName} - ponuky`,
        })
      : null;
  const { averagePriceEur, newestYear } = summarizeInventory(cars);
  const otherCities = Object.entries(CITIES).reduce<Array<[string, (typeof CITIES)[string]]>>(
    (entries, entry) => {
      if (entry[0] !== city) {
        entries.push(entry);
      }
      return entries;
    },
    [],
  );

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
          <ProgrammaticBreadcrumbs
            items={[
              { label: "Domov", href: "/" },
              { label: "Autá", href: "/vysledky" },
              { label: brandName, href: `/${brand}` },
              { label: modelName, href: `/${brand}/${model}` },
              { label: cityName },
            ]}
          />

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                📍 {cityName}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
              {brandName} {modelName} - {cityName}
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Najlepšie ponuky {brandName} {modelName} v meste {cityName} a v{" "}
              regióne {cityData.region}. Lokálni predajcovia s možnosťou
              osobnej obhliadky.
            </p>
          </div>

          <div className="mb-8 p-6 rounded-2xl bg-success/5 border border-success/20">
            <h2 className="font-semibold text-primary mb-3">
              ✅ Výhody lokálneho nákupu v {cityName}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 text-sm text-secondary">
              <li>• Možnosť osobnej obhliadky vozidlá</li>
              <li>• Bez nákladov na prepravu</li>
              <li>• Jednoduchšie vybavenie dokladov</li>
              <li>• Lokálni overení predajcovia</li>
            </ul>
          </div>

          {cars.length > 0 ? (
            <InventorySearchCta
              title={`Chcete širší výber pre ${brandName} ${modelName}?`}
              description={`Otvorte kompletné vyhľadávanie a porovnajte viac ponúk, filtrov a cenových variantov pre lokalitu ${cityName}.`}
              href={searchHref}
            />
          ) : null}

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
            <InventoryEmptyState
              message={`Momentálne nemáme ${brandName} ${modelName} v okolí ${cityName}.`}
              href={searchHref}
              padded={false}
            />
          )}

          <div className="mt-12">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {brandName} {modelName} v iných mestách
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherCities.map(([key, data]) => (
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

          <div className="mt-16 prose max-w-none">
            <h2 className="text-xl font-semibold text-primary mb-4">
              {brandName} {modelName} v {cityName} a okolí
            </h2>
            <p className="text-secondary">
              Hľadáte {brandName} {modelName} v okolí {cityName}? Na
              Autobazar123 nájdete overených predajcov z {cityData.region},
              ktorí ponúkajú kvalitné vozidlá s možnosťou osobnej obhliadky.
            </p>
            {cars.length > 0 ? (
              <InventoryMarketSummary
                title={`Rýchly prehľad trhu v lokalite ${cityName}`}
                count={cars.length}
                averagePriceEur={averagePriceEur}
                newestYear={newestYear}
                className="mt-4"
              />
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
