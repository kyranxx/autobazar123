import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { SEO_CONFIG } from "@/config/config";
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
  summarizeInventory,
} from "@/lib/seo/programmatic-inventory";
import {
  getBrandTaxonomy,
  getCityTaxonomy,
  getTopSeoBrandModelCityTriples,
  hasModelForBrand,
  getModelTaxonomy,
} from "@/lib/seo/programmatic-taxonomy";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";

const CITY_PAGE_MIN_ACTIVE_ADS = SEO_CONFIG.sitemapCityPageMinActiveAds;

function buildNoindexMetadata(): Metadata {
  return {
    title: "Nenájdené",
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function getLaunchCityInventory({
  brandName,
  modelName,
  cityName,
}: {
  brandName: string;
  modelName: string;
  cityName: string;
}) {
  return getSeoInventoryListings({
    brandName,
    modelName,
    cityName,
    limit: CITY_PAGE_MIN_ACTIVE_ADS,
  });
}

export async function generateStaticParams() {
  // Cache Components requires at least one build-time sample; runtime inventory
  // gating below still controls whether city pSEO pages actually render.
  const [sample] = await getTopSeoBrandModelCityTriples();
  if (!sample) {
    return [];
  }

  return [
    {
      brand: sample.brandSlug,
      model: sample.modelSlug,
      city: sample.citySlug,
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string; city: string }>;
}): Promise<Metadata> {
  const { brand, model, city } = await params;
  const market = await getRequestMarketConfig();
  const [brandData, modelData] = await Promise.all([
    getBrandTaxonomy(brand),
    getModelTaxonomy(brand, model),
  ]);
  const cityData = getCityTaxonomy(city);

  if (!brandData || !modelData || !(await hasModelForBrand(brand, model)) || !cityData) {
    return buildNoindexMetadata();
  }

  const brandName = brandData.name;
  const modelName = modelData.name;
  const cityName = cityData.name;
  const isRomanian = market.code === "RO";
  const cars = await getLaunchCityInventory({ brandName, modelName, cityName });

  if (cars.length < CITY_PAGE_MIN_ACTIVE_ADS) {
    return buildNoindexMetadata();
  }

  return buildProgrammaticMetadata({
    title: `${brandName} ${modelName} ${cityName} | Autobazar123`,
    description: isRomanian
      ? `${brandName} ${modelName} de vânzare în ${cityName} și împrejurimi. Compară ofertele disponibile pe Autobazar123.`
      : `${brandName} ${modelName} na predaj v ${cityName} a okolí (${cityData.region}). Porovnajte dostupné ponuky na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName} ${cityName}`,
      `${brandName} ${modelName} ${cityData.region}`,
      `predaj ${brandName} ${cityName}`,
      `${modelName} bazar ${cityName}`,
      `${brandName} ${modelName} autobazar`,
    ],
    canonicalPath: `/${brand}/${model}/${city}`,
    openGraphTitle: isRomanian ? `${brandName} ${modelName} de vânzare - ${cityName} | Autobazar123` : `${brandName} ${modelName} na predaj - ${cityName} | Autobazar123`,
    twitterTitle: `${brandName} ${modelName} v ${cityName} | Autobazar123`,
    twitterDescription: isRomanian ? `Compară ofertele ${brandName} ${modelName} din ${cityName}.` : `Porovnajte ponuky ${brandName} ${modelName} v ${cityData.region}.`,
    siteUrl: market.origin,
    locale: market.code === "RO" ? "ro_RO" : "sk_SK",
  });
}

export default async function BrandModelCityPage({
  params,
}: {
  params: Promise<{ brand: string; model: string; city: string }>;
}) {
  const { brand, model, city } = await params;
  const market = await getRequestMarketConfig();
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
  const cars = await getLaunchCityInventory({ brandName, modelName, cityName });

  if (cars.length < CITY_PAGE_MIN_ACTIVE_ADS) {
    notFound();
  }

  const routeUrl = `${market.origin}/${brand}/${model}/${city}`;
  const breadcrumbItems = [
    { name: market.code === "RO" ? "Anunțuri" : "Inzeráty", url: `${market.origin}${getMarketPath("/vysledky", market.code)}` },
    { name: brandName, url: `${market.origin}/${brand}` },
    { name: modelName, url: `${market.origin}/${brand}/${model}` },
    { name: cityName, url: routeUrl },
  ];

  const searchHref = buildInventorySearchHref({ brandName, modelName, cityName, marketCode: market.code });
  const inventoryItemListSchema =
    cars.length > 0
      ? createInventoryItemListJsonLd({
          cars,
          listName: `${brandName} ${modelName} v ${cityName} - ponuky`,
          siteUrl: market.origin,
          marketCode: market.code,
        })
      : null;
  const { averagePriceEur, newestYear } = summarizeInventory(cars);
  return (
    <div className="market-page min-h-screen">
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
              { label: market.code === "RO" ? "Anunțuri" : "Inzeráty", href: getMarketPath("/vysledky", market.code) },
              { label: brandName, href: `/${brand}` },
              { label: modelName, href: `/${brand}/${model}` },
              { label: cityName },
            ]}
          />

          <div className="market-panel market-hero mb-8 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="market-chip">{cityName}</span>
            </div>
            <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
              {brandName} {modelName} - {cityName}
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Aktuálne ponuky {brandName} {modelName} v meste {cityName} a v{" "}
              regióne {cityData.region}. Predajcovia z regiónu môžu ponúknuť
              možnosť osobnej obhliadky.
            </p>
          </div>

          <div className="market-soft-band mb-8 p-6">
            <h2 className="font-semibold text-primary mb-3">
              Výhody lokálneho nákupu v {cityName}
            </h2>
            <ul className="grid list-disc gap-2 pl-5 text-sm text-secondary sm:grid-cols-2">
              <li>Možnosť osobnej obhliadky vozidla</li>
              <li>Bez nákladov na prepravu</li>
              <li>Jednoduchšie vybavenie dokladov</li>
              <li>Predajcovia z regiónu</li>
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

          <div className="market-card market-readable mt-16 max-w-none p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">
              {brandName} {modelName} v {cityName} a okolí
            </h2>
            <p className="text-secondary">
              Hľadáte {brandName} {modelName} v okolí {cityName}? Na
              Autobazar123 nájdete dostupné inzeráty z {cityData.region}
              s možnosťou osobnej obhliadky.
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
              Lokálny nákup vám môže ušetriť čas aj peniaze za prepravu. Sledujte
              popis inzerátu, fotografie a dohodnite si obhliadku priamo s predajcom.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
