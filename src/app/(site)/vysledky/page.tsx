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

export const metadata: Metadata = {
  title: "Výsledky vyhľadávania áut | Autobazar123",
  description:
    "Prehliadajte ponuku áut, filtrujte výsledky a objavte dostupné ponuky na Autobazar123.",
  alternates: {
    canonical: "/vysledky",
  },
  openGraph: {
    title: "Výsledky vyhľadávania áut",
    description:
      "Prehliadajte ponuku áut, filtrujte výsledky a objavte dostupné ponuky na Autobazar123.",
    url: "/vysledky",
  },
};

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
