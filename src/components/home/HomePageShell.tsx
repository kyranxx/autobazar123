import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import HomeSearchFormClient from "@/components/home/HomeSearchFormClient";
import { getFeaturedCars } from "@/lib/supabase/cached";
import { buildAdPath } from "@/lib/cars/ad-path";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { HOME_THEME, withAlpha } from "@/components/home/theme";
import { BRAND_THEME } from "@/lib/theme/brand";
import { ArrowRightIcon, MapPinIcon, SearchIcon } from "@/components/ui/Icons";

const HERO_STATS = [
  { value: "8 500+", labelKey: "heroStats.activeListings" },
  { value: "24h", labelKey: "heroStats.avgSellerResponse" },
  { value: "97%", labelKey: "heroStats.verifiedProfiles" },
] as const;

const QUICK_LINKS = [
  { href: "/vysledky?bodyStyle=suv", titleKey: "quickLinks.familySuv.title", detailKey: "quickLinks.familySuv.detail" },
  { href: "/vysledky?priceTo=10000", titleKey: "quickLinks.cityCars.title", detailKey: "quickLinks.cityCars.detail" },
  { href: "/vysledky?transmission=automatic", titleKey: "quickLinks.automatics.title", detailKey: "quickLinks.automatics.detail" },
] as const;

export default async function HomePageShell() {
  const t = await getTranslations("homePage");
  const tSearch = await getTranslations("homeSearch");
  const featuredCars = await getFeaturedCars();
  const topAdCards = featuredCars.slice(0, 5).map((car) => ({
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
    "--home-canvas": withAlpha(HOME_THEME.brand, 0.09),
    "--home-brand-hover": BRAND_THEME.primaryHover,
    "--home-brand-soft": withAlpha(HOME_THEME.brand, 0.13),
  } as CSSProperties;

  return (
    <div style={vars} className="home-frontpage relative isolate overflow-hidden bg-[var(--home-canvas)] text-text-primary">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-[var(--home-accent-soft)] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-[var(--home-mint-soft)] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-20 right-16 h-52 w-52 rounded-full bg-[var(--home-mint-soft)] blur-3xl" />
      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:pb-20 lg:pt-12">
        <h1 className="sr-only">{t("heroTitle")}</h1>
        <section className="grid gap-4 lg:grid-cols-12">
          <article className="animate-fade-in-up relative min-w-0 rounded-[30px] border border-[var(--home-brand)]/18 bg-white p-2.5 shadow-[0_22px_50px_-28px_rgba(17,24,39,0.45)] sm:p-3.5 lg:col-span-8">
            <HomeSearchFormClient className="mt-0 border-0 bg-transparent p-0 shadow-none" />
          </article>

          <div className="grid min-w-0 gap-4 lg:col-span-4">
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
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link
                  href="/moj-ucet"
                  className="home-pressable home-touch-target home-hover-surface inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--home-cta)] px-4 text-sm font-black text-[var(--home-cta-text)]"
                  style={
                    {
                      "--home-hover-bg": withAlpha(HOME_THEME.cta, 0.88),
                      "--home-hover-border": withAlpha(HOME_THEME.cta, 0.7),
                    } as CSSProperties
                  }
                >
                  {t("registerCta")}
                </Link>
                <Link
                  href="/moj-ucet?tab=create"
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
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-4 rounded-[30px] border border-[var(--home-cta)]/20 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {topAdCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="home-pressable home-hover-zoom home-hover-surface relative flex h-[300px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-background-secondary"
              >
                <div className="relative min-h-[168px] flex-[1.55] overflow-hidden bg-background-muted">
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
                </div>
                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div>
                    <p className="text-sm font-black text-text-primary">{card.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">{card.subtitle}</p>
                    <div className="mt-2 space-y-1 text-[11px] text-text-secondary">
                      <p>{card.year} · {card.mileage}</p>
                      <p>{card.fuel} · {card.transmission}</p>
                      <p>{card.location}</p>
                    </div>
                    <p className="mt-2 text-sm font-black text-text-primary">{card.price}</p>
                  </div>
                  <span className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--home-cta)] px-4 text-xs font-black text-[var(--home-cta-text)]">
                    {t("detailCta")}
                  </span>
                </div>
              </Link>
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
                <Link
                  key={entry.titleKey}
                  href={entry.href}
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
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[var(--home-cta)]/20 bg-white p-5 shadow-sm sm:p-6 lg:col-span-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta-ink)]">
              {t("curatedEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary">
              {t("curatedTitle")}
            </h2>
            <div className="mt-4 grid gap-3">
              {HERO_STATS.map((stat) => (
                <div
                  key={`${stat.labelKey}-footer`}
                  className="rounded-2xl border bg-white px-4 py-3"
                  style={{
                    borderColor: withAlpha(HOME_THEME.mint, 0.24),
                    backgroundColor: withAlpha(HOME_THEME.mint, 0.08),
                  }}
                >
                  <p className="text-xl font-black text-text-primary">{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    {t(stat.labelKey)}
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
            <div className="mt-5 space-y-2">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
                style={{
                  borderColor: "rgb(255 255 255 / 0.24)",
                  backgroundColor: "rgb(255 255 255 / 0.08)",
                  color: "rgb(255 255 255)",
                }}
              >
                <MapPinIcon className="h-3.5 w-3.5" />
                {tSearch("locationOption")}
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
                style={{
                  borderColor: "rgb(255 255 255 / 0.24)",
                  backgroundColor: "rgb(255 255 255 / 0.08)",
                  color: "rgb(255 255 255)",
                }}
              >
                <SearchIcon className="h-3.5 w-3.5" />
                {tSearch("toggleAdvancedShow")}
              </div>
            </div>
            <Link
              href="/moj-ucet?tab=create"
              className="home-pressable home-touch-target home-hover-surface mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/14 px-5 py-2.5 text-sm font-black text-white"
              style={
                {
                  "--home-hover-bg": "rgb(255 255 255 / 0.2)",
                  "--home-hover-border": "rgb(255 255 255 / 0.4)",
                } as CSSProperties
              }
            >
              {t("ctaSellCar")}
            </Link>
          </article>
        </section>
      </main>
    </div>
  );
}
