import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchPageClientWrapper from "./SearchPageClient";

// Regenerate page every 5 minutes (search results change frequently)
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Výsledky vyhľadávania | Autobazar123",
  description:
    "Prezrite si ponuku overených ojazdených áut na Slovensku. Filtrujte podľa značky, modelu, ceny, roku výroby a ďalších parametrov.",
  keywords: [
    "predaj áut",
    "ojazdené autá",
    "autobazár",
    "kúpiť auto",
    "Slovensko",
    "Škoda",
    "Volkswagen",
    "BMW",
    "Audi",
  ],
  openGraph: {
    title: "Výsledky vyhľadávania | Autobazar123",
    description:
      "Prezrite si ponuku overených ojazdených áut na Slovensku. Filtrujte podľa značky, modelu, ceny a ďalších parametrov.",
  },
};

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SearchPageClientWrapper />
      <Footer />
    </div>
  );
}
