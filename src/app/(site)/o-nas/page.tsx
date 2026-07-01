import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceArticleCard,
  MarketplaceContainer,
  MarketplaceHero,
  MarketplaceIconBadge,
  MarketplaceLinkButton,
  MarketplacePageShell,
  MarketplaceSection,
  MarketplaceStatCard,
} from "@/components/ui/MarketplacePage";
import { CheckCircleIcon, LockIcon, SpeedometerIcon } from "@/components/ui/Icons";
import { BRAND_URL } from "@/config/brand";

const SITE_URL = BRAND_URL;

export const metadata: Metadata = {
  title: "O nás | Autobazar123",
  description:
    "Spoznajte tím Autobazar123 a našu misiu prinášať transparentný, bezpečný a férový autobazár na Slovensku.",
  alternates: {
    canonical: `${SITE_URL}/o-nas`,
  },
};

export default async function AboutPage() {
  const t = await getTranslations("about");

  const values = [
    {
      title: t("transparency"),
      description: t("transparencyDesc"),
      icon: CheckCircleIcon,
    },
    {
      title: t("security"),
      description: t("securityDesc"),
      icon: LockIcon,
    },
    {
      title: t("speed"),
      description: t("speedDesc"),
      icon: SpeedometerIcon,
    },
  ];

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          align="center"
          eyebrow="Autobazar123"
          title={t("title")}
          description={t("subtitle")}
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: "O nás" }]}
              currentHref="/o-nas"
              className="mb-0"
            />
          }
          stats={
            <div className="grid gap-3 sm:grid-cols-3">
              <MarketplaceStatCard value="Reálne" label={t("activeListings")} tone="accent" />
              <MarketplaceStatCard value="Otvorené" label={t("verifiedDealers")} />
              <MarketplaceStatCard value="Postupne" label={t("satisfiedCustomers")} />
            </div>
          }
        />

        <MarketplaceSection title={t("ourMission")}>
          <MarketplaceArticleCard>
            <p className="market-readable">{t("missionText")}</p>
          </MarketplaceArticleCard>
        </MarketplaceSection>

        <MarketplaceSection title={t("ourValues")}>
          <div className="grid gap-4 md:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <MarketplaceArticleCard key={value.title}>
                  <MarketplaceIconBadge>
                    <Icon className="size-5" />
                  </MarketplaceIconBadge>
                  <h3 className="mt-4 text-lg font-semibold text-primary">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary">{value.description}</p>
                </MarketplaceArticleCard>
              );
            })}
          </div>
        </MarketplaceSection>

        <MarketplaceSection title={t("ourTeam")}>
          <MarketplaceArticleCard>
            <p className="market-readable">{t("teamText")}</p>
          </MarketplaceArticleCard>
        </MarketplaceSection>

        <section className="market-soft-band p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold text-primary">{t("haveQuestions")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-secondary">{t("dontHesitate")}</p>
          <div className="mt-5 flex justify-center">
            <MarketplaceLinkButton href="/kontakt" showArrow>
              {t("contactUs")}
            </MarketplaceLinkButton>
          </div>
        </section>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}
