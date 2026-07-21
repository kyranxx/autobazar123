import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
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
import type { MarketCode } from "@/config/markets";
import { getPricingSnapshot } from "@/lib/pricing/server";
import { formatPriceCents } from "@/lib/pricing/config";
import { CREATE_LISTING_ROUTE } from "@/lib/routes";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";
import {
  getPublicMarketCopyForLocale,
  resolvePublicCopyMarketCode,
} from "@/lib/market/public-copy";

function getPricingPageCopy(marketCode: MarketCode) {
  if (marketCode === "RO") {
    return {
      title: "Prețuri | AutoNinja",
      description:
        "Prețuri simple pentru anunțuri auto, pachete Basic, Premium și Exclusive pe AutoNinja.",
      eyebrow: "Prețuri anunțuri",
      heroTitle: "Prețuri",
      heroDescription:
        "Scurt și clar. Alegi doar nivelul de publicare care are sens pentru anunțul tău.",
      breadcrumb: "Prețuri",
      addListing: "Adaugă anunț",
      listingDays: "zile de publicare",
      prolong: "prelungire",
      free: "gratuit",
      phaseBasic: (phase: string) => `Basic în faza curentă: ${phase}`,
      packagesTitle: "Pachete de publicare",
      packagesDescription:
        "Carduri simple, ierarhie clară și evidențiere vizibilă pentru opțiunea practică.",
      basicDescription: "Publicare obișnuită a anunțului pentru 28 de zile.",
      premiumDescription: "Deasupra anunțurilor obișnuite în rezultatele de pe prima pagină.",
      exclusiveDescription: "Homepage și primul bloc din rezultatele de pe prima pagină.",
      recommended: "Recomandat",
      package: "Pachet",
      howItWorks: "Cum funcționează",
      duration: "Durată",
      sorting: "Ordonare",
      sortingValue: "Exclusive, Premium, apoi anunțuri obișnuite",
      otherSorting: "La altă sortare",
      otherSortingValue:
        "Anunțurile plătite rămân marcate, dar se amestecă în rezultate",
      dealerTitle: "Dealeri și parcuri auto",
      dealerTopup: "Sold preplătit pentru anunțuri, cu bonus la încărcare.",
    };
  }

  return {
    title: "Cenník | Autobazar123",
    description:
      "Jednoduchý cenník inzercie, Basic, Premium a Exclusive balíkov na Autobazar123.",
    eyebrow: "Cenník inzercie",
    heroTitle: "Cenník",
    heroDescription:
      "Krátko a jasne. Vyberiete si len úroveň zverejnenia, ktorá dáva zmysel pre váš inzerát.",
    breadcrumb: "Cenník",
    addListing: "Pridať inzerát",
    listingDays: "dní zverejnenia",
    prolong: "predĺženie",
    free: "zadarmo",
    phaseBasic: (phase: string) => `Basic v aktuálnej fáze: ${phase}`,
    packagesTitle: "Balíky zverejnenia",
    packagesDescription:
      "Jednotné karty, jasná hierarchia a viditeľné zvýraznenie najpraktickejšej voľby.",
    basicDescription: "Bežné zverejnenie inzerátu na 28 dní.",
    premiumDescription: "Nad bežnými inzerátmi vo výsledkoch na 1. strane.",
    exclusiveDescription: "Homepage a prvý blok vo výsledkoch na 1. strane.",
    recommended: "Odporúčané",
    package: "Balík",
    howItWorks: "Ako to funguje",
    duration: "Trvanie",
    sorting: "Zoradenie",
    sortingValue: "Exclusive, Premium, potom bežné inzeráty",
    otherSorting: "Pri inom triedení",
    otherSortingValue:
      "Platené inzeráty zostanú označené, ale miešajú sa do výsledkov",
    dealerTitle: "Predajcovia a autobazáre",
    dealerTopup: "Predplatený inzertný zostatok s bonusom pri dobití.",
  };
}

export default async function PricingPage() {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const marketCopy = getPublicMarketCopyForLocale(market, locale);
  const copy = getPricingPageCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );
  const { config, summary } = await getPricingSnapshot(marketCopy.languageTag);
  const phase = config.phases[config.phase];

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          eyebrow={copy.eyebrow}
          title={copy.heroTitle}
          description={copy.heroDescription}
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: copy.breadcrumb }]}
              currentHref="/ceny"
              siteUrl={market.origin}
            />
          }
          actions={
            <MarketplaceLinkButton href={CREATE_LISTING_ROUTE} showArrow>
              {copy.addListing}
            </MarketplaceLinkButton>
          }
          stats={
            <div className="grid gap-3 sm:grid-cols-3">
              <MarketplaceStatCard
                value={config.durations.listingDays}
                label={copy.listingDays}
              />
              <MarketplaceStatCard value={summary.prolong} label={copy.prolong} tone="accent" />
              <MarketplaceStatCard
                value={
                  phase.basicPriceCents === 0
                    ? copy.free
                    : formatPriceCents(phase.basicPriceCents, marketCopy.languageTag)
                }
                label={copy.phaseBasic(config.phase)}
                tone="success"
              />
            </div>
          }
        />

        <MarketplaceSection
          title={copy.packagesTitle}
          description={copy.packagesDescription}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <PricingCard
              title="Basic"
              price={summary.basic}
              description={copy.basicDescription}
              badgeLabel={copy.package}
            />
            <PricingCard
              title="Premium"
              price={summary.premium}
              description={copy.premiumDescription}
              badgeLabel={copy.package}
              featuredBadgeLabel={copy.recommended}
              featured
            />
            <PricingCard
              title="Exclusive"
              price={summary.top}
              description={copy.exclusiveDescription}
              badgeLabel={copy.package}
            />
          </div>
        </MarketplaceSection>

        <MarketplaceSection title={copy.howItWorks}>
          <MarketplaceCard>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label={copy.prolong} value={summary.prolong} />
              <InfoRow
                label={copy.duration}
                value={summary.basic.split(" / ")[1] ?? `${config.durations.listingDays}`}
              />
              <InfoRow label={copy.sorting} value={copy.sortingValue} />
              <InfoRow label={copy.otherSorting} value={copy.otherSortingValue} />
            </div>
          </MarketplaceCard>
        </MarketplaceSection>

        <MarketplaceSection>
          <div className="market-soft-band p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary">{copy.dealerTitle}</h2>
                <p className="mt-2 text-secondary">{copy.dealerTopup}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {config.dealerTopups.map((entry) => (
                    <span
                      key={entry.id}
                      className="rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-medium text-primary"
                    >
                      {entry.label} ={" "}
                      {formatPriceCents(
                        entry.priceCents + entry.bonusCents,
                        marketCopy.languageTag,
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={CREATE_LISTING_ROUTE}
                className="market-action-primary"
              >
                {copy.addListing}
              </Link>
            </div>
          </div>
        </MarketplaceSection>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const copy = getPricingPageCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `${market.origin}${getMarketPath("/ceny", market.code)}`,
    },
  };
}

function PricingCard({
  title,
  price,
  description,
  badgeLabel,
  featuredBadgeLabel,
  featured = false,
}: {
  title: string;
  price: string;
  description: string;
  badgeLabel: string;
  featuredBadgeLabel?: string;
  featured?: boolean;
}) {
  return (
    <MarketplaceArticleCard
      className={`text-center ${featured ? "border-accent bg-accent/5" : ""}`}
    >
      <div className="flex justify-center">
        <MarketplaceBadge>
          {featured ? featuredBadgeLabel ?? badgeLabel : badgeLabel}
        </MarketplaceBadge>
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
