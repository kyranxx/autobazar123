"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

export default function Footer() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");

  const currentYear = new Date().getUTCFullYear();

  const footerLinks = {
    navigation: [
      { href: "/vysledky", label: tCommon("cars") },
      { href: "/predajcovia", label: tCommon("dealers") },
      { href: "/ceny", label: tCommon("pricing") },
      { href: "/kontakt", label: tCommon("contact") },
    ],
    forDealers: [
      { href: "/moj-ucet?tab=create", label: tCommon("addListing") },
      { href: "/kredity", label: tCommon("pricing") },
      { href: "/dealer", label: t("forDealers") },
      { href: "/moj-ucet", label: tCommon("myAccount") },
    ],
    legal: [
      { href: "/o-nas", label: tCommon("about") },
      { href: "/obchodne-podmienky", label: t("termsOfService") },
      { href: "/ochrana-udajov", label: t("privacyPolicy") },
      { href: "/cookies", label: t("cookiePolicy") },
      { href: "/sitemap.xml", label: t("sitemap") },
    ],
  };

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
              <p className="font-semibold text-white">Apollo Tech s. r. o.</p>
              <p>{t("operatorLine")}</p>
              <p>{t("locationLine")}</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <SocialLink href="https://facebook.com" label="Facebook">
                <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
              </SocialLink>
              <SocialLink href="https://instagram.com" label="Instagram">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </SocialLink>
              <SocialLink href="https://twitter.com" label="X (Twitter)">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </SocialLink>
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
                    className="h-4 w-4 shrink-0"
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
                  <a href="mailto:info@autobazar123.sk" className="hover:text-accent transition-colors">
                    info@autobazar123.sk
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0"
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
                  <a href="tel:+421900123456" className="hover:text-accent transition-colors">
                    +421 900 123 456
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white">{t("copyright", { year: currentYear })}</p>
          <div className="flex items-center gap-6">
            <Link href="/ochrana-udajov" className="text-sm text-white transition-colors hover:text-accent">
              {t("privacyShort")}
            </Link>
            <Link href="/cookies" className="text-sm text-white transition-colors hover:text-accent">
              {t("cookiePolicy")}
            </Link>
            <Link href="/obchodne-podmienky" className="text-sm text-white transition-colors hover:text-accent">
              {t("termsShort")}
            </Link>
            <Link href="/sitemap.xml" className="text-sm text-white transition-colors hover:text-accent">
              {t("sitemap")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-4 text-base font-bold !text-white"
      style={{ color: "#ffffff", textTransform: "none", letterSpacing: "0" }}
    >
      {children}
    </h3>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 text-sm transition-colors",
        isActive ? "text-white font-semibold" : "text-white hover:text-accent",
      )}
    >
      {isActive && <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />}
      {children}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "flex h-9 w-9 hit-target items-center justify-center rounded-full",
        "bg-white/5 border border-white/10",
        "text-white/85 hover:bg-white/10 hover:text-white",
        "transition-all motion-interruptible",
      )}
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </a>
  );
}
