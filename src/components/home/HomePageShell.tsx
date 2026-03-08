import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import HomeSearchFormClient from "@/components/home/HomeSearchFormClient";
import { HOME_THEME, withAlpha } from "@/components/home/theme";
import {
  ArrowRightIcon,
  MapPinIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "@/components/ui/Icons";

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

const BUYER_PROMISES = [
  {
    titleKey: "buyerPromises.verifiedListings.title",
    detailKey: "buyerPromises.verifiedListings.detail",
    icon: ShieldCheckIcon,
  },
  {
    titleKey: "buyerPromises.fastCompare.title",
    detailKey: "buyerPromises.fastCompare.detail",
    icon: ZapIcon,
  },
  {
    titleKey: "buyerPromises.lessNoise.title",
    detailKey: "buyerPromises.lessNoise.detail",
    icon: SparklesIcon,
  },
] as const;

const SEARCH_PILLS = [
  "brandOption",
  "modelOption",
  "locationOption",
  "priceToOption",
  "fuelOption",
  "transmissionOption",
] as const;

export default async function HomePageShell() {
  const t = await getTranslations("homePage");
  const tSearch = await getTranslations("homeSearch");
  const vars = {
    "--home-brand": HOME_THEME.brand,
    "--home-link": HOME_THEME.link,
    "--home-cta": HOME_THEME.cta,
    "--home-cta-text": HOME_THEME.ctaText,
    "--home-accent-soft": withAlpha(HOME_THEME.cta, 0.14),
    "--home-accent-glow": withAlpha(HOME_THEME.cta, 0.24),
    "--home-soft-surface": HOME_THEME.softSurface,
    "--home-dark-surface": HOME_THEME.darkSurface,
    "--home-canvas": withAlpha(HOME_THEME.brand, 0.08),
    "--home-grid": withAlpha(HOME_THEME.brand, 0.07),
    "--home-brand-soft": withAlpha(HOME_THEME.brand, 0.12),
  } as CSSProperties;

  return (
    <div style={vars} className="relative isolate overflow-hidden bg-[var(--home-canvas)] text-text-primary">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[4%] top-[-7rem] h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: withAlpha(HOME_THEME.brand, 0.17) }}
        />
        <div
          className="absolute right-[3%] top-[8%] h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: withAlpha(HOME_THEME.cta, 0.24) }}
        />
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--home-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--home-grid) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:pb-20 lg:pt-12">
        <section className="grid gap-4 lg:grid-cols-12">
          <article className="animate-fade-in-up rounded-[34px] border border-[var(--home-cta)]/14 bg-white/90 shadow-xl backdrop-blur-sm lg:col-span-8">
            <div className="p-5 sm:p-7 lg:p-8">
              <div className="max-w-3xl">
                <p className="inline-flex items-center rounded-full border border-[var(--home-cta)]/18 bg-[var(--home-accent-soft)] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta)]">
                  {t("personalizedSearchEyebrow")}
                </p>
                <h1 className="mt-4 text-4xl font-black leading-[1.02] text-text-primary sm:text-5xl lg:text-6xl">
                  {t("personalizedSearchTitle")}
                </h1>
                <p className="mt-4 max-w-2xl text-sm text-text-secondary sm:text-base">
                  {t("personalizedSearchDescription")}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {SEARCH_PILLS.map((key) => (
                  <div
                    key={key}
                    className="inline-flex items-center rounded-full border border-[var(--home-cta)]/12 bg-[var(--home-accent-soft)]/52 px-3 py-2 text-xs font-semibold text-[var(--home-cta)] shadow-xs"
                  >
                    {tSearch(key)}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[28px] border border-[var(--home-cta)]/14 bg-[var(--home-soft-surface)]/95 p-3 shadow-[0_22px_50px_-28px_rgba(17,24,39,0.45)] sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--home-cta)] text-white shadow-sm">
                      <SearchIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-primary">{tSearch("search")}</p>
                      <p className="text-xs text-text-secondary">{tSearch("advancedOptionalHint")}</p>
                    </div>
                  </div>
                  <Link
                    href="/vysledky"
                    className="hidden items-center gap-1 text-xs font-semibold text-[var(--home-cta)] sm:inline-flex"
                  >
                    {t("viewAll")}
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <HomeSearchFormClient className="mt-0 border-0 bg-transparent p-0 shadow-none" />
              </div>
            </div>
          </article>

          <div className="grid gap-4 lg:col-span-4">
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
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(145deg, ${withAlpha(HOME_THEME.darkSurface, 0.88)} 0%, ${withAlpha(HOME_THEME.brand, 0.62)} 42%, ${withAlpha(HOME_THEME.cta, 0.58)} 100%)`,
                  }}
                />
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
                    <div key={stat.labelKey} className="rounded-2xl border border-[var(--home-cta)]/22 bg-black/14 px-4 py-3 backdrop-blur-sm">
                      <p className="text-xl font-black text-white">{stat.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/72">
                        {t(stat.labelKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="animate-fade-in-up rounded-[30px] border border-[var(--home-cta)]/10 bg-[var(--home-accent-soft)]/55 p-5 shadow-sm backdrop-blur-sm sm:p-6" style={{ animationDelay: "120ms" }}>
              <h2 className="text-xl font-display font-semibold text-text-primary">{t("buyerPromisesTitle")}</h2>
              <div className="mt-4 space-y-3">
                {BUYER_PROMISES.map((item) => (
                  <div key={item.titleKey} className="rounded-2xl border border-[var(--home-cta)]/12 bg-white/88 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-[var(--home-cta)]" />
                      <p className="text-sm font-semibold text-text-primary">{t(item.titleKey)}</p>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">{t(item.detailKey)}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-12">
          <article className="rounded-[28px] border border-black/10 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta)]">
                  {t("quickLinksTitle")}
                </p>
                <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary">
                  {tSearch("toggleAdvancedShow")}
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--home-accent-soft)] text-[var(--home-cta)]">
                <SearchIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {QUICK_LINKS.map((entry) => (
                <Link
                  key={entry.titleKey}
                  href={entry.href}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--home-cta)]/35 hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-black text-text-primary">{t(entry.titleKey)}</p>
                    <p className="mt-1 text-xs text-text-secondary">{t(entry.detailKey)}</p>
                  </div>
                  <ArrowRightIcon className="mt-0.5 h-4 w-4 text-[var(--home-cta)]" />
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[var(--home-cta)]/10 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:col-span-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--home-cta)]">
              {t("curatedEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-display font-semibold text-text-primary">
              {t("curatedTitle")}
            </h2>
            <div className="mt-4 grid gap-3">
              {HERO_STATS.map((stat) => (
                <div key={`${stat.labelKey}-footer`} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <p className="text-xl font-black text-text-primary">{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    {t(stat.labelKey)}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article
            className="rounded-[28px] border border-black/10 p-5 text-white shadow-sm sm:p-6 lg:col-span-3"
            style={{
              background: `linear-gradient(155deg, ${HOME_THEME.darkSurface} 0%, ${withAlpha(HOME_THEME.darkSurface, 0.96)} 42%, ${withAlpha(HOME_THEME.cta, 0.88)} 100%)`,
            }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
              Search-first
            </p>
            <h2 className="mt-2 text-2xl font-display font-semibold text-white">
              {t("ctaSellCar")}
            </h2>
            <p className="mt-2 text-sm text-white/74">
              Všetko ostatné je podriadené rýchlemu vyhľadávaniu a filtrom.
            </p>
            <div className="mt-5 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-semibold text-white/86">
                <MapPinIcon className="h-3.5 w-3.5" />
                {tSearch("locationOption")}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-semibold text-white/86">
                <SearchIcon className="h-3.5 w-3.5" />
                {tSearch("toggleAdvancedShow")}
              </div>
            </div>
            <Link
              href="/moj-ucet?tab=create"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--home-cta)] px-5 py-2.5 text-sm font-black text-[var(--home-cta-text)]"
            >
              {t("ctaSellCar")}
            </Link>
          </article>
        </section>
      </main>
    </div>
  );
}
