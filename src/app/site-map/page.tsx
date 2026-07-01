import type { Metadata } from "next";
import { connection } from "next/server";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceContainer,
  MarketplaceHero,
  MarketplacePageShell,
  MarketplaceSection,
} from "@/components/ui/MarketplacePage";
import sitemap from "../sitemap";

export const metadata: Metadata = {
  title: "Mapa stránky | Autobazar123.sk",
  description: "Prehľad verejných stránok a dôležitých kategórií na Autobazar123.sk.",
};

function labelForUrl(url: string) {
  const path = new URL(url).pathname;

  if (path === "/") {
    return "Domov";
  }

  return path
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .join(" / ");
}

export default async function HtmlSitemapPage() {
  await connection();
  const entries = await sitemap();
  const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          eyebrow="Autobazar123.sk"
          title="Mapa stránky"
          description="Rýchly prehľad verejných stránok, značiek, modelov a aktívnych inzerátov, ktoré chceme mať dostupné vo vyhľadávaní."
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: "Mapa stránky" }]}
              currentHref="/site-map"
            />
          }
        />

        <MarketplaceSection title="Verejné URL">
          <ol className="grid gap-3 sm:grid-cols-2" role="list">
          {uniqueEntries.map((entry) => (
            <li key={entry.url}>
              <a
                href={entry.url}
                className="market-card block p-4 text-sm font-medium text-foreground hover:text-accent"
              >
                {labelForUrl(entry.url)}
              </a>
            </li>
          ))}
          </ol>
        </MarketplaceSection>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}
