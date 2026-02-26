import { Metadata } from "next";
import AdWizardClient from "./AdWizardClient";

export const metadata: Metadata = {
  title: "PridaĹĄ inzerĂˇt | Autobazar123",
  description:
    "Pridajte svoj inzerĂˇt za menej ako 2 minĂşty. Dosiahnite tisĂ­ce potenciĂˇlnych kupujĂşcich na prĂ©miovĂ© platforme Autobazar123.",
  robots: {
    index: false, // Don't index the form page
    follow: true,
  },
};

export default function AddAdPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdWizardClient />
    </div>
  );
}

