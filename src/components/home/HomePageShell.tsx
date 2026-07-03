import type { CSSProperties } from "react";
import { Suspense } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { TrackedLink } from "@/components/analytics";
import HomeFeaturedAdsRows, { type HomeFeaturedAdCard } from "@/components/home/HomeFeaturedAdsRows";
import HomeFrontpageSearch from "@/components/home/HomeFrontpageSearch";
import { HOME_THEME, withAlpha } from "@/components/home/theme";
import {
  ArrowRightIcon,
  CameraIcon,
  CarIcon,
  CheckCircleIcon,
  LockIcon,
  TagIcon,
  VerifiedIcon,
} from "@/components/ui/Icons";
import { buildAdPath } from "@/lib/cars/ad-path";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { getFeaturedCars } from "@/lib/supabase/cached";
import { BRAND_THEME } from "@/lib/theme/brand";

const QUICK_LINKS = [
  {
    href: "/vysledky?priceTo=10000",
    titleKey: "quickLinks.cityCars.title",
    detailKey: "quickLinks.cityCars.detail",
    cta: "city_cars",
    icon: CarIcon,
  },
  {
    href: "/vysledky?bodyStyle=suv",
    titleKey: "quickLinks.familySuv.title",
    detailKey: "quickLinks.familySuv.detail",
    cta: "family_suv",
    icon: CarIcon,
  },
  {
    href: "/vysledky?transmission=automatic",
    titleKey: "quickLinks.automatics.title",
    detailKey: "quickLinks.automatics.detail",
    cta: "automatics",
    icon: CheckCircleIcon,
  },
] as const;

const BRAND_LOGOS = [
  { name: "Škoda", src: "/brand-logos/skoda.png", href: "/skoda" },
  { name: "Volkswagen", src: "/brand-logos/volkswagen.png", href: "/volkswagen" },
  { name: "BMW", src: "/brand-logos/bmw.png", href: "/bmw" },
  { name: "Audi", src: "/brand-logos/audi.png", href: "/audi" },
  { name: "Mercedes-Benz", src: "/brand-logos/mercedes-benz.png", href: "/mercedes-benz" },
  { name: "Ford", src: "/brand-logos/ford.png", href: "/ford" },
  { name: "Hyundai", src: "/brand-logos/hyundai.svg", href: "/hyundai" },
  { name: "Kia", src: "/brand-logos/kia.png", href: "/kia" },
] as const;

const SK_NUMBER_FORMATTER = new Intl.NumberFormat("sk-SK");

