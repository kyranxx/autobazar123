"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BRAND_SOCIAL_CHANNELS, BRAND_SOCIAL_LINKS } from "@/config/brand";
import { COMPANY_INFO } from "@/config/company";
import { AcceptedPaymentMethods } from "@/components/payments/AcceptedPaymentMethods";

export default function Footer({ currentYear }: { currentYear: number }) {
  const pathname = usePathname();
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

  if (pathname === "/vysledky") {
    return (
      <footer className="print:hidden bg-[var(--color-primary)] text-white" role="contentinfo">
        <div className="container-main py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link href="/" className="inline-flex items-center gap-2 group" aria-label={t("homeAriaLabel")}>
                <span className="text-xl font-display font-semibold tracking-tight text-white">
                  Autobazar123.sk
                </span>
              </Link>
              <p className="mt-1 hidden max-w-xl text-sm leading-relaxed text-white/78 sm:block">
                {t("description")}
              </p>
            </div>
            <nav
              aria-label={t("navigation")}
              className="flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              {[
                ...footerLinks.navigation,
                footerLinks.legal[1],
                footerLinks.legal[2],
              ].map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </nav>
          </div>

          <div className="mt-5 flex flex-col items-start gap-3 border-t border-white/12 pt-4 text-left sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/78">{t("copyright", { year: currentYear })}</p>
            <AcceptedPaymentMethods />
          </div>
        </div>
      </footer>
    );
  }

  if (pathname === "/") {
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

  return (
    <footer className="print:hidden bg-background-dark text-white" role="contentinfo">
      <div className="container-main py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-5 sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2 group" aria-label={t("homeAriaLabel")}>
              <span className="text-2xl font-display font-semibold tracking-tight text-white">
                Autobazar<span className="text-white">123</span>
              </span>
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-white">{t("description")}</p>

            <div className="space-y-1 text-sm text-white">
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
              {!hasActiveSocialLinks ? (
                <p className="mt-3 text-xs text-white/70">{t("socialSoon")}</p>
              ) : null}
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

          <div className="lg:col-span-3">
            <FooterHeading>{t("forDealers")}</FooterHeading>
            <ul className="space-y-2.5" role="list">
              {footerLinks.forDealers.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <FooterHeading>{t("legal")}</FooterHeading>
            <ul className="space-y-2.5" role="list">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-white/10 pt-6">
              <FooterHeading>{t("contact")}</FooterHeading>
              <ul className="space-y-2 text-sm text-white">
                <li className="flex items-center gap-2">
                  <svg
                    className="size-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  <a
                    href={`mailto:${COMPANY_INFO.infoEmail}`}
                    className="hover:text-accent transition-colors"
                  >
                    {COMPANY_INFO.infoEmail}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="size-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                  <a
                    href={`tel:${COMPANY_INFO.phoneHref}`}
                    className="hover:text-accent transition-colors"
                  >
                    {COMPANY_INFO.phoneDisplay}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-white">{t("copyright", { year: currentYear })}</p>
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
