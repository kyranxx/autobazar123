import type { CSSProperties } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { TrackedLink } from "@/components/analytics";
import HomeSearchFormClient from "@/components/home/HomeSearchFormClient";
import { getFeaturedCars } from "@/lib/supabase/cached";
import { buildAdPath } from "@/lib/cars/ad-path";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { HOME_THEME, withAlpha } from "@/components/home/theme";
import { BRAND_THEME } from "@/lib/theme/brand";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/Icons";

const HERO_STATS = [
  { value: "8 500+", labelKey: "heroStats.activeListings" },
  { value: "24h", labelKey: "heroStats.avgSellerResponse" },
  { value: "97%", labelKey: "heroStats.verifiedProfiles" },
] as const;

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

const BUYER_PROMISE_KEYS = ["verifiedListings", "fastCompare", "lessNoise"] as const;

export default async function HomePageShell() {
  const t = await getTranslations("homePage");
  const featuredCars = await getFeaturedCars();
  const topAdCards = featuredCars.map((car) => ({
    id: car.id,
    href: buildAdPath({
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
    }),
    title: `${car.brand} ${car.model}`,
    subtitle: car.isTopAd ? t("featuredBadge") : t("verifiedBadge"),
    year: String(car.year || "—"),
    mileage:
      typeof car.mileage === "number" && car.mileage > 0
        ? `${new Intl.NumberFormat("sk-SK").format(car.mileage)} km`
        : "—",
    fuel: car.fuel || "—",
    transmission: car.transmission || "—",
    location: car.location || "Slovensko",
    price:
      typeof car.price === "number" && car.price > 0
        ? `${new Intl.NumberFormat("sk-SK").format(car.price)} EUR`
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
    <div style={vars} className="home-frontpage relative isolate overflow-hidden bg-[var(--home-canvas)] text-text-primary">
      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-6 sm:pt-5 lg:pb-20 lg:pt-7">
        <h1 className="sr-only">{t("heroTitle")}</h1>
        <section className="grid items-start gap-4 lg:grid-cols-12">
          <article className="animate-fade-in-up relative min-w-0 rounded-[30px] border border-[var(--home-brand)]/18 bg-white p-2.5 shadow-[0_22px_50px_-28px_rgba(17,24,39,0.45)] sm:p-3.5 lg:col-span-8">
            <HomeSearchFormClient className="mt-0 border-0 bg-transparent p-0 shadow-none" />
          </article>

          <div className="grid min-w-0 content-start gap-4 lg:col-span-4 lg:self-start">
            <article className="animate-fade-in-up relative overflow-hidden rounded-[30px] border border-white/20 bg-[var(--home-dark-surface)] text-white shadow-lg" style={{ animationDelay: "70ms" }}>
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
                <div className="absolute inset-0" style={{ backgroundColor: withAlpha(HOME_THEME.brand, 0.68) }} />
              </div>
              <div className="relative z-10 flex min-h-[240px] flex-col justify-between p-5 sm:p-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/78">
                    {t("heroBadge")}
                  </p>
                  <p className="mt-3 max-w-xs text-2xl font-black leading-tight text-white">
                    {t("heroTitle")}
                  </p>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/78">
                    {t("heroDescription")}
                  </p>
                </div>
                <div className="grid gap-2">
                  {HERO_STATS.map((stat) => (
                    <div
                      key={stat.labelKey}
                      className="rounded-2xl border px-4 py-3 backdrop-blur-[2px]"
                      style={{
                        borderColor: withAlpha(HOME_THEME.mint, 0.28),
                        backgroundColor: withAlpha(HOME_THEME.mint, 0.12),
                      }}
                    >
                      <p className="text-xl font-black text-white">{stat.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/72">
                        {t(stat.labelKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="animate-fade-in-up rounded-[30px] border border-[var(--home-cta)]/25 bg-white p-5 shadow-sm sm:p-6" style={{ animationDelay: "120ms" }}>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta-ink)]">
                {t("accountEyebrow")}
              </p>
              <h2 className="mt-2 text-xl font-display font-semibold text-text-primary">
                {t("accountTitle")}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {t("accountDescription")}
              </p>
              <div className="mt-4 grid gap-2">
                <TrackedLink
                  href="/auth/register"
                  analyticsEventName="homepage_cta_clicked"
                  analyticsPayload={{
                    cta: "register",
                    surface: "home_account",
                    destination: "/auth/register",
                  }}
                  className="home-pressable home-touch-target home-hover-surface inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--home-cta)] px-4 text-sm font-black text-[var(--home-cta-text)]"
                  style={
                    {
                      "--home-hover-bg": withAlpha(HOME_THEME.cta, 0.88),
                      "--home-hover-border": withAlpha(HOME_THEME.cta, 0.7),
                    } as CSSProperties
                  }
                >
                  {t("registerCta")}
                </TrackedLink>
                <TrackedLink
                  href="/pridat-inzerat"
                  analyticsEventName="homepage_cta_clicked"
                  analyticsPayload={{
                    cta: "sell_car",
                    surface: "home_account",
                    destination: "/pridat-inzerat",
                  }}
                  className="home-pressable home-touch-target home-hover-surface inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-black text-[var(--home-mint-ink)]"
                  style={
                    {
                      borderColor: withAlpha(HOME_THEME.mint, 0.38),
                      backgroundColor: withAlpha(HOME_THEME.mint, 0.18),
                      "--home-hover-bg": withAlpha(HOME_THEME.mint, 0.26),
                      "--home-hover-border": withAlpha(HOME_THEME.mint, 0.5),
                    } as CSSProperties
                  }
                >
                  {t("dealersCta")}
                </TrackedLink>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-4 rounded-[30px] border border-[var(--home-cta)]/20 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta-ink)]">
                {t("topAdsEyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary">
                {t("topAdsTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                {t("topAdsDescription")}
              </p>
            </div>
            <div
              className="rounded-2xl border px-4 py-3 text-right"
              style={{
                borderColor: withAlpha(HOME_THEME.mint, 0.28),
                backgroundColor: withAlpha(HOME_THEME.mint, 0.08),
              }}
            >
              <p className="text-lg font-black text-text-primary">
                {topAdCards.length}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                {t("topAdsCountLabel")}
              </p>
            </div>
          </div>

          <div className="no-scrollbar grid auto-cols-[84%] grid-flow-col gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
            {topAdCards.map((card, index) => (
              <TrackedLink
                key={card.id}
                href={card.href}
                analyticsEventName="listing_viewed"
                analyticsPayload={{
                  adId: card.id,
                  source: "featured",
                  position: index + 1,
                }}
                className="home-pressable home-hover-zoom home-hover-surface relative flex min-h-[316px] snap-start flex-col overflow-hidden rounded-2xl border border-black/10 bg-background-secondary"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-background-muted">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(min-width: 1024px) 18vw, (min-width: 640px) 48vw, 96vw"
                    className="home-hover-zoom-child object-cover"
                  />
                  <div
                    className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--home-mint-ink)]"
                    style={{ backgroundColor: withAlpha(HOME_THEME.mint, 0.88) }}
                  >
                    {t("featuredBadge")}
                  </div>
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
                    {card.location}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-text-primary">{card.title}</p>
                      <p className="mt-1 text-xs text-text-secondary">{card.subtitle}</p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-black text-[var(--home-cta-ink)]">
                      {card.price}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
                    <div className="rounded-xl border border-border-subtle bg-white px-3 py-2">
                      {card.year}
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-white px-3 py-2">
                      {card.mileage}
                    </div>
                    <div className="col-span-2 rounded-xl border border-border-subtle bg-white px-3 py-2">
                      {card.fuel} · {card.transmission}
                    </div>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-2 text-xs font-black text-[var(--home-cta-ink)]">
                    {t("detailCta")}
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </TrackedLink>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-12">
          <article className="rounded-[28px] border border-[var(--home-brand)]/18 bg-white p-5 shadow-sm sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta-ink)]">
                  {t("quickLinksTitle")}
                </p>
                <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary">
                  {t("quickChoicesTitle")}
                </h2>
              </div>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--home-mint-ink)]"
                style={{ backgroundColor: withAlpha(HOME_THEME.mint, 0.22) }}
              >
                <SearchIcon className="h-5 w-5" />
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
                  className="home-pressable home-hover-shell home-hover-surface flex items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4"
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
                  <ArrowRightIcon className="home-hover-child mt-0.5 h-4 w-4 text-[var(--home-mint-ink)]" />
                </TrackedLink>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[var(--home-cta)]/20 bg-white p-5 shadow-sm sm:p-6 lg:col-span-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta-ink)]">
              {t("quickLinksTitle")}
            </p>
            <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary">
              {t("buyerPromisesTitle")}
            </h2>
            <div className="mt-4 grid gap-3">
              {BUYER_PROMISE_KEYS.map((key) => (
                <div
                  key={key}
                  className="rounded-2xl border bg-white px-4 py-3"
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

          <article className="rounded-[28px] border border-[var(--home-brand)]/30 bg-[var(--home-brand)] p-5 text-white shadow-sm sm:p-6 lg:col-span-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/90">
              {t("searchFirstEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-display font-semibold !text-white">
              {t("ctaSellCar")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/78">
              {t("sellerPanelDescription")}
            </p>
            <div className="mt-5 space-y-2">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
                style={{
                  borderColor: "rgb(255 255 255 / 0.24)",
                  backgroundColor: "rgb(255 255 255 / 0.08)",
                  color: "rgb(255 255 255)",
                }}
              >
                {t("sellerPanelPointTop")}
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
                style={{
                  borderColor: "rgb(255 255 255 / 0.24)",
                  backgroundColor: "rgb(255 255 255 / 0.08)",
                  color: "rgb(255 255 255)",
                }}
              >
                {t("sellerPanelPointAccount")}
              </div>
            </div>
            <TrackedLink
              href="/pridat-inzerat"
              analyticsEventName="homepage_cta_clicked"
              analyticsPayload={{
                cta: "sell_car",
                surface: "home_seller_panel",
                destination: "/pridat-inzerat",
              }}
              className="home-pressable home-touch-target home-hover-surface mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/14 px-5 py-2.5 text-sm font-black text-white"
              style={
                {
                  "--home-hover-bg": "rgb(255 255 255 / 0.2)",
                  "--home-hover-border": "rgb(255 255 255 / 0.4)",
                } as CSSProperties
              }
            >
              {t("ctaSellCar")}
            </TrackedLink>
          </article>
        </section>
      </main>
    </div>
  );
}
