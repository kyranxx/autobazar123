import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdWizardClient from "./AdWizardClient";

export const metadata: Metadata = {
    title: "Pridať inzerát | Autobazar123",
    description:
        "Pridajte svoj inzerát za menej ako 2 minúty. Dosiahnite tisíce potenciálnych kupujúcich na prémiové platforme Autobazar123.",
    robots: {
        index: false, // Don't index the form page
        follow: true,
    },
};

export default function AddAdPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <AdWizardClient />
            <Footer />
        </div>
    );
}
