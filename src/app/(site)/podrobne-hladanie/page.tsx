import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import ThemePreviewShell from "@/components/theme/ThemePreviewShell";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";
import DetailedSearchPageClient from "./DetailedSearchPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const [t, market, locale] = await Promise.all([
    getTranslations("detailedSearch"),
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const url = `${market.origin}${getMarketPath("/podrobne-hladanie", market.code)}`;

  return {
    title: `${t("title")} | AutoNinja`,
    description: t("metaDescription"),
    alternates: {
      canonical: url,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      url,
      locale,
    },
  };
}

export default function DetailedSearchPage() {
  return (
    <ThemePreviewShell scopeLabel="/podrobne-hladanie">
      <Suspense
        fallback={
          <main className="market-page min-h-screen bg-background pb-16 pt-8">
            <div className="container-main">
              <div className="h-10 w-40 animate-pulse rounded-lg bg-background-secondary" />
              <div className="mt-4 h-36 animate-pulse rounded-[1.75rem] bg-primary/10" />
              <div className="mt-4 h-96 animate-pulse rounded-2xl bg-background-secondary" />
            </div>
          </main>
        }
      >
        <DetailedSearchPageClient />
      </Suspense>
    </ThemePreviewShell>
  );
}
