import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
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

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-16 pb-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="py-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Mission */}
            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-2xl font-semibold text-primary mb-4">
                  {t("ourMission")}
                </h2>
                <p className="text-secondary leading-relaxed">
                  {t("missionText")}
                </p>
              </div>
            </section>

            {/* Values */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                {t("ourValues")}
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="p-6 rounded-xl border border-border bg-background">
                  <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <svg
                      className="size-6 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    {t("transparency")}
                  </h3>
                  <p className="text-sm text-secondary">
                    {t("transparencyDesc")}
                  </p>
                </div>
                <div className="p-6 rounded-xl border border-border bg-background">
                  <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <svg
                      className="size-6 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    {t("security")}
                  </h3>
                  <p className="text-sm text-secondary">{t("securityDesc")}</p>
                </div>
                <div className="p-6 rounded-xl border border-border bg-background">
                  <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <svg
                      className="size-6 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    {t("speed")}
                  </h3>
                  <p className="text-sm text-secondary">{t("speedDesc")}</p>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="mb-8">
              <div className="grid gap-6 sm:grid-cols-3 text-center">
                <div className="p-6 rounded-xl bg-accent/5">
                  <div className="text-3xl font-bold text-accent">1 247+</div>
                  <div className="mt-1 text-sm text-secondary">
                    {t("activeListings")}
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-accent/5">
                  <div className="text-3xl font-bold text-accent">500+</div>
                  <div className="mt-1 text-sm text-secondary">
                    {t("verifiedDealers")}
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-accent/5">
                  <div className="text-3xl font-bold text-accent">98%</div>
                  <div className="mt-1 text-sm text-secondary">
                    {t("satisfiedCustomers")}
                  </div>
                </div>
              </div>
            </section>

            {/* Team */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                {t("ourTeam")}
              </h2>
              <p className="text-secondary leading-relaxed mb-6">
                {t("teamText")}
              </p>
            </section>

            {/* CTA */}
            <section className="text-center py-6">
              <h2 className="text-xl font-semibold text-primary mb-4">
                {t("haveQuestions")}
              </h2>
              <p className="text-secondary mb-6">{t("dontHesitate")}</p>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
              >
                {t("contactUs")}
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

