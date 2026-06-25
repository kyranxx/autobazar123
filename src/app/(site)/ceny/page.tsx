import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import { BRAND_URL } from "@/config/brand";
import { getPricingSnapshot } from "@/lib/pricing/server";
import { formatPriceCents } from "@/lib/pricing/config";

const SITE_URL = BRAND_URL;

export const metadata: Metadata = {
  title: "Cenník | Autobazar123",
  description: "Jednoduchý cenník inzercie, Basic, Premium a Exclusive balíkov na Autobazar123.",
  alternates: {
    canonical: `${SITE_URL}/ceny`,
  },
};

export default async function PricingPage() {
  const { config, summary } = await getPricingSnapshot();
  const phase = config.phases[config.phase];

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <PublicPageBreadcrumbs
            items={[{ label: "Cenník" }]}
            currentHref="/ceny"
          />
          <div className="py-12 text-center">
            <h1 className="text-3xl font-semibold text-primary sm:text-4xl">Cenník</h1>
            <p className="mt-4 text-lg text-secondary">
              Krátko a jasne. Vyberiete si len úroveň zverejnenia.
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
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
          </section>

          <section className="mt-10 rounded-3xl border border-border bg-background-secondary p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-primary">Ako to funguje</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoRow label="Predĺženie" value={summary.prolong} />
              <InfoRow label="Trvanie" value={`${config.durations.listingDays} dní`} />
              <InfoRow label="Zoradenie" value="Exclusive, Premium, potom bežné inzeráty" />
              <InfoRow label="Pri inom triedení" value="Platené inzeráty zostanú označené, ale miešajú sa do výsledkov" />
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-border bg-accent/5 p-6 sm:p-8">
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
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover"
              >
                Pridať inzerát
              </Link>
            </div>
          </section>

          <p className="mt-6 text-center text-sm text-secondary">
            Aktuálna fáza: <span className="font-semibold text-primary">{config.phase}</span>
            {" · "}
            Basic {phase.basicPriceCents === 0 ? "zadarmo" : formatPriceCents(phase.basicPriceCents)}
          </p>
        </div>
      </main>
    </div>
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
    <article
      className={`rounded-3xl border p-6 text-center ${
        featured ? "border-accent bg-accent/5" : "border-border bg-background-secondary"
      }`}
    >
      <h2 className="text-2xl font-semibold text-primary">{title}</h2>
      <p className="mt-4 text-3xl font-bold text-accent">{price}</p>
      <p className="mt-3 text-sm text-secondary">{description}</p>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">{label}</p>
      <p className="mt-1 text-sm font-medium text-primary">{value}</p>
    </div>
  );
}
