"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BRAND_SOCIAL_CHANNELS, BRAND_SOCIAL_LINKS } from "@/config/brand";
import { COMPANY_INFO } from "@/config/company";
import { AcceptedPaymentMethods } from "@/components/payments/AcceptedPaymentMethods";

export default function Footer({ currentYear }: { currentYear: number }) {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");

  const footerLinks = {
    navigation: [
      { href: "/vysledky", label: tCommon("cars") },
      { href: "/predajcovia", label: tCommon("dealers") },
      { href: "/ceny", label: tCommon("pricing") },
      { href: "/kontakt", label: tCommon("contact") },
    ],
    forDealers: [
      { href: "/moj-ucet?tab=create", label: tCommon("addListing") },
      { href: "/ceny", label: tCommon("pricing") },
      { href: "/dealer", label: t("forDealers") },
      { href: "/moj-ucet", label: tCommon("myAccount") },
    ],
    legal: [
      { href: "/o-nas", label: tCommon("about") },
      { href: "/obchodne-podmienky", label: t("termsOfService") },
      { href: "/ochrana-udajov", label: t("privacyPolicy") },
      { href: "/cookies", label: t("cookiePolicy") },
      { href: "/site-map", label: t("sitemap") },
    ],
  };
  const socialLinks = BRAND_SOCIAL_CHANNELS.map((channel) => ({
    ...channel,
    href: BRAND_SOCIAL_LINKS[channel.key],
  }));
  const hasActiveSocialLinks = socialLinks.some((link) => Boolean(link.href));

  return (
    <footer className="print:hidden bg-[var(--color-primary)] text-white" role="contentinfo">
      <div className="container-main py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-5 sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2 group" aria-label={t("homeAriaLabel")}>
              <span className="text-2xl font-display font-semibold tracking-tight text-white">
                Autobazar123.sk
              </span>
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-white/82">{t("description")}</p>

            <div className="space-y-1 text-sm text-white/82">
              <p className="font-semibold text-white">{COMPANY_INFO.legalName}</p>
              <p>{t("operatorLine")}</p>
              <p>{t("locationLine")}</p>
            </div>

            <div className="pt-1">
              <div className="flex items-center gap-2">
                {socialLinks.map((link) =>
                  link.href ? (
                    <SocialLink
                      key={link.label}
                      href={link.href}
                      label={link.label}
                      iconPath={link.iconPath}
                    />
                  ) : (
                    <SocialLinkDisabled
                      key={link.label}
                      label={link.label}
                      iconPath={link.iconPath}
                      helperText={t("socialSoon")}
                    />
                  ),
                )}
              </div>
              {!hasActiveSocialLinks ? <p className="mt-3 text-xs text-white/70">{t("socialSoon")}</p> : null}
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>{t("navigation")}</FooterHeading>
            <ul className="space-y-2.5" role="list">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>{t("forDealers")}</FooterHeading>
            <ul className="space-y-2.5" role="list">
              {footerLinks.forDealers.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>{t("legal")}</FooterHeading>
            <ul className="space-y-2.5" role="list">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>{t("contact")}</FooterHeading>
            <ul className="space-y-3 text-sm text-white/82">
              <li>
                <a href={`tel:${COMPANY_INFO.phoneHref}`} className="hover:text-white">
                  {COMPANY_INFO.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY_INFO.infoEmail}`} className="hover:text-white">
                  {COMPANY_INFO.infoEmail}
                </a>
              </li>
              <li>{t("locationLine")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/12 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-white/78">{t("copyright", { year: currentYear })}</p>
          <AcceptedPaymentMethods />
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 text-base font-semibold !text-white [text-transform:none] [letter-spacing:0]">
      {children}
    </h3>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const prefetch = isProtectedFooterHref(href) ? false : undefined;

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className="inline-flex items-center gap-2 text-sm text-white transition-colors hover:text-accent"
    >
      {children}
    </Link>
  );
}

function isProtectedFooterHref(href: string): boolean {
  return href === "/dealer" || href.startsWith("/dealer?") || href.startsWith("/moj-ucet");
}

function SocialLink({
  href,
  label,
  iconPath,
}: {
  href: string;
  label: string;
  iconPath: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-9 hit-target items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 transition-all motion-interruptible hover:bg-white/10 hover:text-white"
    >
      <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
        <path d={iconPath} />
      </svg>
    </a>
  );
}

function SocialLinkDisabled({
  label,
  iconPath,
  helperText,
}: {
  label: string;
  iconPath: string;
  helperText: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${label}: ${helperText}`}
      title={`${label}: ${helperText}`}
      className="flex size-9 hit-target items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/35"
    >
      <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d={iconPath} />
      </svg>
    </span>
  );
}
