import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CREDIT_PACKS, ACTION_COSTS } from "@/config/credits";
import { getTranslations } from "next-intl/server";

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const tDashboard = await getTranslations("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="py-12 text-center">
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-4 text-lg text-secondary">{t("subtitle")}</p>
          </div>

          {/* Credit Packs */}
          <section className="mb-16">
            <h2 className="text-xl font-semibold text-primary mb-6 text-center">
              {t("creditPacks")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative p-6 rounded-2xl border-2 text-center ${
                    pack.featured
                      ? "border-accent bg-accent/5"
                      : "border-border"
                  }`}
                >
                  {pack.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
                      {tDashboard("popular")}
                    </span>
                  )}
                  <p className="text-3xl font-bold text-primary">
                    {pack.credits}
                  </p>
                  <p className="text-sm text-secondary">
                    {tDashboard("creditsWord")}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-accent">
                    {pack.price} €
                  </p>
                  {pack.discount > 0 && (
                    <span className="text-xs text-success font-medium">
                      {tDashboard("savePercent", { percent: pack.discount })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Action Costs */}
          <section className="mb-16">
            <h2 className="text-xl font-semibold text-primary mb-6 text-center">
              {t("whatCanYouDo")}
            </h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                      {t("action")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                      {t("description")}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-primary">
                      {t("price")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ACTION_COSTS.map((action, idx) => (
                    <tr
                      key={action.id}
                      className={idx % 2 === 0 ? "" : "bg-surface/50"}
                    >
                      <td className="px-6 py-4 font-medium text-primary">
                        {action.nameSk}
                      </td>
                      <td className="px-6 py-4 text-secondary text-sm">
                        {action.descriptionSk}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-accent">
                          {action.credits} kr
                        </span>
                        <span className="text-xs text-secondary block">
                          {action.duration}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
            <h2 className="text-xl font-semibold text-primary">
              {t("readyToStart")}
            </h2>
            <p className="mt-2 text-secondary">{t("buyCreditsToday")}</p>
            <Link
              href="/kredity"
              className="inline-block mt-4 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
            >
              {t("buyCredits")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
