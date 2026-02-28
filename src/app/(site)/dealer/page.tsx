import { Metadata } from "next";
import DealerDashboardClient from "./DealerDashboardClient";

export const metadata: Metadata = {
  title: "Dealer Dashboard | Autobazar123",
  description: "Spravujte svoje dealerstvo, inzeráty a kredity.",
  robots: { index: false, follow: false },
};

export default function DealerDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DealerDashboardClient />
    </div>
  );
}

