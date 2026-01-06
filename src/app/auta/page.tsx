import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchPageClient from "./SearchPageClient";

export const metadata: Metadata = {
    title: "Vyhľadávanie áut | Autobazar123",
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
        title: "Vyhľadávanie áut | Autobazar123",
        description:
            "Prezrite si ponuku overených ojazdených áut na Slovensku. Filtrujte podľa značky, modelu, ceny a ďalších parametrov.",
    },
};

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <SearchPageClient />
            <Footer />
        </div>
    );
}
