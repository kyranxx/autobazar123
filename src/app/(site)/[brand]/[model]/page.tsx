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
  summarizeInventory,
} from "@/lib/seo/programmatic-inventory";
import {
  getAllSeoBrandModelPairs,
  getBrandTaxonomy,
  hasModelForBrand,
  getModelTaxonomy,
} from "@/lib/seo/programmatic-taxonomy";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";
import { getPublicMarketCopy } from "@/lib/market/public-copy";
import type { MarketCode } from "@/config/markets";

function getBrandModelPageCopy(
  marketCode: MarketCode,
  brandName: string,
  modelName: string,
) {
  if (marketCode === "RO") {
    return {
      notFound: "Nu a fost găsit",
      title: `${brandName} ${modelName} | Mașini de vânzare în România | AutoNinja`,
      description: `Anunțuri actuale ${brandName} ${modelName} în România. Compară ofertele disponibile și detaliile vehiculelor pe AutoNinja.`,
      keywords: [
        `${brandName} ${modelName}`,
        `${brandName} ${modelName} de vânzare`,
        `${brandName} ${modelName} second hand`,
        `${brandName} ${modelName} rulat`,
        `cumpără ${brandName} ${modelName}`,
      ],
      openGraphTitle: `${brandName} ${modelName} de vânzare | AutoNinja`,
      twitterDescription: `Compară anunțurile actuale pentru ${brandName} ${modelName}.`,
      listName: `${brandName} ${modelName} - anunțuri`,
      heading: `${brandName} ${modelName} de vânzare`,
      intro: `Vezi anunțurile actuale ${brandName} ${modelName} în România. Compară ofertele disponibile, fotografiile și contactul vânzătorului.`,
      ctaTitle: `Vrei o selecție mai largă pentru ${brandName} ${modelName}?`,
      ctaDescription:
        "Deschide căutarea completă, compară mai multe anunțuri și setează filtre după preț, an, combustibil și localitate.",
      emptyMessage: `Momentan nu avem anunțuri reale pentru ${brandName} ${modelName}.`,
      aboutTitle: `Despre modelul ${brandName} ${modelName}`,
      aboutFirst: `${brandName} ${modelName} este unul dintre modelele populare de pe piața din România. Este căutat pentru echilibrul dintre preț, fiabilitate și dotări.`,
      aboutSecond: `Pe AutoNinja adunăm treptat anunțuri ${brandName} ${modelName} de la vânzători privați și dealeri. Fiecare anunț include detalii despre vehicul, fotografii și contact direct cu vânzătorul.`,
      summaryTitle: `Privire rapidă asupra pieței pentru ${brandName} ${modelName}`,
      whyTitle: `De ce să cumperi ${brandName} ${modelName} prin AutoNinja?`,
      whyBullets: [
        "Anunțuri disponibile de la vânzători privați și dealeri",
        "Fotografii detaliate și date tehnice",
        "Spațiu pentru descriere transparentă a vehiculului",
        "Contact direct cu vânzătorul",
        "Calculator pentru leasing și finanțare",
      ],
      relatedModels: `Alte modele ${brandName}`,
      availableLabel: "Anunțuri disponibile pe pagină",
      averagePriceLabel: "Preț mediu",
      newestYearLabel: "Cel mai nou an de model",
    };
  }

  return {
    notFound: "Nenájdené",
    title: `${brandName} ${modelName} | Predaj na Slovensku | Autobazar123`,
    description: `Aktuálne ponuky ${brandName} ${modelName} na Slovensku. Porovnajte dostupné inzeráty a detaily vozidiel na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName}`,
      `${brandName} ${modelName} predaj`,
      `${brandName} ${modelName} bazar`,
      `${brandName} ${modelName} ojazdené`,
      `kúpiť ${brandName} ${modelName}`,
    ],
    openGraphTitle: `${brandName} ${modelName} na predaj | Autobazar123`,
    twitterDescription: `Porovnajte aktuálne ponuky modelu ${brandName} ${modelName}.`,
    listName: `${brandName} ${modelName} - ponuky`,
    heading: `${brandName} ${modelName} na predaj`,
    intro: `Prezrite si aktuálne ponuky ${brandName} ${modelName} na Slovensku. Porovnajte dostupné inzeráty, fotografie a kontakt na predajcu.`,
    ctaTitle: `Chcete širší výber pre ${brandName} ${modelName}?`,
    ctaDescription:
      "Otvorte kompletné vyhľadávanie, porovnajte viac ponúk a nastavte si filtre podľa ceny, roku, paliva a lokality.",
    emptyMessage: `Momentálne nemáme reálne inzeráty pre ${brandName} ${modelName}.`,
    aboutTitle: `O modeli ${brandName} ${modelName}`,
    aboutFirst: `${brandName} ${modelName} je jedným z najpopulárnejších modelov na slovenskom trhu. Vďaka svojmu výkonu, spoľahlivosti a moderným technológiám si získal srdcia mnohých slovenských motoristov.`,
    aboutSecond: `Na Autobazar123 postupne zhromažďujeme ponuky ${brandName} ${modelName} od súkromných predajcov aj autobazárov. Každý inzerát obsahuje detailné informácie o vozidle, fotogalériu a kontakt na predajcu.`,
    summaryTitle: `Rýchly prehľad trhu pre model ${brandName} ${modelName}`,
    whyTitle: `Prečo kúpiť ${brandName} ${modelName} cez Autobazar123?`,
    whyBullets: [
      "Dostupné ponuky od súkromných predajcov aj autobazárov",
      "Detailné fotografie a technické údaje",
      "Priestor na transparentný popis vozidla",
      "Priamy kontakt s predajcom",
      "Kalkulačka leasingu a financovania",
    ],
    relatedModels: `Ďalšie modely ${brandName}`,
    availableLabel: "Dostupné ponuky na stránke",
    averagePriceLabel: "Priemerná cena",
    newestYearLabel: "Najnovší modelový rok",
  };
}

