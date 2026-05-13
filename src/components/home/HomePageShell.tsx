import type { CSSProperties } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { TrackedLink } from "@/components/analytics";
import HomeFeaturedAdsRows, { type HomeFeaturedAdCard } from "@/components/home/HomeFeaturedAdsRows";
import HomeSearchFormClient from "@/components/home/HomeSearchFormClient";
import { HOME_THEME, withAlpha } from "@/components/home/theme";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { buildAdPath } from "@/lib/cars/ad-path";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { getPricingSnapshot } from "@/lib/pricing/server";
import { getFeaturedCars } from "@/lib/supabase/cached";
import { BRAND_THEME } from "@/lib/theme/brand";

const QUICK_LINKS = [
  {
    href: "/vysledky?bodyStyle=suv",
    titleKey: "quickLinks.familySuv.title",
    detailKey: "quickLinks.familySuv.detail",
    cta: "family_suv",
  },
  {
    href: "/vysledky?priceTo=10000",
    titleKey: "quickLinks.cityCars.title",
    detailKey: "quickLinks.cityCars.detail",
    cta: "city_cars",
  },
  {
    href: "/vysledky?transmission=automatic",
    titleKey: "quickLinks.automatics.title",
    detailKey: "quickLinks.automatics.detail",
    cta: "automatics",
  },
] as const;

const BUYER_PROMISE_KEYS = ["verifiedListings", "lessNoise"] as const;
const SK_NUMBER_FORMATTER = new Intl.NumberFormat("sk-SK");

