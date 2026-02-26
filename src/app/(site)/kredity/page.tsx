import { Metadata } from "next";
import CreditsPageClient from "./CreditsPageClient";

export const metadata: Metadata = {
  title: "KĂşpiĹĄ kredity | Autobazar123",
  description:
    "KĂşpte si kredity pre zverejĹovanie inzerĂˇtov a prĂ©miovĂ© funkcie na Autobazar123.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-background">
      <CreditsPageClient />
    </div>
  );
}