export async function generateStaticParams() {
  return (await getAllSeoBrandModelPairs()).map(({ brandSlug, modelSlug }) => ({
    brand: brandSlug,
    model: modelSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand, model } = await params;
  const market = await getRequestMarketConfig();
  const marketCopy = getPublicMarketCopy(market);
  if (!brand || !model) {
    return { title: getBrandModelPageCopy(market.code, "", "").notFound };
  }

  const [brandData, modelData] = await Promise.all([
    getBrandTaxonomy(brand),
    getModelTaxonomy(brand, model),
  ]);

  let metadata: Metadata = {
    title: getBrandModelPageCopy(market.code, "", "").notFound,
  };

  if (brandData && modelData && await hasModelForBrand(brand, model)) {
    const brandName = brandData.name;
    const modelName = modelData.name;
    const copy = getBrandModelPageCopy(market.code, brandName, modelName);

    metadata = buildProgrammaticMetadata({
      title: copy.title,
      description: copy.description,
      keywords: copy.keywords,
      canonicalPath: `/${brand}/${model}`,
      openGraphTitle: copy.openGraphTitle,
      twitterTitle: copy.openGraphTitle,
      twitterDescription: copy.twitterDescription,
      siteUrl: market.origin,
      siteName: market.brandName,
      openGraphLocale: marketCopy.openGraphLocale,
    });
  }

  return metadata;
}

export default async function BrandModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand, model } = await params;
  const [brandData, modelData] = await Promise.all([
    getBrandTaxonomy(brand),
    getModelTaxonomy(brand, model),
  ]);

  if (!brandData || !modelData || !(await hasModelForBrand(brand, model))) {
    notFound();
  }

  const brandName = brandData.name;
  const modelName = modelData.name;
  const market = await getRequestMarketConfig();
  const marketCopy = getPublicMarketCopy(market);
  const copy = getBrandModelPageCopy(market.code, brandName, modelName);
  const routeUrl = `${market.origin}/${brand}/${model}`;
  const breadcrumbItems = [
    { name: marketCopy.listingsLabel, url: `${market.origin}${getMarketPath("/vysledky", market.code)}` },
    { name: brandName, url: `${market.origin}/${brand}` },
    { name: modelName, url: routeUrl },
  ];

  const cars = await getSeoInventoryListings({
    brandName,
    modelName,
    limit: 12,
  });
  const searchHref = buildInventorySearchHref({ brandName, modelName, marketCode: market.code });
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
  const relatedModels = brandData.models.reduce<Array<(typeof brandData.models)[number]>>(
    (models, relatedModel) => {
      if (relatedModel.slug !== model) {
        models.push(relatedModel);
      }
      return models;
    },
    [],
  );

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
              { label: modelName },
            ]}
          />

          <div className="market-panel market-hero mb-8 p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
              {copy.heading}
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              {copy.intro}
            </p>
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((car, index) => (
                <SeoListingCard
                  key={car.id}
                  car={car}
                  source="seo_model_route"
                  position={index + 1}
                  imageSizes="(max-width: 768px) 100vw, 33vw"
                  extraMetaLine={car.fuel || "-"}
                  locale={marketCopy.languageTag}
                />
              ))}
            </div>
          ) : (
            <InventoryEmptyState
              message={copy.emptyMessage}
              href={searchHref}
              ctaLabel={marketCopy.viewOffers}
            />
          )}

          <div className="market-card market-readable mt-16 max-w-none p-6">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              {copy.aboutTitle}
            </h2>
            <p className="text-secondary mb-4">
              {copy.aboutFirst}
            </p>
            <p className="text-secondary mb-4">
              {copy.aboutSecond}
            </p>
            {cars.length > 0 ? (
              <InventoryMarketSummary
                title={copy.summaryTitle}
                count={cars.length}
                averagePriceEur={averagePriceEur}
                newestYear={newestYear}
                locale={marketCopy.languageTag}
                availableLabel={copy.availableLabel}
                averagePriceLabel={copy.averagePriceLabel}
                newestYearLabel={copy.newestYearLabel}
              />
            ) : null}

            <h2 className="text-xl font-semibold text-primary mt-8 mb-4">
              {copy.whyTitle}
            </h2>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              {copy.whyBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div className="mt-16">
            <h2 className="text-xl font-semibold text-primary mb-6">
              {copy.relatedModels}
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedModels.map((relatedModel) => (
                <Link
                  key={relatedModel.slug}
                  href={`/${brand}/${relatedModel.slug}`}
                  className="market-chip hover:text-accent"
                >
                  {brandName} {relatedModel.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
