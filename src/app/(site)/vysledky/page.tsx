import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import AlgoliaSearchPageClient from "./AlgoliaSearchPageClient";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

function searchParamsToQueryString(
  params: Record<string, string | string[] | undefined>,
): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string") {
      query.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        query.append(key, entry);
      });
    }
  });

  return query.toString();
}

function SearchResultsPageFallback() {
  return (
    <main id="main-content" className="min-h-screen bg-background pb-16 pt-5 sm:pt-6">
      <div className="container-main">
        <div className="mb-4 h-20 animate-pulse rounded-2xl border border-border-subtle bg-background-secondary/60 lg:mb-5" />
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="hidden h-[560px] animate-pulse rounded-2xl border border-border-subtle bg-background-secondary/60 lg:block" />
          <div>
            <div className="mb-3 h-14 animate-pulse rounded-lg border border-border-subtle bg-background-secondary/60" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-xl border border-border-subtle bg-background-secondary/60"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const tMeta = await getTranslations("meta");
  // Await the params if it's a promise, otherwise use them directly
  const params = await props.searchParams;
  const queryStr = searchParamsToQueryString(
    params as Record<string, string | string[] | undefined>,
  );
  const canonicalUrl = queryStr 
    ? `https://autobazar123.sk/vysledky?${queryStr}` 
    : "https://autobazar123.sk/vysledky";

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
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function SearchPage(props: Props) {
  const t = await getTranslations("searchSeo");
  const searchParams = await props.searchParams;
  const initialRouteQuery = searchParamsToQueryString(
    searchParams as Record<string, string | string[] | undefined>,
  );

  return (
    <ThemePreviewShell scopeLabel="/vysledky">
      <div className="min-h-screen bg-background">
        <Suspense fallback={<SearchResultsPageFallback />}>
          <AlgoliaSearchPageClient initialRouteQuery={initialRouteQuery} />
        </Suspense>
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
