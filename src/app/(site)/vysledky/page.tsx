import type { Metadata } from "next";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
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

export default function SearchPage() {
  return (
    <ThemePreviewShell scopeLabel="/vysledky">
      <div className="min-h-screen bg-background">
        <h1 className="sr-only">Výsledky vyhľadávania áut na Slovensku</h1>
        <AlgoliaSearchPageClient />
        <SearchSeoLinks />
      </div>
    </ThemePreviewShell>
  );
}
