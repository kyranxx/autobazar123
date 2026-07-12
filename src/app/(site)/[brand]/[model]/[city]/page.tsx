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
import { getPublicMarketCopy } from "@/lib/market/public-copy";
import type { MarketCode } from "@/config/markets";

const CITY_PAGE_MIN_ACTIVE_ADS = SEO_CONFIG.sitemapCityPageMinActiveAds;

function buildNoindexMetadata(title = "Nenájdené"): Metadata {
  return {
    title,
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

function getBrandModelCityPageCopy(
  marketCode: MarketCode,
  brandName: string,
  modelName: string,
  cityName: string,
  region: string,
) {
  if (marketCode === "RO") {
    return {
      notFound: "Nu a fost găsit",
      description: `${brandName} ${modelName} de vânzare în ${cityName} și împrejurimi (${region}). Compară ofertele disponibile pe Autobazar123.`,
      keywords: [
        `${brandName} ${modelName} ${cityName}`,
        `${brandName} ${modelName} ${region}`,
        `${brandName} de vânzare ${cityName}`,
        `${modelName} second hand ${cityName}`,
        `${brandName} ${modelName} autobazar`,
      ],
      openGraphTitle: `${brandName} ${modelName} de vânzare - ${cityName} | Autobazar123`,
      twitterTitle: `${brandName} ${modelName} în ${cityName} | Autobazar123`,
      twitterDescription: `Compară anunțuri ${brandName} ${modelName} în ${region}.`,
      listName: `${brandName} ${modelName} în ${cityName} - anunțuri`,
      intro: `Anunțuri actuale ${brandName} ${modelName} în ${cityName} și în regiunea ${region}. Vânzătorii din zonă pot oferi vizionare personală.`,
      localBenefitsTitle: `Avantajele cumpărării locale în ${cityName}`,
      localBenefits: [
        "Posibilitatea de a vedea mașina personal",
        "Fără costuri suplimentare de transport",
        "Acte și predare mai simple",
        "Vânzători din regiune",
      ],
      ctaTitle: `Vrei o selecție mai largă pentru ${brandName} ${modelName}?`,
      ctaDescription: `Deschide căutarea completă și compară mai multe anunțuri, filtre și variante de preț pentru ${cityName}.`,
      emptyMessage: `Momentan nu avem ${brandName} ${modelName} în zona ${cityName}.`,
      readableTitle: `${brandName} ${modelName} în ${cityName} și împrejurimi`,
      readableFirst: `Cauți ${brandName} ${modelName} în zona ${cityName}? Pe Autobazar123 găsești anunțuri disponibile din ${region}, cu posibilitatea de vizionare personală.`,
      summaryTitle: `Privire rapidă asupra pieței în ${cityName}`,
      readableSecond:
        "Cumpărarea locală îți poate economisi timp și costuri de transport. Verifică descrierea anunțului, fotografiile și stabilește vizionarea direct cu vânzătorul.",
      availableLabel: "Anunțuri disponibile pe pagină",
      averagePriceLabel: "Preț mediu",
      newestYearLabel: "Cel mai nou an de model",
    };
  }

  return {
    notFound: "Nenájdené",
    description: `${brandName} ${modelName} na predaj v ${cityName} a okolí (${region}). Porovnajte dostupné ponuky na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName} ${cityName}`,
      `${brandName} ${modelName} ${region}`,
      `predaj ${brandName} ${cityName}`,
      `${modelName} bazar ${cityName}`,
      `${brandName} ${modelName} autobazar`,
    ],
    openGraphTitle: `${brandName} ${modelName} na predaj - ${cityName} | Autobazar123`,
    twitterTitle: `${brandName} ${modelName} v ${cityName} | Autobazar123`,
    twitterDescription: `Porovnajte ponuky ${brandName} ${modelName} v ${region}.`,
    listName: `${brandName} ${modelName} v ${cityName} - ponuky`,
    intro: `Aktuálne ponuky ${brandName} ${modelName} v meste ${cityName} a v regióne ${region}. Predajcovia z regiónu môžu ponúknuť možnosť osobnej obhliadky.`,
    localBenefitsTitle: `Výhody lokálneho nákupu v ${cityName}`,
    localBenefits: [
      "Možnosť osobnej obhliadky vozidla",
      "Bez nákladov na prepravu",
      "Jednoduchšie vybavenie dokladov",
      "Predajcovia z regiónu",
    ],
    ctaTitle: `Chcete širší výber pre ${brandName} ${modelName}?`,
    ctaDescription: `Otvorte kompletné vyhľadávanie a porovnajte viac ponúk, filtrov a cenových variantov pre lokalitu ${cityName}.`,
    emptyMessage: `Momentálne nemáme ${brandName} ${modelName} v okolí ${cityName}.`,
    readableTitle: `${brandName} ${modelName} v ${cityName} a okolí`,
    readableFirst: `Hľadáte ${brandName} ${modelName} v okolí ${cityName}? Na Autobazar123 nájdete dostupné inzeráty z ${region} s možnosťou osobnej obhliadky.`,
    summaryTitle: `Rýchly prehľad trhu v lokalite ${cityName}`,
    readableSecond:
      "Lokálny nákup vám môže ušetriť čas aj peniaze za prepravu. Sledujte popis inzerátu, fotografie a dohodnite si obhliadku priamo s predajcom.",
    availableLabel: "Dostupné ponuky na stránke",
    averagePriceLabel: "Priemerná cena",
    newestYearLabel: "Najnovší modelový rok",
  };
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
  const [brandData, modelData, market] = await Promise.all([
    getBrandTaxonomy(brand),
    getModelTaxonomy(brand, model),
    getRequestMarketConfig(),
  ]);
  const marketCopy = getPublicMarketCopy(market);
  const cityData = getCityTaxonomy(city);

  if (!brandData || !modelData || !(await hasModelForBrand(brand, model)) || !cityData) {
    return buildNoindexMetadata(getBrandModelCityPageCopy(market.code, "", "", "", "").notFound);
  }

  const brandName = brandData.name;
  const modelName = modelData.name;
  const cityName = cityData.name;
  const cars = await getLaunchCityInventory({ brandName, modelName, cityName });

  if (cars.length < CITY_PAGE_MIN_ACTIVE_ADS) {
    return buildNoindexMetadata(getBrandModelCityPageCopy(market.code, "", "", "", "").notFound);
  }
  const copy = getBrandModelCityPageCopy(
    market.code,
    brandName,
    modelName,
    cityName,
    cityData.region,
  );

  return buildProgrammaticMetadata({
    title: `${brandName} ${modelName} ${cityName} | Autobazar123`,
    description: copy.description,
    keywords: copy.keywords,
    canonicalPath: `/${brand}/${model}/${city}`,
    openGraphTitle: copy.openGraphTitle,
    twitterTitle: copy.twitterTitle,
    twitterDescription: copy.twitterDescription,
    siteUrl: market.origin,
    openGraphLocale: marketCopy.openGraphLocale,
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
  const market = await getRequestMarketConfig();
  const marketCopy = getPublicMarketCopy(market);
  const copy = getBrandModelCityPageCopy(
    market.code,
    brandName,
    modelName,
    cityName,
    cityData.region,
  );
  const cars = await getLaunchCityInventory({ brandName, modelName, cityName });

  if (cars.length < CITY_PAGE_MIN_ACTIVE_ADS) {
    notFound();
  }

  const routeUrl = `${market.origin}/${brand}/${model}/${city}`;
  const breadcrumbItems = [
    { name: marketCopy.listingsLabel, url: `${market.origin}${getMarketPath("/vysledky", market.code)}` },
    { name: brandName, url: `${market.origin}/${brand}` },
    { name: modelName, url: `${market.origin}/${brand}/${model}` },
    { name: cityName, url: routeUrl },
  ];

  const searchHref = buildInventorySearchHref({ brandName, modelName, cityName, marketCode: market.code });
  const inventoryItemListSchema =
    cars.length > 0
      ? createInventoryItemListJsonLd({
          cars,
          listName: copy.listName,
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
              { label: marketCopy.listingsLabel, href: getMarketPath("/vysledky", market.code) },
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
              {copy.intro}
            </p>
          </div>

          <div className="market-soft-band mb-8 p-6">
            <h2 className="font-semibold text-primary mb-3">
              {copy.localBenefitsTitle}
            </h2>
            <ul className="grid list-disc gap-2 pl-5 text-sm text-secondary sm:grid-cols-2">
              {copy.localBenefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>

          {cars.length > 0 ? (
            <InventorySearchCta
              title={copy.ctaTitle}
              description={copy.ctaDescription}
              href={searchHref}
              ctaLabel={marketCopy.viewOffers}
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
                  locale={marketCopy.languageTag}
                />
              ))}
            </div>
          ) : (
            <InventoryEmptyState
              message={copy.emptyMessage}
              href={searchHref}
              padded={false}
              ctaLabel={marketCopy.viewOffers}
            />
          )}

          <div className="market-card market-readable mt-16 max-w-none p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">
              {copy.readableTitle}
            </h2>
            <p className="text-secondary">
              {copy.readableFirst}
            </p>
            {cars.length > 0 ? (
              <InventoryMarketSummary
                title={copy.summaryTitle}
                count={cars.length}
                averagePriceEur={averagePriceEur}
                newestYear={newestYear}
                className="mt-4"
                locale={marketCopy.languageTag}
                availableLabel={copy.availableLabel}
                averagePriceLabel={copy.averagePriceLabel}
                newestYearLabel={copy.newestYearLabel}
              />
            ) : null}
            <p className="text-secondary mt-4">
              {copy.readableSecond}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
