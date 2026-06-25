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
  SEO_CITY_SLUGS,
  getAllSeoBrandModelPairs,
  getBrandTaxonomy,
  getCityTaxonomy,
  hasModelForBrand,
  getModelTaxonomy,
} from "@/lib/seo/programmatic-taxonomy";

const CITIES = SEO_CITY_SLUGS;

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
  if (!brand || !model) {
    return { title: "Nenájdené" };
  }

  const [brandData, modelData] = await Promise.all([
    getBrandTaxonomy(brand),
    getModelTaxonomy(brand, model),
  ]);

  let metadata: Metadata = { title: "Nenájdené" };

  if (brandData && modelData && await hasModelForBrand(brand, model)) {
    const brandName = brandData.name;
    const modelName = modelData.name;

    metadata = buildProgrammaticMetadata({
      title: `${brandName} ${modelName} | Predaj na Slovensku | Autobazar123`,
      description: `Najlepšie ponuky ${brandName} ${modelName} na Slovensku. Preskúmajte stovky overených inzerátov s garanciou kvality na Autobazar123.`,
      keywords: [
        `${brandName} ${modelName}`,
        `${brandName} ${modelName} predaj`,
        `${brandName} ${modelName} bazar`,
        `${brandName} ${modelName} ojazdené`,
        `kúpiť ${brandName} ${modelName}`,
      ],
      canonicalPath: `/${brand}/${model}`,
      openGraphTitle: `${brandName} ${modelName} na predaj | Autobazar123`,
      twitterTitle: `${brandName} ${modelName} na predaj | Autobazar123`,
      twitterDescription: `Porovnajte aktuálne ponuky modelu ${brandName} ${modelName}.`,
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
  const routeUrl = `${PROGRAMMATIC_SITE_URL}/${brand}/${model}`;
  const breadcrumbItems = [
    { name: "Inzeráty", url: `${PROGRAMMATIC_SITE_URL}/vysledky` },
    { name: brandName, url: `${PROGRAMMATIC_SITE_URL}/${brand}` },
    { name: modelName, url: routeUrl },
  ];

  const cars = await getSeoInventoryListings({
    brandName,
    modelName,
    limit: 12,
  });
  const searchHref = buildInventorySearchHref({ brandName, modelName });
  const inventoryItemListSchema =
    cars.length > 0
      ? createInventoryItemListJsonLd({
          cars,
          listName: `${brandName} ${modelName} - ponuky`,
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
              { label: "Inzeráty", href: "/vysledky" },
              { label: brandName, href: `/${brand}` },
              { label: modelName },
            ]}
          />

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
              {brandName} {modelName} na predaj
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Preskúmajte najlepšie ponuky {brandName} {modelName} na Slovensku.
              Všetky inzeráty od overených predajcov s garanciou kvality.
            </p>
          </div>

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
            <InventorySearchCta
              title={`Chcete širší výber pre ${brandName} ${modelName}?`}
              description={`Otvorte kompletné vyhľadávanie, porovnajte viac ponúk a nastavte si filtre podľa ceny, roku, paliva a lokality.`}
              href={searchHref}
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
                />
              ))}
            </div>
          ) : (
            <InventoryEmptyState
              message={`Momentálne nemáme reálne inzeráty pre ${brandName} ${modelName}.`}
              href={searchHref}
            />
          )}

          <div className="mt-16 prose max-w-none">
            <h2 className="text-2xl font-semibold text-primary mb-4">
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
              <InventoryMarketSummary
                title={`Rýchly prehľad trhu pre model ${brandName} ${modelName}`}
                count={cars.length}
                averagePriceEur={averagePriceEur}
                newestYear={newestYear}
              />
            ) : null}

            <h2 className="text-xl font-semibold text-primary mt-8 mb-4">
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

          <div className="mt-16">
            <h2 className="text-xl font-semibold text-primary mb-6">
              Ďalšie modely {brandName}
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedModels.map((relatedModel) => (
                <Link
                  key={relatedModel.slug}
                  href={`/${brand}/${relatedModel.slug}`}
                  className="px-5 py-2.5 rounded-full border border-border text-primary hover:border-accent hover:text-accent transition-colors"
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
