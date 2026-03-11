import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import AlgoliaSearchPageClient from "./AlgoliaSearchPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations("meta");

  return {
    title: tMeta("carsTitle"),
    description: tMeta("carsDescription"),
    keywords: [
      "car sales",
      "used cars",
      "autobazar",
      "buy car",
      "Slovakia",
      "Skoda",
      "Volkswagen",
      "BMW",
      "Audi",
    ],
    openGraph: {
      title: tMeta("carsTitle"),
      description: tMeta("carsDescription"),
      url: "https://autobazar123.sk/vysledky",
    },
    alternates: {
      canonical: "https://autobazar123.sk/vysledky",
    },
  };
}

export default async function SearchPage() {
  const t = await getTranslations("searchSeo");

  return (
    <ThemePreviewShell scopeLabel="/vysledky">
      <div className="min-h-screen bg-background">
        <AlgoliaSearchPageClient />
        <section
          aria-labelledby="search-seo-links-heading"
          className="border-t border-border-subtle bg-background-secondary/30 py-10"
        >
          <div className="container-main">
            <h2
              id="search-seo-links-heading"
              className="text-lg font-semibold text-text-primary"
            >
              {t("heading")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">
              {t("description")}
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
                Košice
              </Link>
              <Link
                href="/predajcovia"
                className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
              >
                {t("sellers")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ThemePreviewShell>
  );
}
