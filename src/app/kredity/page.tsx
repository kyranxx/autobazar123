import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreditsPageClient from "./CreditsPageClient";

export const metadata: Metadata = {
    title: "Kúpiť kredity | Autobazar123",
    description:
        "Kúpte si kredity pre zverejňovanie inzerátov a prémiové funkcie na Autobazar123.",
    robots: {
        index: false,
        follow: true,
    },
};

export default function CreditsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <CreditsPageClient />
            <Footer />
        </div>
    );
}
