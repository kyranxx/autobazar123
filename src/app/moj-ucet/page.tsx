import { Suspense } from "react";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Môj účet | Autobazar123",
  description: "Spravujte svoje inzeráty, kredity a nastavenia účtu.",
  robots: {
    index: false,
    follow: false,
  },
};

function DashboardLoader() {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface animate-pulse" />
        <div className="h-4 w-32 rounded bg-surface animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<DashboardLoader />}>
        <DashboardClient />
      </Suspense>
      <Footer />
    </div>
  );
}
