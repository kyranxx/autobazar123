import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Platba úspešná | Autobazar123",
  robots: { index: false, follow: false },
};

export default function CreditsSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-primary mb-3">
            Platba bola úspešná!
          </h1>
          <p className="text-secondary mb-8">
            Kredity boli pripísané na váš účet. Môžete ich ihneď použiť na
            zverejňovanie inzerátov a prémiové funkcie.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/moj-ucet"
              className="px-8 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
            >
              Zobraziť môj účet
            </Link>
            <Link
              href="/pridat-inzerat"
              className="px-8 py-3 rounded-full border border-border text-primary font-semibold hover:bg-surface transition-colors"
            >
              Pridať inzerát
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