export default async function HomePageShell() {
  const [t, { summary }, featuredCars] = await Promise.all([
    getTranslations("homePage"),
    getPricingSnapshot(),
    getFeaturedCars(),
  ]);
  const premiumPrice = summary.premium.split(" / ")[0] || summary.premium;
  const topPrice = summary.top.split(" / ")[0] || summary.top;
  const topAdCards: HomeFeaturedAdCard[] = featuredCars.slice(0, 10).map((car) => ({
    id: car.id,
    href: buildAdPath({
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
    }),
    title: `${car.brand} ${car.model}`,
    year: String(car.year || "—"),
    mileage:
      typeof car.mileage === "number" && car.mileage > 0
        ? `${SK_NUMBER_FORMATTER.format(car.mileage)} km`
        : "—",
    fuel: car.fuel || "—",
    price:
      typeof car.price === "number" && car.price > 0
        ? `${SK_NUMBER_FORMATTER.format(car.price)} €`
        : "Dohodou",
    image: optimizeCloudflareImage(car.image || "/placeholder-car.jpg", {
      width: 640,
      height: 900,
      fit: "cover",
      quality: 82,
      format: "auto",
    }),
  }));
  const vars = {
    "--home-brand": HOME_THEME.brand,
    "--home-link": HOME_THEME.link,
    "--home-cta": HOME_THEME.cta,
    "--home-cta-ink": HOME_THEME.ctaInk,
    "--home-cta-text": HOME_THEME.ctaText,
    "--home-accent-soft": withAlpha(HOME_THEME.cta, 0.14),
    "--home-mint": HOME_THEME.mint,
    "--home-mint-ink": HOME_THEME.brand,
    "--home-mint-soft": withAlpha(HOME_THEME.mint, 0.2),
    "--home-mint-strong": withAlpha(HOME_THEME.mint, 0.32),
    "--home-soft-surface": HOME_THEME.softSurface,
    "--home-dark-surface": HOME_THEME.brand,
    "--home-canvas": "var(--color-background)",
    "--home-brand-hover": BRAND_THEME.primaryHover,
    "--home-brand-soft": withAlpha(HOME_THEME.brand, 0.13),
  } as CSSProperties;

  return (
    <div
      style={vars}
      className="home-frontpage relative isolate overflow-hidden bg-[var(--home-canvas)] text-text-primary"
    >
      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-6 sm:pt-5 lg:pb-20 lg:pt-7">
        <h1 className="sr-only">{t("heroTitle")}</h1>

        <section className="grid items-stretch gap-4 lg:grid-cols-12">
          <div className="grid min-w-0 content-start gap-4 lg:col-span-8">
            <article className="animate-fade-in-up relative min-w-0 rounded-[30px] border border-[var(--home-brand)]/18 bg-white p-2.5 shadow-[0_22px_50px_-28px_rgba(17,24,39,0.45)] sm:p-3.5">
              <HomeSearchFormClient className="mt-0 border-0 bg-transparent p-0 shadow-none" />
            </article>
          </div>

          <div className="min-w-0 lg:col-span-4">
            <article
              className="animate-fade-in-up relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[30px] border border-white/20 bg-[var(--home-dark-surface)] text-white shadow-lg"
              style={{ animationDelay: "70ms" }}
            >
              <div className="absolute inset-0">
                <Image
                  src="/hero-forest-champagne.jpg"
                  alt="SUV on road at sunset"
                  fill
                  sizes="(min-width: 1024px) 30vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: "center 55%" }}
                  priority
                />
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: withAlpha(HOME_THEME.brand, 0.56) }}
                />
              </div>

              <div className="relative z-10 flex h-full flex-col justify-center p-5 sm:p-6">
                <div
                  className="rounded-[26px] border p-5 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.7)] backdrop-blur-[12px] sm:p-6"
                  style={{
                    borderColor: "rgb(255 255 255 / 0.28)",
                    backgroundColor: "rgb(255 255 255 / 0.22)",
                  }}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/82">
                    {t("sellerPromoEyebrow")}
                  </p>
                  <h2 className="mt-2 max-w-xs text-[2rem] font-display font-semibold leading-tight !text-white">
                    {t("sellerPromoTitle")}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/86">
                    {t("sellerPromoDescription")}
                  </p>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <div
                      className="rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: "rgb(255 255 255 / 0.2)",
                        backgroundColor: "rgb(255 255 255 / 0.1)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                        {t("sellerPromoPremiumLabel")}
                      </p>
                      <p className="mt-1 text-xl font-black text-white">
                        {t("sellerPromoPremiumPrice", { price: premiumPrice })}
                      </p>
                      <p className="mt-1 text-xs font-medium text-white/72">
                        {t("sellerPromoPremiumDetail")}
                      </p>
                    </div>
                    <div
                      className="rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: "rgb(255 255 255 / 0.2)",
                        backgroundColor: "rgb(255 255 255 / 0.1)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                        {t("sellerPromoTopLabel")}
                      </p>
                      <p className="mt-1 text-xl font-black text-white">
                        {t("sellerPromoTopPrice", { price: topPrice })}
                      </p>
                      <p className="mt-1 text-xs font-medium text-white/72">
                        {t("sellerPromoTopDetail")}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 inline-flex w-fit rounded-full border border-white/20 bg-white/14 px-3 py-1 text-xs font-semibold text-white/90">
                    {t("sellerPromoFootnote")}
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <TrackedLink
                      href="/pridat-inzerat"
                      analyticsEventName="homepage_cta_clicked"
                      analyticsPayload={{
                        cta: "sell_car",
                        surface: "home_seller_promo",
                        destination: "/pridat-inzerat",
                      }}
                      className="home-pressable home-touch-target home-hover-surface inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-black text-[var(--home-brand)] shadow-[0_16px_35px_rgb(15_23_42_/_0.18)]"
                      style={
                        {
                          "--home-hover-bg": "rgb(255 255 255 / 0.86)",
                          "--home-hover-border": "rgb(255 255 255 / 0.55)",
                        } as CSSProperties
                      }
                    >
                      {t("ctaSellCar")}
                    </TrackedLink>
                    <TrackedLink
                      href="/dealer"
                      analyticsEventName="homepage_cta_clicked"
                      analyticsPayload={{
                        cta: "dealers",
                        surface: "home_seller_promo",
                        destination: "/dealer",
                      }}
                      className="home-pressable home-touch-target home-hover-surface inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-black text-white"
                      style={
                        {
                          borderColor: "rgb(255 255 255 / 0.22)",
                          backgroundColor: "rgb(255 255 255 / 0.06)",
                          "--home-hover-bg": "rgb(255 255 255 / 0.12)",
                          "--home-hover-border": "rgb(255 255 255 / 0.38)",
                        } as CSSProperties
                      }
                    >
                      {t("sellerPromoDealersCta")}
                    </TrackedLink>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="animate-fade-in-up mt-4" style={{ animationDelay: "40ms" }}>
          <HomeFeaturedAdsRows cards={topAdCards} />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-12">
          <article className="rounded-[28px] border border-[var(--home-brand)]/18 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
            <div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta-ink)]">
                  {t("quickLinksTitle")}
                </p>
                <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary">
                  {t("quickChoicesTitle")}
                </h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {QUICK_LINKS.map((entry) => (
                <TrackedLink
                  key={entry.titleKey}
                  href={entry.href}
                  analyticsEventName="homepage_cta_clicked"
                  analyticsPayload={{
                    cta: entry.cta,
                    surface: "home_quick_links",
                    destination: entry.href,
                  }}
                  className="home-pressable home-hover-shell home-hover-surface flex items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4"
                  style={
                    {
                      "--home-hover-border": withAlpha(HOME_THEME.mint, 0.46),
                      "--home-hover-bg": withAlpha(HOME_THEME.mint, 0.08),
                    } as CSSProperties
                  }
                >
                  <div>
                    <p className="text-sm font-black text-text-primary">{t(entry.titleKey)}</p>
                    <p className="mt-1 text-xs text-text-secondary">{t(entry.detailKey)}</p>
                  </div>
                  <ArrowRightIcon className="home-hover-child mt-0.5 size-4 text-[var(--home-mint-ink)]" />
                </TrackedLink>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[var(--home-mint)]/30 bg-white p-5 shadow-sm sm:p-6 lg:col-span-5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta-ink)]">
              {t("buyerTrustEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary">
              {t("buyerTrustTitle")}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
              {t("buyerTrustDescription")}
            </p>

            <div className="mt-5 grid gap-3">
              {BUYER_PROMISE_KEYS.map((key) => (
                <div
                  key={key}
                  className="rounded-[22px] border p-4 sm:px-5"
                  style={{
                    borderColor: withAlpha(HOME_THEME.mint, 0.24),
                    backgroundColor: withAlpha(HOME_THEME.mint, 0.08),
                  }}
                >
                  <p className="text-sm font-black text-text-primary">
                    {t(`buyerPromises.${key}.title`)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {t(`buyerPromises.${key}.detail`)}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
