"use client";

import { type ReactNode, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AlgoliaCarRecord } from "@/lib/algolia";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { formatPrice } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/shadcn/badge";
import { SafeLink } from "@/components/SafeLink";
import { buildAdPath } from "@/lib/cars/ad-path";
import { getListingFallbackGallery } from "@/lib/cars/fallback-images";
import {
  CalendarIcon,
  SpeedometerIcon,
  LocationIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/Icons";

function FuelSpecIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 4h2a2 2 0 012 2v12a2 2 0 01-2 2h-6a2 2 0 01-2-2V6a2 2 0 012-2h2m2 0V3m0 1v1m-4 5h4m-6 4h8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 7h1.5l1.5 2.5V14"
      />
    </svg>
  );
}

function GearSpecIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317a1 1 0 011.35-.936l1.05.455a1 1 0 00.792 0l1.05-.455a1 1 0 011.35.936l.11 1.138a1 1 0 00.57.812l.957.53a1 1 0 01.398 1.358l-.57.992a1 1 0 000 .992l.57.992a1 1 0 01-.398 1.357l-.958.53a1 1 0 00-.569.813l-.11 1.137a1 1 0 01-1.35.936l-1.05-.455a1 1 0 00-.792 0l-1.05.455a1 1 0 01-1.35-.936l-.11-1.137a1 1 0 00-.57-.813l-.957-.53a1 1 0 01-.398-1.357l.57-.992a1 1 0 000-.992l-.57-.992a1 1 0 01.398-1.358l.958-.53a1 1 0 00.569-.812l.11-1.138z"
      />
      <circle cx="12" cy="12" r="2.5" strokeWidth={2} />
    </svg>
  );
}

function BoltSpecIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 2L6 13h5l-1 9 7-11h-5l1-9z"
      />
    </svg>
  );
}

function BodySpecIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 14l2-4h14l2 4M5 14v3m14-3v3M4 17h16M7 10l2-3h6l2 3"
      />
      <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface CarHitProps {
  hit: AlgoliaCarRecord;
  viewMode?: "grid" | "list";
  preloadImage?: boolean;
}

