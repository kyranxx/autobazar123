import ContactFormClient from "./ContactFormClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceCard,
  MarketplaceContainer,
  MarketplaceHero,
  MarketplaceIconBadge,
  MarketplacePageShell,
} from "@/components/ui/MarketplacePage";
import { BRAND_SOCIAL_CHANNELS, BRAND_SOCIAL_LINKS, BRAND_URL } from "@/config/brand";
import { COMPANY_INFO, COMPANY_POSTAL_ADDRESS_LINES } from "@/config/company";

const SITE_URL = BRAND_URL;

export const metadata: Metadata = {
  title: "Kontakt | Autobazar123",
  description:
    "Kontaktujte tím Autobazar123. Radi vám pomôžeme s inzerciou, účtom, platbami aj bezpečným nákupom vozidla.",
  alternates: {
    canonical: `${SITE_URL}/kontakt`,
  },
};

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const socialLinks = BRAND_SOCIAL_CHANNELS.map((channel) => ({
    ...channel,
    href: BRAND_SOCIAL_LINKS[channel.key],
  }));
  const hasActiveSocialLinks = socialLinks.some((link) => Boolean(link.href));

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          align="center"
          eyebrow="Sme tu pre vás"
          title={t("title")}
          description={t("subtitle")}
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: "Kontakt" }]}
              currentHref="/kontakt"
              className="mb-0"
            />
          }
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MarketplaceCard className="p-6 sm:p-8">
              <ContactFormClient />
            </MarketplaceCard>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <ContactInfoCard
              title={t("email")}
              icon={
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              <a
                href={`mailto:${COMPANY_INFO.infoEmail}`}
                className="font-medium text-accent hover:text-accent-hover"
              >
                {COMPANY_INFO.infoEmail}
              </a>
            </ContactInfoCard>

            <ContactInfoCard
              title={t("phone")}
              icon={
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              }
            >
              <a
                href={`tel:${COMPANY_INFO.phoneHref}`}
                className="font-medium text-accent hover:text-accent-hover"
              >
                {COMPANY_INFO.phoneDisplay}
              </a>
              <p className="mt-1 text-sm text-secondary">{t("workingHours")}</p>
            </ContactInfoCard>

            <ContactInfoCard
              title={t("address")}
              icon={
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            >
              <p className="text-secondary">
                {COMPANY_INFO.legalName}
                {COMPANY_POSTAL_ADDRESS_LINES.map((line) => (
                  <span key={line}>
                    <br />
                    {line}
                  </span>
                ))}
              </p>
            </ContactInfoCard>

            <MarketplaceCard>
              <h2 className="mb-4 font-semibold text-primary">Sledujte nás</h2>
              <div className="flex gap-3">
                {socialLinks.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="market-icon-button size-11 text-secondary hover:text-accent"
                      aria-label={link.label}
                    >
                      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d={link.iconPath} />
                      </svg>
                    </a>
                  ) : (
                    <span
                      role="img"
                      key={link.label}
                      aria-label={`${link.label}: sociálny profil pripravujeme`}
                      title={`${link.label}: sociálny profil pripravujeme`}
                      className="market-icon-button size-11 text-secondary/40 opacity-60"
                    >
                      <svg
                        className="size-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d={link.iconPath} />
                      </svg>
                    </span>
                  ),
                )}
              </div>
              {!hasActiveSocialLinks ? (
                <p className="mt-3 text-sm text-secondary">Sociálne profily pripravujeme.</p>
              ) : null}
            </MarketplaceCard>
          </div>
        </div>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}

function ContactInfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <MarketplaceCard>
      <div className="flex items-start gap-4">
        <MarketplaceIconBadge>{icon}</MarketplaceIconBadge>
        <div>
          <h2 className="font-semibold text-primary">{title}</h2>
          {children}
        </div>
      </div>
    </MarketplaceCard>
  );
}
