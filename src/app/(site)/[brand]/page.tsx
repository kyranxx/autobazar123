import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import {
  SEO_BRANDS,
  SEO_BRAND_SLUGS,
  formatModelSlug,
  getBrandTaxonomy,
} from "@/lib/seo/programmatic-taxonomy";

const BRANDS_DATA = SEO_BRANDS;
const SITE_URL = "https://autobazar123.sk";

export async function generateStaticParams() {
  return SEO_BRAND_SLUGS.map((brand) => ({ brand }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const brandData = getBrandTaxonomy(brand);

  if (!brandData) {
    return { title: "Nenájdené" };
  }

  return {
    title: `${brandData.name} | Predaj na Slovensku | Autobazar123`,
    description: `Všetky modely ${brandData.name} na predaj na Slovensku. ${brandData.models.length} modelov, stovky overených inzerátov.`,
    keywords: [
      brandData.name,
      `${brandData.name} predaj`,
      `${brandData.name} bazar`,
      `kúpiť ${brandData.name}`,
    ],
    openGraph: {
      title: `${brandData.name} na predaj | Autobazar123`,
      description: `Preskúmajte všetky modely značky ${brandData.name} na Slovensku.`,
      url: `${SITE_URL}/${brand}`,
      siteName: "Autobazar123",
      type: "website",
      locale: "sk_SK",
    },
    twitter: {
      card: "summary_large_image",
      title: `${brandData.name} na predaj | Autobazar123`,
      description: `Modely značky ${brandData.name} s overenými inzerátmi.`,
    },
    alternates: {
      canonical: `${SITE_URL}/${brand}`,
    },
  };
}

function formatModelName(model: string): string {
  return formatModelSlug(model);
}

function createBrandModelsItemListJsonLd(
  brandSlug: string,
  brandName: string,
  models: readonly string[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brandName} - modely`,
    numberOfItems: models.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: models.map((model, index) => {
      const modelName = formatModelName(model);
      const modelUrl = `${SITE_URL}/${brandSlug}/${model}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: modelUrl,
        name: `${brandName} ${modelName}`,
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
  const brandData = getBrandTaxonomy(brand);

  if (!brandData) {
    notFound();
  }

  const brandUrl = `${SITE_URL}/${brand}`;
  const breadcrumbItems = [
    { name: "Domov", url: SITE_URL },
    { name: "Autá", url: `${SITE_URL}/vysledky` },
    { name: brandData.name, url: brandUrl },
  ];
  const brandSearchHref = `/vysledky?brand=${encodeURIComponent(brandData.name)}`;
  const modelsItemListSchema = createBrandModelsItemListJsonLd(
    brand,
    brandData.name,
    brandData.models,
  );

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <script type="application/ld+json" suppressHydrationWarning>
        {serializeJsonLd(modelsItemListSchema)}
      </script>
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
              <li className="text-primary font-medium">{brandData.name}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              {brandData.name} - všetky modely
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Preskúmajte všetky modely {brandData.name} na predaj na Slovensku.
              Vyberte si model a nájdite svoje vysnívané vozidlo.
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <h2 className="text-base font-semibold text-primary">
              Chcete okamžite vidieť všetky ponuky značky {brandData.name}?
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-secondary">
              Otvorte kompletné vyhľadávanie a porovnajte inzeráty podľa ceny,
              modelu, paliva a lokality.
            </p>
            <Link
              href={brandSearchHref}
              className="mt-4 inline-flex rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
            >
              Zobraziť výsledky vo vyhľadávaní
            </Link>
          </div>

          {/* Models Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brandData.models.map((model) => (
              <Link
                key={model}
                href={`/${brand}/${model}`}
                className="group rounded-2xl border border-border p-6 transition-all hover:border-accent hover:shadow-lg"
              >
                <h2 className="text-xl font-semibold text-primary group-hover:text-accent">
                  {brandData.name} {formatModelName(model)}
                </h2>
                <p className="mt-2 text-sm text-secondary">
                  Zobraziť všetky inzeráty →
                </p>
              </Link>
            ))}
          </div>

          {/* SEO Content */}
          <div className="mt-16 prose max-w-none">
            <h2 className="text-2xl font-bold text-primary mb-4">
              O značke {brandData.name}
            </h2>
            <p className="text-secondary mb-4">
              {brandData.name} je jednou z najpopulárnejších automobilových
              značiek na Slovensku. Na Autobazar123 nájdete široký výber{" "}
              {brandData.name}
              od súkromných predajcov aj overených autobazárov.
            </p>
            <p className="text-secondary">
              Ponúkame {brandData.models.length} modelov značky {brandData.name}
              , vrátane najnovších aj klasických verzií. Každý inzerát obsahuje
              detailné informácie, fotogalériu a priamy kontakt na predajcu.
            </p>
          </div>

          {/* Other Brands */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-primary mb-6">
              Ďalšie značky
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(BRANDS_DATA)
                .filter(([key]) => key !== brand)
                .map(([key, data]) => (
                  <Link
                    key={key}
                    href={`/${key}`}
                    className="px-5 py-2.5 rounded-full border border-border text-primary hover:border-accent hover:text-accent transition-colors"
                  >
                    {data.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