export default async function HomePageShell() {
  const [t, tCommon, tFooter, tTopBanner, tHomeSearch, tBodyType] = await Promise.all([
    getTranslations("homePage"),
    getTranslations("common"),
    getTranslations("footer"),
    getTranslations("topBanner"),
    getTranslations("homeSearch"),
    getTranslations("bodyType"),
  ]);

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

  const trustItems = [
    {
      title: t("buyerPromises.verifiedListings.title"),
      detail: t("buyerPromises.verifiedListings.detail"),
      icon: VerifiedIcon,
    },
    {
      title: tTopBanner("realVehiclePhotos"),
      detail: t("buyerTrustDescription"),
      icon: CameraIcon,
    },
    {
      title: t("buyerPromises.fastCompare.title"),
      detail: t("buyerPromises.fastCompare.detail"),
      icon: CheckCircleIcon,
    },
    {
      title: t("buyerPromises.lessNoise.title"),
      detail: t("buyerPromises.lessNoise.detail"),
      icon: LockIcon,
    },
  ] as const;

  const quickCards = [
    ...QUICK_LINKS.map((entry) => ({
      href: entry.href,
      title: t(entry.titleKey),
      detail: t(entry.detailKey),
      cta: entry.cta,
      icon: entry.icon,
    })),
    {
      href: "/vysledky?bodyStyle=commercial",
      title: tBodyType("commercial"),
      detail: tCommon("slovakia"),
      cta: "utility",
      icon: CarIcon,
    },
    {
      href: "/vysledky",
      title: tHomeSearch("categoryAll"),
      detail: tCommon("viewAll"),
      cta: "all_cars",
      icon: TagIcon,
    },
  ] as const;

  return (
    <div
      style={vars}
      className="home-frontpage relative isolate overflow-hidden bg-white text-text-primary"
    >
      <main>
        <section
          id="search-first"
          aria-labelledby="home-search-heading"
          className="search-first bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_86%)]"
        >
          <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-7 sm:px-6 lg:grid-cols-[minmax(0,0.54fr)_minmax(0,1.46fr)] lg:items-start lg:pb-12 lg:pt-10">
            <div className="max-w-2xl lg:pt-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--home-brand)]">
                {t("personalizedSearchEyebrow")}
              </p>
              <h1
                id="home-search-heading"
                className="mt-3 !text-[2.3rem] font-black leading-[1.06] tracking-tight text-text-primary sm:!text-5xl lg:!text-[3.4rem]"
              >
                {t("personalizedSearchTitle")}
              </h1>
              <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-text-secondary sm:text-lg">
                {t("personalizedSearchDescription")}
              </p>
            </div>
            <HomeFrontpageSearch />
          </div>
        </section>

        <Suspense fallback={<HomeFeaturedAdsFallback />}>
          <HomeFeaturedAdsSection slovakiaLabel={tCommon("slovakia")} />
        </Suspense>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:pb-14">
          <h2 className="mb-5 text-2xl font-black tracking-tight text-text-primary">
            {t("quickChoicesTitle")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {quickCards.map((entry) => {
              const Icon = entry.icon;
              return (
                <TrackedLink
                  key={`${entry.cta}-${entry.href}`}
                  href={entry.href}
                  analyticsEventName="homepage_cta_clicked"
                  analyticsPayload={{
                    cta: entry.cta,
                    surface: "home_quick_search",
                    destination: entry.href,
                  }}
                  className="flex min-h-[5.3rem] min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-lg border border-black/10 bg-white p-4 shadow-sm transition-colors hover:border-[var(--home-mint)] hover:bg-[var(--home-mint)]/8"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center text-[var(--home-brand)]">
                    <Icon className="size-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-text-primary">
                      {entry.title}
                    </span>
                    <span className="mt-1 block truncate text-xs font-medium text-text-secondary">
                      {entry.detail}
                    </span>
                  </span>
                </TrackedLink>
              );
            })}
          </div>
        </section>

        <section className="bg-[linear-gradient(90deg,#effbf5_0%,#f8fffb_100%)]">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:py-12">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="flex gap-4 border-black/10 lg:border-r lg:pr-6 last:border-r-0">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[var(--home-brand)] shadow-sm">
                    <Icon className="size-7" />
                  </span>
                  <span>
                    <h3 className="text-sm font-black text-[var(--home-brand)]">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">{item.detail}</p>
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden bg-[var(--home-brand)] text-white">
          <Image
            src="/homepage-dealer-showroom.png"
            alt="Predajné priestory s vozidlami"
            fill
            sizes="100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,92,51,0.98)_0%,rgba(0,92,51,0.94)_38%,rgba(0,92,51,0.42)_67%,rgba(0,92,51,0.05)_100%)]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="max-w-2xl">
              <h2 className="!text-4xl !text-white font-black tracking-tight">
                {t("sellerPromoEyebrow")}
              </h2>
              <p className="mt-4 max-w-[34rem] text-lg font-medium leading-relaxed text-white/90">
                {t("sellerPanelDescription")}
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                {[t("sellerPanelPointTop"), t("sellerPanelPointAccount"), t("sellerPromoFootnote")].map((point) => (
                  <div key={point} className="flex gap-3 text-sm font-semibold text-white/90">
                    <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-[var(--home-mint)]" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/pridat-inzerat"
                  analyticsEventName="homepage_cta_clicked"
                  analyticsPayload={{
                    cta: "sell_car",
                    surface: "home_seller_promo",
                    destination: "/pridat-inzerat",
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[var(--home-cta)] px-7 text-sm font-black text-white shadow-[0_14px_28px_-18px_rgba(232,129,30,0.8)] transition-colors hover:bg-[var(--color-accent-hover)]"
                >
                  {t("ctaSellCar")}
                  <ArrowRightIcon className="size-4" />
                </TrackedLink>
                <TrackedLink
                  href="/dealer"
                  analyticsEventName="homepage_cta_clicked"
                  analyticsPayload={{
                    cta: "dealers",
                    surface: "home_seller_promo",
                    destination: "/dealer",
                  }}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--home-mint)] px-7 text-sm font-black text-white transition-colors hover:bg-white/10"
                >
                  {t("sellerPromoDealersCta")}
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
          <div className="mb-7 flex items-end justify-between gap-4">
            <h2 className="text-xl font-black text-text-primary">{tHomeSearch("popularBrandsLabel")}</h2>
            <TrackedLink
              href="/vysledky"
              analyticsEventName="homepage_cta_clicked"
              analyticsPayload={{
                cta: "view_all_brands",
                surface: "home_brand_logos",
                destination: "/vysledky",
              }}
              className="inline-flex items-center gap-2 text-sm font-black text-[var(--home-brand)] transition-colors hover:text-[var(--home-brand-hover)]"
            >
              {t("viewAll")}
              <ArrowRightIcon className="size-4" />
            </TrackedLink>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {BRAND_LOGOS.map((brand) => (
              <TrackedLink
                key={brand.name}
                href={brand.href}
                analyticsEventName="homepage_cta_clicked"
                analyticsPayload={{
                  cta: "popular_brand",
                  surface: "home_brand_logos",
                  destination: brand.href,
                }}
                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg bg-white text-center transition-colors hover:bg-background-muted"
              >
                <span className="relative h-9 w-16">
                  <Image src={brand.src} alt={`Logo značky ${brand.name}`} fill sizes="64px" className="object-contain" />
                </span>
                <span className="text-xs font-semibold text-text-primary">{brand.name}</span>
              </TrackedLink>
            ))}
          </div>

          <div className="mt-8 grid overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: t("ctaSellCar"),
                detail: t("sellerPromoFootnote"),
                icon: TagIcon,
              },
              {
                title: t("buyerPromises.fastCompare.title"),
                detail: t("buyerPromises.fastCompare.detail"),
                icon: CheckCircleIcon,
              },
              {
                title: tCommon("pricing"),
                detail: t("sellerPromoPremiumDetail"),
                icon: TagIcon,
              },
              {
                title: tCommon("contact"),
                detail: tFooter("description"),
                icon: CameraIcon,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 border-black/10 p-5 sm:border-r last:border-r-0">
                  <Icon className="size-8 shrink-0 text-[var(--home-brand)]" />
                  <span>
                    <span className="block text-sm font-black text-[var(--home-brand)]">{item.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{item.detail}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function HomeFeaturedAdsFallback() {
  return (
    <section
      aria-hidden="true"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14"
    >
      <div className="mb-6 h-9 w-56 rounded-lg bg-background-muted" />
      <div className="grid gap-3 md:hidden">
        {[0, 1].map((row) => (
          <div
            key={row}
            className="flex w-full min-w-0 max-w-full gap-3 overflow-hidden pb-2"
          >
            {[0, 1, 2].map((card) => (
              <div
                key={`${row}-${card}`}
                className="min-h-[19.5rem] w-[calc((100%-1.5rem)/2.25)] shrink-0 rounded-lg border border-black/10 bg-background-muted"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="hidden grid-cols-5 gap-4 md:grid lg:gap-5">
        {[0, 1, 2, 3, 4].map((card) => (
          <div
            key={card}
            className="min-h-[19.5rem] rounded-lg border border-black/10 bg-background-muted"
          />
        ))}
      </div>
    </section>
  );
}

async function HomeFeaturedAdsSection({
  slovakiaLabel,
}: {
  slovakiaLabel: string;
}) {
  const featuredCars = await getFeaturedCars();
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
    location: car.location || slovakiaLabel,
    price:
      typeof car.price === "number" && car.price > 0
        ? `${SK_NUMBER_FORMATTER.format(car.price)} €`
        : "Dohodou",
    image: optimizeCloudflareImage(car.image || "/placeholder-car.jpg", {
      width: 640,
      height: 720,
      fit: "cover",
      quality: 82,
      format: "auto",
    }),
  }));

  return <HomeFeaturedAdsRows cards={topAdCards} />;
}
