"use client";

import { type ReactNode, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMarketCode } from "@/context/MarketContext";
import { AlgoliaCarRecord } from "@/lib/algolia";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { formatPrice } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/shadcn/badge";
import { SafeLink } from "@/components/SafeLink";
import { buildAdPath } from "@/lib/cars/ad-path";
import { getMarketPath } from "@/lib/routes";
import { getListingFallbackGallery } from "@/lib/cars/fallback-images";
import {
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Cog,
  Fuel,
  Gauge,
  MapPin,
  Zap,
} from "lucide-react";

interface CarHitProps {
  hit: AlgoliaCarRecord;
  viewMode?: "grid" | "list";
  preloadImage?: boolean;
  eagerPhotoUrls?: ReadonlySet<string>;
}

export function CarHit({
  hit,
  viewMode = "grid",
  preloadImage = false,
  eagerPhotoUrls,
}: CarHitProps) {
  const locale = useLocale();
  const marketCode = useMarketCode();
  const localeTag = locale;
  const tCar = useTranslations("car");
  const tCommon = useTranslations("common");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBodyType = useTranslations("bodyType");
  const galleryGestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    deltaX: number;
    deltaY: number;
    swiping: boolean;
  } | null>(null);
  const galleryPreventClickRef = useRef(false);
  const stopCardNavigation = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const isList = viewMode === "list";
  const galleryPhotos = getCarHitGalleryPhotos(hit);
  const transmissionLabel = hit.transmission
    ? tTransmission(
        hit.transmission.toLowerCase() as Parameters<typeof tTransmission>[0],
      ) || hit.transmission
    : null;
  const bodyStyleLabel = hit.body_style
    ? tBodyType(
        hit.body_style.toLowerCase() as Parameters<typeof tBodyType>[0],
      ) || hit.body_style
    : null;
  const primarySpecs = buildCarHitPrimarySpecs(hit, localeTag);
  const technicalSpecs: SpecItem[] = [
    {
      key: "fuel",
      label: tFuel(hit.fuel) || hit.fuel,
      icon: <Fuel className="size-3 text-text-muted sm:size-3.5" />,
    },
  ];

  if (transmissionLabel) {
    technicalSpecs.push({
      key: "transmission",
      label: transmissionLabel,
      icon: <Cog className="size-3 text-text-muted sm:size-3.5" />,
    });
  }

  if (hit.power_kw) {
    technicalSpecs.push({
      key: "power",
      label: `${hit.power_kw} kW`,
      icon: <Zap className="size-3 text-text-muted sm:size-3.5" />,
    });
  }
  const cyclePhoto = (step: number) => {
    setActivePhotoIndex((currentIndex) => {
      const nextIndex = currentIndex + step;
      if (nextIndex < 0) {
        return galleryPhotos.length - 1;
      }
      if (nextIndex >= galleryPhotos.length) {
        return 0;
      }
      return nextIndex;
    });
  };

  const clearGalleryGesture = (
    event?: React.PointerEvent<HTMLDivElement>,
    keepPreventedClick = false,
  ) => {
    const gallery = event?.currentTarget;
    const pointerId = galleryGestureRef.current?.pointerId;

    if (
      gallery &&
      typeof pointerId === "number" &&
      gallery.hasPointerCapture(pointerId)
    ) {
      gallery.releasePointerCapture(pointerId);
    }

    galleryGestureRef.current = null;

    if (!keepPreventedClick) {
      window.setTimeout(() => {
        galleryPreventClickRef.current = false;
      }, 0);
    }
  };

  const startGalleryGesture = (
    pointerId: number,
    startX: number,
    startY: number,
  ) => {
    galleryGestureRef.current = {
      pointerId,
      startX,
      startY,
      deltaX: 0,
      deltaY: 0,
      swiping: false,
    };
  };

  const updateGalleryGesture = (clientX: number, clientY: number) => {
    const gesture = galleryGestureRef.current;
    if (!gesture) {
      return false;
    }

    gesture.deltaX = clientX - gesture.startX;
    gesture.deltaY = clientY - gesture.startY;

    if (
      !gesture.swiping &&
      Math.abs(gesture.deltaX) > 12 &&
      Math.abs(gesture.deltaX) > Math.abs(gesture.deltaY)
    ) {
      gesture.swiping = true;
      galleryPreventClickRef.current = true;
    }

    return gesture.swiping;
  };

  const completeGalleryGesture = () => {
    const gesture = galleryGestureRef.current;
    if (!gesture) {
      return;
    }

    if (gesture.swiping && Math.abs(gesture.deltaX) >= 44) {
      cyclePhoto(gesture.deltaX > 0 ? -1 : 1);
    }
  };

  const handleGalleryPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (galleryPhotos.length < 2 || event.button !== 0) {
      return;
    }

    startGalleryGesture(event.pointerId, event.clientX, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGalleryPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = galleryGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    updateGalleryGesture(event.clientX, event.clientY);
  };

  const handleGalleryPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = galleryGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    completeGalleryGesture();
    clearGalleryGesture(event);
  };

  return (
    <SafeLink
      href={getMarketPath(buildAdPath({
        id: hit.objectID,
        brand: hit.brand,
        model: hit.model,
        year: hit.year,
      }), marketCode)}
      className="group block h-full"
    >
      <article
        className={cn(
          "market-card relative flex h-full overflow-hidden rounded-[20px] border border-border-strong bg-white transition-[box-shadow,border-color,transform] duration-200",
          "group-hover:-translate-y-0.5 group-hover:border-accent/45 group-hover:shadow-lg",
          hit.is_highlighted && "border-accent/45 bg-accent-subtle ring-1 ring-accent/20",
          isList ? "flex-col md:flex-row" : "flex-col",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-background-muted",
            isList
              ? "aspect-[16/10] w-full shrink-0 md:min-h-[300px] md:w-[42%] md:max-w-[430px] md:aspect-auto"
              : "aspect-[16/9] w-full shrink-0",
          )}
          onPointerDown={handleGalleryPointerDown}
          onPointerMove={handleGalleryPointerMove}
          onPointerUp={handleGalleryPointerUp}
          onPointerCancel={(event) => clearGalleryGesture(event)}
          onClickCapture={(event) => {
            if (!galleryPreventClickRef.current) {
              return;
            }

            stopCardNavigation(event);
            galleryPreventClickRef.current = false;
          }}
          style={{ touchAction: galleryPhotos.length > 1 ? "pan-y pinch-zoom" : "auto" }}
        >
          <div
            className="flex h-full min-h-full w-full"
            style={{ 
              transform: `translate3d(-${activePhotoIndex * 100}%, 0px, 0px)`,
              transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
            }}
          >
            {galleryPhotos.map((photoUrl, index) => {
              const isFirstVisiblePhoto = index === activePhotoIndex;
              const shouldPrioritizeImage = isFirstVisiblePhoto && preloadImage;
              const shouldLoadEagerly =
                shouldPrioritizeImage || Boolean(eagerPhotoUrls?.has(photoUrl));
              
              const optimizedSrc = optimizeCloudflareImage(photoUrl || "/placeholder-car.jpg", {
                width: 960,
                height: 600,
                fit: "cover",
                quality: 88,
                format: "auto",
              });

              return (
                <div
                  key={`${hit.objectID}-photo-${index}-${photoUrl}`}
                  className="relative size-full shrink-0"
                >
                  <Image
                    src={optimizedSrc}
                    alt={`${hit.brand} ${hit.model} - foto ${index + 1}`}
                    fill
                    fetchPriority={shouldPrioritizeImage ? "high" : undefined}
                    loading={shouldLoadEagerly ? "eager" : "lazy"}
                    className="object-cover"
                    sizes={
                      isList
                        ? "(max-width: 767px) 100vw, (max-width: 1280px) 42vw, 430px"
                        : "(max-width: 639px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="absolute left-2 right-2 top-2 z-10 flex items-start justify-between">
            <div className="flex flex-wrap gap-1.5">
              {hit.is_top_ad ? (
                <Badge className="border border-accent bg-accent px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[var(--color-accent-foreground)] shadow-md ring-0">
                  Top Ninja
                </Badge>
              ) : hit.promotion_tier === "premium" || hit.is_highlighted ? (
                <Badge className="border border-accent/70 bg-background-dark/92 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-md ring-0">
                  Premium
                </Badge>
              ) : null}
            </div>
          </div>

          {galleryPhotos.length > 1 ? (
            <CarHitGalleryControls
              photos={galleryPhotos}
              activePhotoIndex={activePhotoIndex}
              onCyclePhoto={cyclePhoto}
              onSelectPhoto={setActivePhotoIndex}
              onStopCardNavigation={stopCardNavigation}
              previousPhotoLabel={tCar("previousPhoto")}
              nextPhotoLabel={tCar("nextPhoto")}
              getShowPhotoLabel={(index) => tCar("showPhoto", { index })}
            />
          ) : null}
        </div>

        <CarHitDetails
          hit={hit}
          isList={isList}
          primarySpecs={primarySpecs}
          technicalSpecs={technicalSpecs}
          bodyStyleLabel={bodyStyleLabel}
          locationLabel={hit.location_city || tCommon("slovakia")}
          vatDeductibleLabel={tCar("vatDeductible")}
          localeTag={localeTag}
        />
      </article>
    </SafeLink>
  );
}

function CarHitGalleryControls({
  photos,
  activePhotoIndex,
  onCyclePhoto,
  onSelectPhoto,
  onStopCardNavigation,
  previousPhotoLabel,
  nextPhotoLabel,
  getShowPhotoLabel,
}: {
  photos: string[];
  activePhotoIndex: number;
  onCyclePhoto: (step: number) => void;
  onSelectPhoto: (index: number) => void;
  onStopCardNavigation: (event: React.SyntheticEvent) => void;
  previousPhotoLabel: string;
  nextPhotoLabel: string;
  getShowPhotoLabel: (index: number) => string;
}) {
  return (
    <>
      <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-between px-2">
        <button
          type="button"
          onPointerDown={onStopCardNavigation}
          onClick={(event) => {
            onStopCardNavigation(event);
            onCyclePhoto(-1);
          }}
          className="flex size-8 items-center justify-center rounded-full"
          aria-label={previousPhotoLabel}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-mint/92 text-primary shadow-md transition-colors hover:bg-mint/92">
            <ChevronLeft className="size-3" />
          </span>
        </button>
        <button
          type="button"
          onPointerDown={onStopCardNavigation}
          onClick={(event) => {
            onStopCardNavigation(event);
            onCyclePhoto(1);
          }}
          className="flex size-8 items-center justify-center rounded-full"
          aria-label={nextPhotoLabel}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-mint/92 text-primary shadow-md transition-colors hover:bg-mint/92">
            <ChevronRight className="size-3" />
          </span>
        </button>
      </div>
      <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5 backdrop-blur-sm">
        {photos.map((photo, index) => (
          <button
            key={`photo-dot-${index}-${photo}`}
            type="button"
            onPointerDown={onStopCardNavigation}
            onClick={(event) => {
              onStopCardNavigation(event);
              onSelectPhoto(index);
            }}
            className={cn(
              "size-1 rounded-full transition-all",
              activePhotoIndex === index ? "w-2.5 bg-white" : "bg-white/55",
            )}
            aria-label={getShowPhotoLabel(index + 1)}
          />
        ))}
      </div>
    </>
  );
}

function CarHitDetails({
  hit,
  isList,
  primarySpecs,
  technicalSpecs,
  bodyStyleLabel,
  locationLabel,
  vatDeductibleLabel,
  localeTag,
}: {
  hit: AlgoliaCarRecord;
  isList: boolean;
  primarySpecs: SpecItem[];
  technicalSpecs: SpecItem[];
  bodyStyleLabel: string | null;
  locationLabel: string;
  vatDeductibleLabel: string;
  localeTag: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5",
        isList && "md:min-h-[300px] md:justify-between lg:px-6 lg:py-6",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-[-0.025em] text-text-primary md:text-2xl">
            {hit.brand} {hit.model}
          </h3>
          <p className="shrink-0 text-2xl font-black leading-none tracking-[-0.035em] text-text-primary tabular-nums md:text-[2rem]">
            {formatPrice(hit.price_eur || 0, localeTag)} &euro;
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          <SpecGrid className="grid-cols-2" items={primarySpecs} />
          {technicalSpecs.length > 0 ? <SpecGrid className="grid-cols-2 lg:grid-cols-3" items={technicalSpecs} /> : null}
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-3 text-sm font-semibold text-text-secondary">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3 text-text-muted sm:size-3.5" />
              <span className="truncate">{locationLabel}</span>
            </span>
            {bodyStyleLabel ? (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-text-secondary">
                <CarFront className="size-3 text-text-muted sm:size-3.5" />
                <span className="truncate">{bodyStyleLabel}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <p
        className={cn(
          "mt-3 min-h-5 text-sm font-bold text-success",
          !hit.is_vat_deductible && "invisible",
        )}
      >
        {vatDeductibleLabel}
      </p>
    </div>
  );
}

function formatNumber(value: number, locale: string): string {
  return value.toLocaleString(locale);
}

function getCarHitGalleryPhotos(hit: AlgoliaCarRecord): string[] {
  return hit.photos_json && hit.photos_json.length > 0
    ? hit.photos_json.slice(0, 4)
    : getListingFallbackGallery(hit.objectID);
}

interface SpecItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

function buildCarHitPrimarySpecs(hit: AlgoliaCarRecord, locale: string): SpecItem[] {
  return [
    {
      key: "year",
      icon: <CalendarDays className="size-3 text-text-muted sm:size-3.5" />,
      label: String(hit.year),
    },
    {
      key: "mileage",
      icon: <Gauge className="size-3 text-text-muted sm:size-3.5" />,
      label: `${formatNumber(hit.mileage_km || 0, locale)} km`,
    },
  ];
}

function SpecGrid({
  items,
  className,
}: {
  items: SpecItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-2",
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            "inline-flex min-w-0 items-center gap-2 rounded-lg bg-background-muted px-3 py-2 text-sm font-semibold text-text-secondary",
          )}
        >
          {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
          <span className="truncate">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
