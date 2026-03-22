"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
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

interface CarHitProps {
  hit: AlgoliaCarRecord;
  viewMode?: "grid" | "list";
  priorityImage?: boolean;
}

export function CarHit({
  hit,
  viewMode = "grid",
  priorityImage = false,
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
      icon: <CalendarIcon className="hidden h-3.5 w-3.5 text-text-muted sm:block" />,
      label: String(hit.year),
    },
    {
      key: "mileage",
      icon: <SpeedometerIcon className="hidden h-3.5 w-3.5 text-text-muted sm:block" />,
      label: `${formatNumber(hit.mileage_km || 0, locale)} km`,
    },
  ];
  const technicalSpecs = [
    { key: "fuel", label: tFuel(hit.fuel) || hit.fuel },
    transmissionLabel ? { key: "transmission", label: transmissionLabel } : null,
    hit.power_kw ? { key: "power", label: `${hit.power_kw} kW` } : null,
  ].filter((spec): spec is { key: string; label: string } => Boolean(spec));
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

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [hit.objectID]);

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

  const handleGalleryPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (galleryPhotos.length < 2 || event.pointerType === "mouse") {
      return;
    }

    galleryGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      swiping: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGalleryPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = galleryGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    gesture.deltaX = event.clientX - gesture.startX;
    gesture.deltaY = event.clientY - gesture.startY;

    if (
      !gesture.swiping &&
      Math.abs(gesture.deltaX) > 12 &&
      Math.abs(gesture.deltaX) > Math.abs(gesture.deltaY)
    ) {
      gesture.swiping = true;
      galleryPreventClickRef.current = true;
    }
  };

  const handleGalleryPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = galleryGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    if (gesture.swiping && Math.abs(gesture.deltaX) >= 44) {
      cyclePhoto(gesture.deltaX > 0 ? -1 : 1);
    }

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
          "flex h-full overflow-hidden rounded-lg border border-border-subtle bg-background-secondary transition-[box-shadow,border-color] duration-200",
          "group-hover:border-border-strong group-hover:shadow-xl",
          isList ? "flex-col sm:flex-row" : "flex-row sm:flex-col",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-background-muted",
            isList ? "h-52 w-full shrink-0 sm:h-auto sm:w-72" : "w-[46%] shrink-0 sm:w-auto sm:aspect-[16/10]",
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
          style={{ touchAction: galleryPhotos.length > 1 ? "pan-y" : "auto" }}
        >
          <div
            className="flex h-full w-full will-change-transform"
            style={{ 
              transform: `translate3d(-${activePhotoIndex * 100}%, 0px, 0px)`,
              transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
            }}
          >
            {galleryPhotos.map((photoUrl, index) => {
              const isFirst = index === 0;
              const isPriority = isFirst && priorityImage;
              
              const optimizedSrc = optimizeCloudflareImage(photoUrl || "/placeholder-car.jpg", {
                width: isList ? 640 : 960,
                height: isList ? 420 : 600,
                fit: "cover",
                quality: 82,
                format: "auto",
              });

              return (
                <div key={`${photoUrl}-${index}`} className="relative h-full w-full shrink-0">
                  <Image
                    src={optimizedSrc}
                    alt={`${hit.brand} ${hit.model} - foto ${index + 1}`}
                    fill
                    fetchPriority={isPriority ? "high" : undefined}
                    loading={isPriority ? "eager" : "lazy"}
                    priority={isPriority}
                    className="object-cover"
                    sizes={
                      isList
                        ? "(max-width: 640px) 100vw, 288px"
                        : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="absolute left-2 right-2 top-2 z-10 flex items-start justify-between">
            {hit.is_top_ad ? (
              <Badge className="border-0 bg-mint text-text-primary font-black tracking-wide text-[9px] px-1.5 py-0.5 rounded-sm shadow-none ring-0">
                Premium
              </Badge>
            ) : null}
          </div>

          {galleryPhotos.length > 1 ? (
            <>
              <div className="absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-3">
                <button
                  type="button"
                  onPointerDown={stopCardNavigation}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    cyclePhoto(-1);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  aria-label={tCar("previousPhoto")}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint/90 text-primary shadow-md transition-colors hover:bg-mint/90">
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                  </span>
                </button>
                <button
                  type="button"
                  onPointerDown={stopCardNavigation}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    cyclePhoto(1);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  aria-label={tCar("nextPhoto")}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint/90 text-primary shadow-md transition-colors hover:bg-mint/90">
                    <ChevronRightIcon className="h-3.5 w-3.5" />
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
            "flex flex-1 flex-col p-2.5 sm:p-3.5",
            isList && "sm:justify-between",
          )}
        >
          <div className="mb-1.5 sm:mb-2">
            <h3 className="line-clamp-2 text-sm font-bold leading-tight text-text-primary sm:text-base">
              {hit.brand} {hit.model}
            </h3>

            <div className="mt-2 rounded-2xl border border-border-subtle/80 bg-gradient-to-br from-background-secondary via-background-secondary to-background-muted/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:p-2.5">
              <SpecGrid className="grid-cols-2" items={primarySpecs} />
              {technicalSpecs.length > 0 ? (
                <SpecGrid
                  className={cn("mt-1.5 grid-cols-2", technicalSpecColumns)}
                  items={technicalSpecs}
                  tone="accent"
                />
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-text-secondary sm:text-[13px]">
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-background-secondary/90 px-2.5 py-1 shadow-sm ring-1 ring-border-subtle/70">
                  <LocationIcon className="h-3.5 w-3.5 text-text-muted" />
                  <span className="truncate">{hit.location_city || tCommon("slovakia")}</span>
                </span>
                {bodyStyleLabel ? (
                  <span className="inline-flex min-w-0 items-center rounded-full bg-background-secondary/90 px-2.5 py-1 font-medium text-text-primary shadow-sm ring-1 ring-border-subtle/70">
                    <span className="truncate">{bodyStyleLabel}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "mt-auto flex items-end justify-between border-t border-border-subtle pt-2.5",
              isList && "sm:pt-3",
            )}
          >
            <div className="flex sm:min-h-[2.5rem] flex-col justify-end">
              <p className="text-base font-black tracking-tight text-text-primary tabular-nums sm:text-xl">
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
        "grid gap-1.5",
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            "inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] shadow-sm ring-1 sm:text-[13px]",
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
