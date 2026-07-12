import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceArticleCard,
  MarketplaceBadge,
  MarketplaceCard,
  MarketplaceContainer,
  MarketplaceHero,
  MarketplaceLinkButton,
  MarketplacePageShell,
  MarketplaceSection,
  MarketplaceStatCard,
} from "@/components/ui/MarketplacePage";
import { getPricingSnapshot } from "@/lib/pricing/server";
import { formatPriceCents } from "@/lib/pricing/config";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";


export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();
  return {
  title: "Cenník | Autobazar123",
  description: "Jednoduchý cenník inzercie, Basic, Premium a Exclusive balíkov na Autobazar123.",
  alternates: {
    canonical: `${market.origin}${getMarketPath("/ceny", market.code)}`,
  },
  };
}

export default async function PricingPage() {
  const { config, summary } = await getPricingSnapshot();
  const phase = config.phases[config.phase];

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          eyebrow="Cenník inzercie"
          title="Cenník"
          description="Krátko a jasne. Vyberiete si len úroveň zverejnenia, ktorá dáva zmysel pre váš inzerát."
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: "Cenník" }]}
              currentHref="/ceny"
            />
          }
          actions={
            <MarketplaceLinkButton href="/pridat-inzerat" showArrow>
              Pridať inzerát
            </MarketplaceLinkButton>
          }
          stats={
            <div className="grid gap-3 sm:grid-cols-3">
              <MarketplaceStatCard
                value={config.durations.listingDays}
                label="dní zverejnenia"
              />
              <MarketplaceStatCard value={summary.prolong} label="predĺženie" tone="accent" />
              <MarketplaceStatCard
                value={phase.basicPriceCents === 0 ? "zadarmo" : formatPriceCents(phase.basicPriceCents)}
                label={`Basic v aktuálnej fáze: ${config.phase}`}
                tone="success"
              />
            </div>
          }
        />

        <MarketplaceSection
          title="Balíky zverejnenia"
          description="Jednotné karty, jasná hierarchia a viditeľné zvýraznenie najpraktickejšej voľby."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <PricingCard
              title="Basic"
              price={summary.basic}
              description="Bežné zverejnenie inzerátu na 28 dní."
            />
            <PricingCard
              title="Premium"
              price={summary.premium}
              description="Nad bežnými inzerátmi vo výsledkoch na 1. strane."
              featured
            />
            <PricingCard
              title="Exclusive"
              price={summary.top}
              description="Homepage a prvý blok vo výsledkoch na 1. strane."
            />
          </div>
        </MarketplaceSection>

        <MarketplaceSection title="Ako to funguje">
          <MarketplaceCard>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Predĺženie" value={summary.prolong} />
              <InfoRow label="Trvanie" value={`${config.durations.listingDays} dní`} />
              <InfoRow label="Zoradenie" value="Exclusive, Premium, potom bežné inzeráty" />
              <InfoRow label="Pri inom triedení" value="Platené inzeráty zostanú označené, ale miešajú sa do výsledkov" />
            </div>
          </MarketplaceCard>
        </MarketplaceSection>

        <MarketplaceSection>
          <div className="market-soft-band p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary">Predajcovia a autobazáre</h2>
                <p className="mt-2 text-secondary">{summary.dealerTopup}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {config.dealerTopups.map((entry) => (
                    <span
                      key={entry.id}
                      className="rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-medium text-primary"
                    >
                      {entry.label} = {formatPriceCents(entry.priceCents + entry.bonusCents)}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/pridat-inzerat"
                className="market-action-primary"
              >
                Pridať inzerát
              </Link>
            </div>
          </div>
        </MarketplaceSection>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}

function PricingCard({
  title,
  price,
  description,
  featured = false,
}: {
  title: string;
  price: string;
  description: string;
  featured?: boolean;
}) {
  return (
    <MarketplaceArticleCard
      className={`text-center ${featured ? "border-accent bg-accent/5" : ""}`}
    >
      <div className="flex justify-center">
        <MarketplaceBadge>{featured ? "Odporúčané" : "Balík"}</MarketplaceBadge>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-primary">{title}</h3>
      <p className="mt-4 text-3xl font-bold text-accent">{price}</p>
      <p className="mt-3 text-sm text-secondary">{description}</p>
    </MarketplaceArticleCard>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">{label}</p>
      <p className="mt-1 text-sm font-medium text-primary">{value}</p>
    </div>
  );
}
