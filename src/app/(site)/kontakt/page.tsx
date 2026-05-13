import ContactFormClient from "./ContactFormClient";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { BRAND_SOCIAL_CHANNELS, BRAND_SOCIAL_LINKS, BRAND_URL } from "@/config/brand";
import { COMPANY_INFO, COMPANY_POSTAL_ADDRESS_LINES } from "@/config/company";

const SITE_URL = BRAND_URL;

export const metadata: Metadata = {
  title: "Kontakt | Autobazar123",
  description:
    "Kontaktujte tím Autobazar123. Radi vám pomôžeme s inzerciou, účtom, platbami aj bezpečným nákupom vozidlá.",
  alternates: {
    canonical: `${SITE_URL}/kontakt`,
  },
};

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const socialLinks = BRAND_SOCIAL_CHANNELS.map((channel) => ({
    ...channel,
    href: BRAND_SOCIAL_LINKS[channel.key],
    hoverClassName:
      channel.key === "facebook"
        ? "hover:text-accent-foreground hover:bg-accent"
        : "hover:text-primary-foreground hover:bg-primary",
  }));
  const hasActiveSocialLinks = socialLinks.some((link) => Boolean(link.href));

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-20 pb-16">
        {/* Hero Section - Dark Theme */}
        <div className="relative overflow-hidden bg-background">
          <div className="absolute inset-0">
            {/* Lime glow */}
            <div className="absolute size-[280px] sm:size-[500px] -top-20 left-1/2 -translate-x-1/2 rounded-full bg-accent/15 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Sme tu pre vás
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border">
                <ContactFormClient />
              </div>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-surface rounded-2xl p-6 border border-border hover:border-accent/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <svg
                      className="size-6 text-background"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{t("email")}</h3>
                    <a
                      href={`mailto:${COMPANY_INFO.infoEmail}`}
                      className="text-accent hover:text-accent-hover transition-colors"
                    >
                      {COMPANY_INFO.infoEmail}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6 border border-border hover:border-accent/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <svg
                      className="size-6 text-background"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{t("phone")}</h3>
                    <a
                      href={`tel:${COMPANY_INFO.phoneHref}`}
                      className="text-accent hover:text-accent-hover transition-colors"
                    >
                      {COMPANY_INFO.phoneDisplay}
                    </a>
                    <p className="text-sm text-secondary mt-1">
                      {t("workingHours")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6 border border-border hover:border-accent/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <svg
                      className="size-6 text-background"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("address")}
                    </h3>
                    <p className="text-secondary">
                      {COMPANY_INFO.legalName}
                      {COMPANY_POSTAL_ADDRESS_LINES.map((line) => (
                        <span key={line}>
                          <br />
                          {line}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6 border border-border hover:border-accent/30 transition-colors">
                <h3 className="font-semibold text-primary mb-4">
                  Sledujte nás
                </h3>
                <div className="flex gap-3">
                  {socialLinks.map((link) =>
                    link.href ? (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`size-11 rounded-xl bg-surface flex items-center justify-center text-secondary transition-all duration-300 hover:scale-110 ${link.hoverClassName}`}
                        aria-label={link.label}
                      >
                        <svg
                          className="size-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d={link.iconPath} />
                        </svg>
                      </a>
                    ) : (
                      <span
                        role="img"
                        key={link.label}
                        aria-label={`${link.label}: sociálny profil pripravujeme`}
                        title={`${link.label}: sociálny profil pripravujeme`}
                        className="flex size-11 items-center justify-center rounded-xl border border-border bg-background text-secondary/40"
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
                  <p className="mt-3 text-sm text-secondary">
                    Sociálne profily pripravujeme.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
