"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AlgoliaCarRecord } from "@/lib/algolia";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { formatPrice } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/shadcn/badge";
import { SafeLink } from "@/components/SafeLink";
import { buildAdPath } from "@/lib/cars/ad-path";
import {
  ArrowRightIcon,
  CameraIcon,
  CalendarIcon,
  SpeedometerIcon,
  LocationIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
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
  const [showSecondarySpecs, setShowSecondarySpecs] = useState(false);
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBodyType = useTranslations("bodyType");
  const stopCardNavigation = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const isList = viewMode === "list";
  const galleryPhotos =
    hit.photos_json && hit.photos_json.length > 0
      ? hit.photos_json.slice(0, 4)
      : ["/placeholder-car.jpg"];
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
  const hasSecondarySpecs = Boolean(transmissionLabel || bodyStyleLabel);

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
          "flex h-full overflow-hidden rounded-lg border border-border-subtle bg-background-secondary transition-[box-shadow,transform,border-color] duration-200",
          "group-hover:-translate-y-0.5 group-hover:border-border-strong group-hover:shadow-lg",
          isList ? "flex-col sm:flex-row" : "flex-row sm:flex-col",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-background-muted",
            isList ? "h-52 w-full shrink-0 sm:h-auto sm:w-72" : "w-[50%] sm:w-auto sm:aspect-[16/10] shrink-0",
          )}
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
              <Badge className="bg-mint text-text-primary border border-mint-subtle font-black tracking-wide text-[9px] px-1.5 py-0.5 rounded-sm shadow-none">
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
                  className="flex h-3 w-3 items-center justify-center rounded-full bg-mint/90 text-primary shadow-sm transition-colors hover:bg-mint"
                  aria-label={tCar("previousPhoto")}
                >
                  <ChevronLeftIcon className="h-2 w-2" />
                </button>
                <button
                  type="button"
                  onPointerDown={stopCardNavigation}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    cyclePhoto(1);
                  }}
                  className="flex h-3 w-3 items-center justify-center rounded-full bg-mint/90 text-primary shadow-sm transition-colors hover:bg-mint"
                  aria-label={tCar("nextPhoto")}
                >
                  <ChevronRightIcon className="h-2 w-2" />
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
            "flex flex-1 flex-col p-1.5 sm:p-4",
            isList && "sm:justify-between",
          )}
        >
          <div className="mb-1.5 sm:mb-2.5">
            <h3 className="line-clamp-2 text-sm sm:text-lg font-bold leading-tight text-text-primary">
              {hit.brand} {hit.model}
            </h3>

            <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-x-1.5 sm:gap-x-3 gap-y-1 text-[11px] sm:text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="hidden sm:block h-3.5 w-3.5 text-text-muted" />
                {hit.year}
              </span>
              <span className="h-2.5 sm:h-3 w-px bg-border-subtle" />
              <span className="inline-flex items-center gap-1">
                <SpeedometerIcon className="hidden sm:block h-3.5 w-3.5 text-text-muted" />
                {formatNumber(hit.mileage_km || 0, locale)} km
              </span>
              <span className="h-2.5 sm:h-3 w-px bg-border-subtle" />
              <span>{tFuel(hit.fuel) || hit.fuel}</span>
              {transmissionLabel ? (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 sm:h-3 w-px bg-border-subtle" />
                  <span>{transmissionLabel}</span>
                </span>
              ) : null}
              {hit.power_kw ? (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 sm:h-3 w-px bg-border-subtle" />
                  <span>{`${hit.power_kw} kW`}</span>
                </span>
              ) : null}
            </div>

            <p className="mt-2 hidden sm:flex items-center gap-1.5 text-sm text-text-secondary">
              <LocationIcon className="h-3.5 w-3.5" />
              {hit.location_city || tCommon("slovakia")}
            </p>

            {hasSecondarySpecs ? (
              <div className="mt-3 hidden sm:block">
                <button
                  type="button"
                  onPointerDown={stopCardNavigation}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    setShowSecondarySpecs((value) => !value);
                  }}
                  aria-expanded={showSecondarySpecs}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
                >
                  <span>{showSecondarySpecs ? tCommon("back") : tCommon("learnMore")}</span>
                  <ChevronDownIcon
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      showSecondarySpecs && "rotate-180",
                    )}
                  />
                </button>

                {showSecondarySpecs ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                    {transmissionLabel ? (
                      <span className="rounded-full border border-border-subtle bg-background px-2.5 py-1 font-medium">
                        {transmissionLabel}
                      </span>
                    ) : null}
                    {bodyStyleLabel ? (
                      <span className="rounded-full border border-border-subtle bg-background px-2.5 py-1 font-medium">
                        {bodyStyleLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "mt-auto flex items-end justify-between border-t border-border-subtle pt-2 sm:pt-3",
              isList && "sm:pt-4",
            )}
          >
            <div className="flex sm:min-h-[2.5rem] flex-col justify-end">
              <p className="text-base sm:text-2xl font-black tracking-tight text-text-primary tabular-nums">
                {formatPrice(hit.price_eur || 0)} &euro;
              </p>
              <p
                className={cn(
                  "hidden sm:block mt-1 text-[11px] font-semibold text-success",
                  !hit.is_vat_deductible && "invisible",
                )}
              >
                {tCar("vatDeductible")}
              </p>
            </div>

            <div
              className={cn(
                "hidden sm:inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors group-hover:bg-accent-hover",
              )}
            >
              <span>{tCar("viewDetail")}</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
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
