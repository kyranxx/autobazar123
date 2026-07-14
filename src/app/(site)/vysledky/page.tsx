import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import {
  buildSearchResultsBreadcrumbItems,
  buildSearchResultsBreadcrumbSchemaItems,
  type BreadcrumbSearchParams,
} from "@/lib/seo/breadcrumbs";
import AlgoliaSearchPageClient from "./AlgoliaSearchPageClient";
import SearchSeoLinks from "./SearchSeoLinks";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();
  const canonical = `${market.origin}${getMarketPath("/vysledky", market.code)}`;
  const isRomanian = market.code === "RO";
  const title = isRomanian
    ? "Mașini de vânzare | Autobazar123"
    : "Výsledky vyhľadávania áut | Autobazar123";
  const description = isRomanian
    ? "Explorează mașinile disponibile, filtrează anunțurile și găsește oferta potrivită pe Autobazar123."
    : "Prehliadajte ponuku áut, filtrujte výsledky a objavte dostupné ponuky na Autobazar123.";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: title.replace(" | Autobazar123", ""), description, url: canonical },
  };
}

type SearchPageProps = {
  searchParams?: Promise<BreadcrumbSearchParams>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const breadcrumbItems = buildSearchResultsBreadcrumbItems(resolvedSearchParams);

  return (
    <ThemePreviewShell scopeLabel="/vysledky">
      <div className="market-page min-h-screen">
        <BreadcrumbJsonLd
          items={buildSearchResultsBreadcrumbSchemaItems(resolvedSearchParams)}
        />
        <h1 className="sr-only">Výsledky vyhľadávania áut na Slovensku</h1>
        <div className="container-main pt-5 sm:pt-6">
          <BreadcrumbTrail items={breadcrumbItems} className="mb-0" />
        </div>
        <AlgoliaSearchPageClient />
        <SearchSeoLinks />
      </div>
    </ThemePreviewShell>
  );
}
