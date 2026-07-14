import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { ProgrammaticBreadcrumbs } from "@/components/seo/ProgrammaticInventorySections";
import { BRAND_URL } from "@/config/brand";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import {
  getAllSeoBrands,
  getBrandTaxonomy,
  getSeoBrandSlugs,
} from "@/lib/seo/programmatic-taxonomy";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";

const SITE_URL = BRAND_URL;

export async function generateStaticParams() {
  return (await getSeoBrandSlugs()).map((brand) => ({ brand }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const market = await getRequestMarketConfig();
  const brandData = await getBrandTaxonomy(brand);

  if (!brandData) {
    return { title: "Nenájdené" };
  }

  const isRomanian = market.code === "RO";

  return {
    title: isRomanian ? `${brandData.name} de vânzare | Autobazar123` : `${brandData.name} | Predaj na Slovensku | Autobazar123`,
    description: isRomanian
      ? `Modele ${brandData.name} și anunțuri auto disponibile în România. Compară ofertele pe Autobazar123.`
      : `Modely ${brandData.name} a aktuálne inzeráty na Slovensku. ${brandData.models.length} modelov v katalógu Autobazar123.`,
    keywords: [
      brandData.name,
      `${brandData.name} predaj`,
      `${brandData.name} bazar`,
      `kúpiť ${brandData.name}`,
    ],
    openGraph: {
      title: `${brandData.name} na predaj | Autobazar123`,
      description: `Preskúmajte všetky modely značky ${brandData.name} na Slovensku.`,
      url: `${market.origin}/${brand}`,
      siteName: "Autobazar123",
      type: "website",
      locale: isRomanian ? "ro_RO" : "sk_SK",
    },
    twitter: {
      card: "summary_large_image",
      title: `${brandData.name} na predaj | Autobazar123`,
      description: `Modely značky ${brandData.name} a aktuálne inzeráty.`,
    },
    alternates: {
      canonical: `${market.origin}/${brand}`,
    },
  };
}

function createBrandModelsItemListJsonLd(
  brandSlug: string,
  brandName: string,
  models: readonly { slug: string; name: string }[],
  siteUrl = SITE_URL,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brandName} - modely`,
    numberOfItems: models.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: models.map((model, index) => {
      const modelUrl = `${siteUrl}/${brandSlug}/${model.slug}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: modelUrl,
        name: `${brandName} ${model.name}`,
      };
    }),
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const market = await getRequestMarketConfig();
  const [brandData, allBrands] = await Promise.all([
    getBrandTaxonomy(brand),
    getAllSeoBrands(),
  ]);

  if (!brandData) {
    notFound();
  }

  const brandUrl = `${market.origin}/${brand}`;
  const breadcrumbItems = [
    { name: market.code === "RO" ? "Anunțuri" : "Inzeráty", url: `${market.origin}${getMarketPath("/vysledky", market.code)}` },
    { name: brandData.name, url: brandUrl },
  ];
  const brandSearchHref = getMarketPath(`/vysledky?brand=${encodeURIComponent(brandData.name)}`, market.code);
  const modelsItemListSchema = createBrandModelsItemListJsonLd(
    brand,
    brandData.name,
    brandData.models,
    market.origin,
  );
  const otherBrands = allBrands.reduce<typeof allBrands>((entries, entry) => {
    if (entry.slug !== brand) {
      entries.push(entry);
    }
    return entries;
  }, []);

  return (
    <div className="market-page min-h-screen">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <script type="application/ld+json" suppressHydrationWarning>
        {serializeJsonLd(modelsItemListSchema)}
      </script>
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProgrammaticBreadcrumbs
            items={[
              { label: market.code === "RO" ? "Anunțuri" : "Inzeráty", href: getMarketPath("/vysledky", market.code) },
              { label: brandData.name },
            ]}
          />

          {/* Header */}
          <div className="market-panel market-hero mb-8 p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
              {brandData.name} - všetky modely
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Preskúmajte všetky modely {brandData.name} na predaj na Slovensku.
              Vyberte si model a nájdite svoje vysnívané vozidlo.
            </p>
          </div>

          <div className="market-soft-band mb-8 p-5">
            <h2 className="text-base font-semibold text-primary">
              Chcete okamžite vidieť všetky ponuky značky {brandData.name}?
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-secondary">
              Otvorte kompletné vyhľadávanie a porovnajte inzeráty podľa ceny,
              modelu, paliva a lokality.
            </p>
            <Link
              href={brandSearchHref}
              className="market-action-primary mt-4"
            >
              Zobraziť výsledky vo vyhľadávaní
            </Link>
          </div>

          {/* Models Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brandData.models.map((model) => (
              <Link
                key={model.slug}
                href={`/${brand}/${model.slug}`}
                className="market-card group p-6"
              >
                <h2 className="text-xl font-semibold text-primary group-hover:text-accent">
                  {brandData.name} {model.name}
                </h2>
                <p className="mt-2 text-sm text-secondary">
                  Zobraziť všetky inzeráty →
                </p>
              </Link>
            ))}
          </div>

          {/* SEO Content */}
          <div className="market-card market-readable mt-16 max-w-none p-6">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              O značke {brandData.name}
            </h2>
            <p className="text-secondary mb-4">
              {brandData.name} je jednou z najpopulárnejších automobilových
              značiek na Slovensku. Na Autobazar123 postupne zhromažďujeme ponuky{" "}
              {brandData.name}
              od súkromných predajcov aj autobazárov.
            </p>
            <p className="text-secondary">
              Ponúkame {brandData.models.length} modelov značky {brandData.name}
              , vrátane najnovších aj klasických verzií. Každý inzerát obsahuje
              detailné informácie, fotogalériu a priamy kontakt na predajcu.
            </p>
          </div>

          {/* Other Brands */}
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-primary mb-6">
              Ďalšie značky
            </h2>
            <div className="flex flex-wrap gap-3">
              {otherBrands.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/${entry.slug}`}
                  className="market-chip hover:text-accent"
                >
                  {entry.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
