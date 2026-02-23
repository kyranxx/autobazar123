import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdWizardClient from "@/app/pridat-inzerat/AdWizardClient";

export const metadata: Metadata = {
  title: "Upraviť inzerát | Autobazar123",
  description: "Upravte svoj inzerát a aktualizujte údaje o vozidle.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function EditAdPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AdWizardClient mode="edit" adId={params.id} />
      <Footer />
    </div>
  );
}

