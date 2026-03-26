"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { TrackedLink } from "@/components/analytics";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { HOME_THEME, withAlpha } from "@/components/home/theme";

export type HomeFeaturedAdCard = {
  id: string;
  href: string;
  title: string;
  year: string;
  mileage: string;
  fuel: string;
  price: string;
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
  className,
  sizes,
  badgeLabel,
}: {
  card: HomeFeaturedAdCard;
  position: number;
  className?: string;
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
      className={`home-pressable home-hover-zoom home-hover-surface relative flex h-full min-h-[245px] flex-col overflow-hidden rounded-[22px] border border-black/10 bg-white ${className ?? ""}`}
      style={{
        boxShadow: `0 14px 34px -26px ${withAlpha(HOME_THEME.brand, 0.4)}`,
      }}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-background-muted">
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes={sizes}
          className="home-hover-zoom-child object-cover"
        />
        <div
          className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--home-mint-ink)]"
          style={{ backgroundColor: withAlpha(HOME_THEME.mint, 0.88) }}
        >
          {badgeLabel}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        <div
          className="absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-sm"
          style={{ backgroundColor: "rgb(15 23 42 / 0.68)" }}
        >
          {card.price}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 min-w-0 text-[13px] font-black leading-[1.15] text-text-primary sm:text-sm">
            {card.title}
          </p>
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[var(--home-brand)]"
            style={{
              borderColor: withAlpha(HOME_THEME.mint, 0.35),
              backgroundColor: withAlpha(HOME_THEME.mint, 0.14),
            }}
          >
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          <span className="rounded-full border border-border-subtle bg-background-secondary px-2 py-1">
            {card.year}
          </span>
          <span className="rounded-full border border-border-subtle bg-background-secondary px-2 py-1">
            {card.fuel}
          </span>
        </div>
        <p className="mt-auto text-[11px] font-medium text-text-secondary">{card.mileage}</p>
      </div>
    </TrackedLink>
  );
}

function FeaturedAdsScrollRow({ cards, rowIndex }: FeaturedAdsScrollRowProps) {
  const t = useTranslations("homePage");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const updateScrollControls = () => {
      if (window.innerWidth >= 1024) {
        setShowScrollLeft(false);
        setShowScrollRight(false);
        return;
      }

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const epsilon = 2;
      setShowScrollLeft(scroller.scrollLeft > epsilon);
      setShowScrollRight(maxScrollLeft - scroller.scrollLeft > epsilon);
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
      className="relative w-full min-w-0 max-w-full overflow-hidden lg:hidden"
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
          <div key={card.id} className="w-[calc((100%-1.5rem)/2.5)] shrink-0 md:max-w-[16rem]">
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
        <div className="flex h-9 w-9 items-center justify-center">
          {showScrollLeft ? (
            <button
              type="button"
              data-testid={`home-featured-row-${rowIndex}-scroll-left`}
              aria-label={t("scrollFeaturedAdsLeft")}
              onClick={() => scrollByAmount(-1)}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--home-mint)]/28 bg-[var(--home-mint)]/12 text-[var(--home-brand)] shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--home-mint)]/18"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
            </button>
          ) : null}
        </div>
        <div className="flex h-9 w-9 items-center justify-center">
          {showScrollRight ? (
            <button
              type="button"
              data-testid={`home-featured-row-${rowIndex}-scroll-right`}
              aria-label={t("scrollFeaturedAdsRight")}
              onClick={() => scrollByAmount(1)}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--home-mint)]/28 bg-[var(--home-mint)]/12 text-[var(--home-brand)] shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--home-mint)]/18"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function HomeFeaturedAdsRows({ cards }: HomeFeaturedAdsRowsProps) {
  const t = useTranslations("homePage");
  const rows = [cards.slice(0, 5), cards.slice(5, 10)].filter((row) => row.length > 0);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div
          className="min-w-0 max-w-[34rem] rounded-[24px] border px-4 py-3 sm:px-5"
          style={{
            borderColor: withAlpha(HOME_THEME.mint, 0.3),
            backgroundColor: withAlpha(HOME_THEME.mint, 0.08),
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--home-cta-ink)]">
            {t("topAdsEyebrow")}
          </p>
          <h2 className="mt-1 text-lg font-display font-semibold text-text-primary sm:text-xl">
            {t("topAdsTitle")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-sm">
            {t("topAdsDescription")}
          </p>
        </div>
      </div>

      {rows.map((row, rowIndex) => (
        <FeaturedAdsScrollRow key={`featured-scroll-row-${rowIndex}`} cards={row} rowIndex={rowIndex} />
      ))}

      <div className="hidden gap-3 lg:grid">
        {rows.map((row, rowIndex) => (
          <div key={`featured-grid-row-${rowIndex}`} className="grid grid-cols-5 gap-3">
            {row.map((card, cardIndex) => (
              <FeaturedAdCard
                key={card.id}
                card={card}
                position={rowIndex * 5 + cardIndex + 1}
                sizes="(min-width: 1280px) 17vw, (min-width: 1024px) 18vw, 50vw"
                badgeLabel={t("featuredBadge")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
