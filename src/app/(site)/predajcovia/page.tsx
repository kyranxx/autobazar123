import type { Metadata } from "next";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceBadge,
  MarketplaceCard,
  MarketplaceContainer,
  MarketplaceHero,
  MarketplaceLinkButton,
  MarketplacePageShell,
  MarketplaceSection,
  MarketplaceStatCard,
} from "@/components/ui/MarketplacePage";
import { VerifiedIcon } from "@/components/ui/Icons";
import { BRAND_URL } from "@/config/brand";
import { getVerifiedDealerSummaries } from "@/lib/dealer/public";
import { buildDealerPublicProfilePath } from "@/lib/dealer/public-profile-path";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";

const SITE_URL = BRAND_URL;
const MEMBER_SINCE_YEAR_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  year: "numeric",
});

export const metadata: Metadata = {
  title: "Predajcovia | Autobazar123",
  description:
    "Zoznam predajcov vozidiel na Autobazar123. Prezrite si profily autobazárov a ich aktuálne ponuky.",
  alternates: {
    canonical: `${SITE_URL}/predajcovia`,
  },
};

function formatMemberSinceYear(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "";
  }

  return MEMBER_SINCE_YEAR_FORMATTER.format(new Date(timestamp));
}

function dealerInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "AB";
}

export default async function DealersPage() {
  await connection();

  const dealers = await getVerifiedDealerSummaries();
  const activeAds = dealers.reduce((sum, dealer) => sum + dealer.activeAds, 0);
  const soldCount = dealers.reduce((sum, dealer) => sum + dealer.soldCount, 0);

  return (
    <MarketplacePageShell>
      <MarketplaceContainer className="space-y-8">
        <MarketplaceHero
          eyebrow="Predajcovia"
          title="Overené profily predajcov"
          description="Prezrite si predajcov, ktorí majú na Autobazar123 zverejnený profil a aktuálnu ponuku vozidiel."
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: "Predajcovia" }]}
              currentHref="/predajcovia"
            />
          }
          actions={
            <MarketplaceLinkButton href="/dealer" variant="secondary" showArrow>
              Vytvoriť profil predajcu
            </MarketplaceLinkButton>
          }
          stats={
            <div className="grid gap-3 sm:grid-cols-3">
              <MarketplaceStatCard value={dealers.length} label="zverejnených predajcov" />
              <MarketplaceStatCard value={activeAds} label="aktívnych inzerátov" tone="accent" />
              <MarketplaceStatCard value={soldCount} label="predaných vozidiel" tone="success" />
            </div>
          }
        />

        <MarketplaceSection>
          {dealers.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dealers.map((dealer) => (
                <Link
                  key={dealer.id}
                  href={buildDealerPublicProfilePath(dealer.slug)}
                  className="market-card group block p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                      {dealer.logoUrl ? (
                        <Image
                          src={optimizeCloudflareImage(dealer.logoUrl, {
                            width: 128,
                            height: 128,
                            fit: "cover",
                            quality: 82,
                            format: "auto",
                          })}
                          alt={dealer.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-background-muted text-sm font-bold text-primary">
                          {dealerInitials(dealer.name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-primary group-hover:text-accent">
                        {dealer.name}
                      </h2>
                      <p className="text-sm text-secondary">{dealer.city || "Slovensko"}</p>
                      {dealer.isVerified ? (
                        <div className="mt-2">
                          <MarketplaceBadge>
                            <VerifiedIcon className="size-4 text-success" />
                            Overený
                          </MarketplaceBadge>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <DealerMetric value={dealer.activeAds} label="Aktívnych" />
                    <DealerMetric value={dealer.soldCount} label="Predaných" tone="success" />
                    <DealerMetric
                      value={formatMemberSinceYear(dealer.memberSince) || "-"}
                      label="Člen od"
                      tone="accent"
                    />
                  </div>

                  {dealer.description ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-secondary">
                      {dealer.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <MarketplaceCard className="border-dashed py-12 text-center">
              <h2 className="text-xl font-semibold text-primary">
                Zatiaľ tu nie sú žiadni zverejnení predajcovia
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-secondary">
                Po schválení prvých dealer profilov sa zobrazia na tejto stránke.
              </p>
            </MarketplaceCard>
          )}
        </MarketplaceSection>

        <section className="market-soft-band p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold text-primary">Ste autobazár?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-secondary">
            Vytvorte si profil predajcu a pripravte svoju ponuku pre kupujúcich.
          </p>
          <div className="mt-5 flex justify-center">
            <MarketplaceLinkButton href="/dealer" showArrow>
              Registrovať sa ako predajca
            </MarketplaceLinkButton>
          </div>
        </section>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}

function DealerMetric({
  value,
  label,
  tone = "primary",
}: {
  value: string | number;
  label: string;
  tone?: "primary" | "accent" | "success";
}) {
  const toneClass =
    tone === "accent" ? "text-accent" : tone === "success" ? "text-success" : "text-primary";

  return (
    <div className="rounded-lg border border-border bg-background px-2 py-3">
      <p className={`text-lg font-bold ${toneClass}`}>{value}</p>
      <p className="text-xs text-secondary">{label}</p>
    </div>
  );
}
