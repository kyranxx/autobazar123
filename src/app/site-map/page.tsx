import type { Metadata } from "next";
import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceContainer,
  MarketplaceHero,
  MarketplacePageShell,
  MarketplaceSection,
} from "@/components/ui/MarketplacePage";
import type { MarketCode } from "@/config/markets";
import { getRequestMarketConfig } from "@/lib/market/request";
import { resolvePublicCopyMarketCode } from "@/lib/market/public-copy";
import sitemap from "../sitemap";

type SitemapCopy = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  publicUrls: string;
  home: string;
  pathLabels: Record<string, string>;
};

function getSitemapCopy(marketCode: MarketCode): SitemapCopy {
  if (marketCode === "RO") {
    return {
      title: "Harta site-ului | Autobazar123",
      description:
        "Prezentare rapidă a paginilor publice, mărcilor, modelelor și anunțurilor active disponibile în căutare.",
      eyebrow: "Autobazar123.ro",
      heading: "Harta site-ului",
      publicUrls: "URL-uri publice",
      home: "Acasă",
      pathLabels: {
        "masini": "Mașini",
        "dealeri": "Dealeri",
        "calculator-leasing": "Calculator leasing",
        "preturi": "Prețuri",
        "contact": "Contact",
        "despre-noi": "Despre noi",
        "termeni-si-conditii": "Termenii serviciului",
        "politica-de-confidentialitate": "Politica de confidențialitate",
        "masina": "Mașină",
        "cookies": "Politica privind cookie-urile",
      },
    };
  }

  return {
    title: "Mapa stránky | Autobazar123",
    description:
      "Rýchly prehľad verejných stránok, značiek, modelov a aktívnych inzerátov, ktoré chceme mať dostupné vo vyhľadávaní.",
    eyebrow: "Autobazar123.sk",
    heading: "Mapa stránky",
    publicUrls: "Verejné URL",
    home: "Domov",
    pathLabels: {},
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const copy = getSitemapCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `${market.origin}/site-map`,
    },
  };
}

function labelForUrl(url: string, copy: Pick<SitemapCopy, "home" | "pathLabels">) {
  const path = new URL(url).pathname;

  if (path === "/") {
    return copy.home;
  }

  return path
    .split("/")
    .filter(Boolean)
    .map((part) => copy.pathLabels[part] || part.replace(/-/g, " "))
    .join(" / ");
}

export default async function HtmlSitemapPage() {
  await connection();
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const entries = await sitemap();
  const copy = getSitemapCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );
  const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          eyebrow={copy.eyebrow}
          title={copy.heading}
          description={copy.description}
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: copy.heading }]}
              currentHref="/site-map"
              siteUrl={market.origin}
            />
          }
        />

        <MarketplaceSection title={copy.publicUrls}>
          <ol className="grid gap-3 sm:grid-cols-2" role="list">
          {uniqueEntries.map((entry) => (
            <li key={entry.url}>
              <a
                href={entry.url}
                className="market-card block p-4 text-sm font-medium text-foreground hover:text-accent"
              >
                {labelForUrl(entry.url, copy)}
              </a>
            </li>
          ))}
          </ol>
        </MarketplaceSection>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}
