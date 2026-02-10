import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DealerDashboardClient from "./DealerDashboardClient";

export const metadata: Metadata = {
  title: "Dealer Dashboard | Autobazar123",
  description: "Spravujte svoje dealerstvo, inzeráty a kredity.",
  robots: { index: false, follow: false },
};

export default function DealerDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DealerDashboardClient />
      <Footer />
    </div>
  );
}
