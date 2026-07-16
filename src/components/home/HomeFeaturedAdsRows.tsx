"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { TrackedLink } from "@/components/analytics";
import {
  ArrowRightIcon,
  HeartIcon,
  LocationIcon,
} from "@/components/ui/Icons";
import { getMarketPath } from "@/lib/routes";

export type HomeFeaturedAdCard = {
  id: string;
  href: string;
  title: string;
  year: string;
  mileage: string;
  fuel: string;
  price: string;
  location: string;
  image: string;
};

type HomeFeaturedAdsRowsProps = {
  cards: HomeFeaturedAdCard[];
};

type FeaturedAdsScrollRowProps = {
  cards: HomeFeaturedAdCard[];
  rowIndex: number;
};

function FeaturedAdCard({
  card,
  position,
  sizes,
  badgeLabel,
}: {
  card: HomeFeaturedAdCard;
  position: number;
  sizes: string;
  badgeLabel: string;
}) {
  return (
    <TrackedLink
      href={card.href}
      analyticsEventName="listing_viewed"
      analyticsPayload={{
        adId: card.id,
        source: "featured",
        position,
      }}
      className="group relative flex h-full min-h-[19.5rem] flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_16px_42px_-34px_rgba(17,24,39,0.7)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[1.05/1] overflow-hidden bg-background-muted">
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes={sizes}
          priority={position === 1}
          loading={position === 1 ? "eager" : "lazy"}
          fetchPriority={position === 1 ? "high" : "auto"}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.035]"
        />
        {position === 1 ? (
          <span className="absolute left-3 top-3 rounded bg-[var(--home-brand)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
            {badgeLabel}
          </span>
        ) : null}
        <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/88 text-[var(--home-brand)] shadow-sm backdrop-blur">
          <HeartIcon className="size-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-[13px] font-black leading-tight text-text-primary">
          {card.title}
        </h3>
        <p className="mt-2 line-clamp-1 text-[11px] font-medium text-text-secondary">
          {card.year} · {card.mileage} · {card.fuel}
        </p>
        <p className="mt-3 text-lg font-black text-[var(--home-brand)]">{card.price}</p>
        <p className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] font-medium text-text-secondary">
          <LocationIcon className="size-3.5" />
          {card.location}
        </p>
      </div>
    </TrackedLink>
  );
}

function FeaturedAdsScrollRow({ cards, rowIndex }: FeaturedAdsScrollRowProps) {
  const t = useTranslations("homePage");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollControls, setScrollControls] = useState({
    showLeft: false,
    showRight: false,
  });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const updateScrollControls = () => {
      if (window.innerWidth >= 768) {
        setScrollControls({ showLeft: false, showRight: false });
        return;
      }

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const epsilon = 2;
      setScrollControls({
        showLeft: scroller.scrollLeft > epsilon,
        showRight: maxScrollLeft - scroller.scrollLeft > epsilon,
      });
    };

    updateScrollControls();
    scroller.addEventListener("scroll", updateScrollControls, { passive: true });
    window.addEventListener("resize", updateScrollControls);

    return () => {
      scroller.removeEventListener("scroll", updateScrollControls);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, []);

  const scrollByAmount = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.82, 260),
      behavior: "smooth",
    });
  };

  return (
    <div
      role="region"
      aria-label={`${t("topAdsTitle")} ${rowIndex + 1}`}
      className="relative w-full min-w-0 max-w-full overflow-hidden md:hidden"
    >
      <div
        ref={scrollerRef}
        data-testid={`home-featured-row-${rowIndex}`}
        className="flex w-full min-w-0 max-w-full gap-3 overflow-x-auto overflow-y-visible pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
          overscrollBehaviorY: "auto",
        }}
      >
        {cards.map((card, cardIndex) => (
          <div key={card.id} className="w-[calc((100%-1.5rem)/2.25)] shrink-0 md:max-w-[16rem]">
            <FeaturedAdCard
              card={card}
              position={rowIndex * 5 + cardIndex + 1}
              sizes="(min-width: 768px) 304px, 82vw"
              badgeLabel={t("featuredBadge")}
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-1 top-[calc(50%-6px)] z-10 flex -translate-y-1/2 items-center justify-between">
        <div className="flex size-9 items-center justify-center">
          {scrollControls.showLeft ? (
            <button
              type="button"
              data-testid={`home-featured-row-${rowIndex}-scroll-left`}
              aria-label={t("scrollFeaturedAdsLeft")}
              onClick={() => scrollByAmount(-1)}
              className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[var(--home-brand)] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
            >
              <ArrowRightIcon className="size-4 rotate-180" />
            </button>
          ) : null}
        </div>
        <div className="flex size-9 items-center justify-center">
          {scrollControls.showRight ? (
            <button
              type="button"
              data-testid={`home-featured-row-${rowIndex}-scroll-right`}
              aria-label={t("scrollFeaturedAdsRight")}
              onClick={() => scrollByAmount(1)}
              className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[var(--home-brand)] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
            >
              <ArrowRightIcon className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function HomeFeaturedAdsRows({ cards }: HomeFeaturedAdsRowsProps) {
  const locale = useLocale();
  const resultsHref = getMarketPath("/vysledky", locale === "ro" ? "RO" : "SK");
  const t = useTranslations("homePage");
  const rows = [cards.slice(0, 5), cards.slice(5, 10)].filter((row) => row.length > 0);
  const desktopCards = cards.slice(0, 5);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-3 py-12 sm:px-6 lg:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-[2rem]">
          {t("curatedTitle")}
        </h2>
        <TrackedLink
          href={resultsHref}
          analyticsEventName="homepage_cta_clicked"
          analyticsPayload={{
            cta: "all_cars",
            surface: "home_quick_search",
            destination: resultsHref,
          }}
          className="hidden items-center gap-2 text-sm font-black text-[var(--home-brand)] transition-colors hover:text-[var(--home-brand-hover)] sm:inline-flex"
        >
          {t("viewAll")}
          <ArrowRightIcon className="size-4" />
        </TrackedLink>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <FeaturedAdsScrollRow key={`featured-scroll-row-${rowIndex}`} cards={row} rowIndex={rowIndex} />
        ))}
      </div>

      <div className="hidden grid-cols-5 gap-4 md:grid lg:gap-5">
        {desktopCards.map((card, cardIndex) => (
          <FeaturedAdCard
            key={card.id}
            card={card}
            position={cardIndex + 1}
            sizes="(min-width: 1280px) 17vw, (min-width: 1024px) 18vw, 50vw"
            badgeLabel={t("featuredBadge")}
          />
        ))}
      </div>
    </section>
  );
}
