import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchPageClientWrapper from "./SearchPageClient";

// Regenerate page every 5 minutes (search results change frequently)
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Vysledky vyhladavania | Autobazar123",
  description:
    "Prezrite si ponuku overenych ojazdenych aut na Slovensku. Filtrujte podla znacky, modelu, ceny, roku vyroby a dalsich parametrov.",
  keywords: [
    "predaj aut",
    "ojazdene auta",
    "autobazar",
    "kupit auto",
    "Slovensko",
    "Skoda",
    "Volkswagen",
    "BMW",
    "Audi",
  ],
  openGraph: {
    title: "Vysledky vyhladavania | Autobazar123",
    description:
      "Prezrite si ponuku overenych ojazdenych aut na Slovensku. Filtrujte podla znacky, modelu, ceny a dalsich parametrov.",
    url: "https://autobazar123.sk/vysledky",
  },
  alternates: {
    canonical: "https://autobazar123.sk/vysledky",
  },
};

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SearchPageClientWrapper />
      <section
        aria-labelledby="search-seo-links-heading"
        className="border-t border-border-subtle bg-background-secondary/30 py-10"
      >
        <div className="container-main">
          <h2
            id="search-seo-links-heading"
            className="text-lg font-semibold text-text-primary"
          >
            Rychle odkazy pre hladanie aut
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">
            Vyberte si najpopularnejsie kombinacie znacky a modelu, alebo
            preskumajte prehlad podla miest.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/skoda/octavia"
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              Skoda Octavia
            </Link>
            <Link
              href="/volkswagen/golf"
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              Volkswagen Golf
            </Link>
            <Link
              href="/bmw/3-series"
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              BMW 3 Series
            </Link>
            <Link
              href="/audi/a4"
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              Audi A4
            </Link>
            <Link
              href="/skoda/octavia/bratislava"
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              Bratislava
            </Link>
            <Link
              href="/skoda/octavia/kosice"
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              Kosice
            </Link>
            <Link
              href="/predajcovia"
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              Predajcovia
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