export function CarHit({
  hit,
  viewMode = "grid",
  preloadImage = false,
}: CarHitProps) {
  const locale = useLocale();
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
  const galleryPhotos =
    hit.photos_json && hit.photos_json.length > 0
      ? hit.photos_json.slice(0, 4)
      : getListingFallbackGallery(hit.objectID);
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
  const primarySpecs = [
    {
      key: "year",
      icon: <CalendarIcon className="h-3 w-3 text-text-muted sm:h-3.5 sm:w-3.5" />,
      label: String(hit.year),
    },
    {
      key: "mileage",
      icon: <SpeedometerIcon className="h-3 w-3 text-text-muted sm:h-3.5 sm:w-3.5" />,
      label: `${formatNumber(hit.mileage_km || 0, locale)} km`,
    },
  ];
  const technicalSpecs: SpecItem[] = [
    {
      key: "fuel",
      label: tFuel(hit.fuel) || hit.fuel,
      icon: <FuelSpecIcon className="h-3 w-3 text-text-muted sm:h-3.5 sm:w-3.5" />,
    },
  ];

  if (transmissionLabel) {
    technicalSpecs.push({
      key: "transmission",
      label: transmissionLabel,
      icon: <GearSpecIcon className="h-3 w-3 text-text-muted sm:h-3.5 sm:w-3.5" />,
    });
  }

  if (hit.power_kw) {
    technicalSpecs.push({
      key: "power",
      label: `${hit.power_kw} kW`,
      icon: <BoltSpecIcon className="h-3 w-3 text-text-muted sm:h-3.5 sm:w-3.5" />,
    });
  }
  const technicalSpecColumns =
    technicalSpecs.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
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
      href={buildAdPath({
        id: hit.objectID,
        brand: hit.brand,
        model: hit.model,
        year: hit.year,
      })}
      className="group block h-full"
    >
      <article
        className={cn(
          "flex h-full overflow-hidden rounded-[1.5rem] border border-border-subtle bg-background-secondary transition-[box-shadow,border-color] duration-200",
          "group-hover:border-border-strong group-hover:shadow-xl",
          hit.is_highlighted && "border-warning/35 bg-warning/5 ring-1 ring-warning/20",
          isList ? "flex-col sm:flex-row" : "flex-row sm:flex-col",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-background-muted",
            isList
              ? "h-52 w-full shrink-0 sm:h-auto sm:w-72"
              : "w-2/5 shrink-0 rounded-l-[1.5rem] sm:h-auto sm:w-auto sm:rounded-none sm:aspect-[16/10]",
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
              const shouldPreloadImage = isFirstVisiblePhoto && preloadImage;
              
              const optimizedSrc = optimizeCloudflareImage(photoUrl || "/placeholder-car.jpg", {
                width: isList ? 960 : 720,
                height: isList ? 640 : 960,
                fit: "cover",
                quality: 88,
                format: "auto",
              });

              return (
                <div key={`${photoUrl}-${index}`} className="relative h-full w-full shrink-0">
                  <Image
                    src={optimizedSrc}
                    alt={`${hit.brand} ${hit.model} - foto ${index + 1}`}
                    fill
                    fetchPriority={shouldPreloadImage ? "high" : undefined}
                    loading={shouldPreloadImage ? "eager" : "lazy"}
                    preload={shouldPreloadImage}
                    priority={shouldPreloadImage}
                    className="object-cover"
                    sizes={
                      isList
                        ? "(max-width: 640px) 100vw, 288px"
                        : "(max-width: 640px) 40vw, (max-width: 1024px) 50vw, 33vw"
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="absolute left-2 right-2 top-2 z-10 flex items-start justify-between">
            <div className="flex flex-wrap gap-1.5">
              {hit.is_top_ad ? (
                <Badge className="border-0 bg-mint text-text-primary font-black tracking-wide text-[9px] px-1.5 py-0.5 rounded-sm shadow-none ring-0">
                  Exclusive
                </Badge>
              ) : hit.promotion_tier === "premium" || hit.is_highlighted ? (
                <Badge className="border-0 bg-warning text-primary font-black tracking-wide text-[9px] px-1.5 py-0.5 rounded-sm shadow-none ring-0">
                  Premium
                </Badge>
              ) : null}
            </div>
          </div>

          {galleryPhotos.length > 1 ? (
            <>
              <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-between px-2">
                <button
                  type="button"
                  onPointerDown={stopCardNavigation}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    cyclePhoto(-1);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  aria-label={tCar("previousPhoto")}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint/92 text-primary shadow-md transition-colors hover:bg-mint/92">
                    <ChevronLeftIcon className="h-3 w-3" />
                  </span>
                </button>
                <button
                  type="button"
                  onPointerDown={stopCardNavigation}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    cyclePhoto(1);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  aria-label={tCar("nextPhoto")}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint/92 text-primary shadow-md transition-colors hover:bg-mint/92">
                    <ChevronRightIcon className="h-3 w-3" />
                  </span>
                </button>
              </div>
              <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5 backdrop-blur-sm">
                {galleryPhotos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onPointerDown={stopCardNavigation}
                    onClick={(event) => {
                      stopCardNavigation(event);
                      setActivePhotoIndex(index);
                    }}
                    className={cn(
                      "h-1 w-1 rounded-full transition-all",
                      activePhotoIndex === index ? "w-2.5 bg-white" : "bg-white/55",
                    )}
                    aria-label={tCar("showPhoto", { index: index + 1 })}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div
          className={cn(
            "flex flex-1 flex-col p-1.25 sm:p-3.5",
            isList && "sm:justify-between",
          )}
        >
          <div className="mb-0.5 sm:mb-2">
            <h3 className="line-clamp-1 text-[13px] font-bold leading-tight text-text-primary sm:line-clamp-2 sm:text-base">
              {hit.brand} {hit.model}
            </h3>

            <div className="mt-0.75 rounded-[1.15rem] border border-border-subtle/80 bg-gradient-to-br from-background-secondary via-background-secondary to-background-muted/80 p-1.25 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:mt-2 sm:rounded-2xl sm:p-2.5">
              <SpecGrid className="grid-cols-2" items={primarySpecs} />
              {technicalSpecs.length > 0 ? (
                <SpecGrid
                  className={cn("mt-0.75 grid-cols-2", technicalSpecColumns)}
                  items={technicalSpecs}
                  tone="accent"
                />
              ) : null}
              <div className="mt-0.75 flex flex-wrap items-center gap-1 text-[9px] text-text-secondary sm:mt-1.5 sm:gap-1.5 sm:text-[13px]">
                <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-background-secondary/90 px-2 py-0.5 shadow-sm ring-1 ring-border-subtle/70 sm:gap-1.5 sm:px-2.5 sm:py-1">
                  <LocationIcon className="h-3 w-3 text-text-muted sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">{hit.location_city || tCommon("slovakia")}</span>
                </span>
                {bodyStyleLabel ? (
                  <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-background-secondary/90 px-2 py-0.5 font-medium text-text-primary shadow-sm ring-1 ring-border-subtle/70 sm:px-2.5 sm:py-1">
                    <BodySpecIcon className="h-3 w-3 text-text-muted sm:h-3.5 sm:w-3.5" />
                    <span className="truncate">{bodyStyleLabel}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "mt-auto flex items-end justify-between border-t border-border-subtle pt-1",
              isList && "sm:pt-3",
            )}
          >
            <div className="flex sm:min-h-[2.5rem] flex-col justify-end">
              <p className="text-[1rem] font-black tracking-tight text-text-primary tabular-nums sm:text-xl">
                {formatPrice(hit.price_eur || 0)} &euro;
              </p>
              <p
                className={cn(
                  "mt-0.5 hidden text-[11px] font-semibold text-success sm:block",
                  !hit.is_vat_deductible && "invisible",
                )}
              >
                {tCar("vatDeductible")}
              </p>
            </div>
          </div>
        </div>
      </article>
    </SafeLink>
  );
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

interface SpecItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

function SpecGrid({
  items,
  className,
  tone = "default",
}: {
  items: SpecItem[];
  className?: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "grid gap-1",
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            "inline-flex min-w-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] shadow-sm ring-1 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[13px]",
            tone === "accent"
              ? "bg-mint/15 font-medium text-text-primary ring-mint/30"
              : "bg-background-secondary/90 text-text-secondary ring-border-subtle/70",
          )}
        >
          {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
          <span className="truncate">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
