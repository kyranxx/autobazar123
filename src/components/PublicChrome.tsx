import type { ReactNode } from "react";
import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const currentYear = 2026;

export default function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBanner />
      <Navbar />
      <div id="main-content" className="scroll-landmark flex-1">
        {children}
      </div>
      <Footer currentYear={currentYear} />
    </div>
  );
}
