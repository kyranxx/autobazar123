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
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-mint/90 text-primary shadow-md transition-colors hover:bg-mint/90"
                  aria-label={tCar("previousPhoto")}
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onPointerDown={stopCardNavigation}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    cyclePhoto(1);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-mint/90 text-primary shadow-md transition-colors hover:bg-mint/90"
                  aria-label={tCar("nextPhoto")}
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
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

            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-text-secondary sm:text-[13px]">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="hidden h-3.5 w-3.5 text-text-muted sm:block" />
                {hit.year}
              </span>
              <span className="h-2.5 w-px bg-border-subtle sm:h-3" />
              <span className="inline-flex items-center gap-1">
                <SpeedometerIcon className="hidden h-3.5 w-3.5 text-text-muted sm:block" />
                {formatNumber(hit.mileage_km || 0, locale)} km
              </span>
              <span className="h-2.5 w-px bg-border-subtle sm:h-3" />
              <span>{tFuel(hit.fuel) || hit.fuel}</span>
              {transmissionLabel ? (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-px bg-border-subtle sm:h-3" />
                  <span>{transmissionLabel}</span>
                </span>
              ) : null}
              {hit.power_kw ? (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-px bg-border-subtle sm:h-3" />
                  <span>{`${hit.power_kw} kW`}</span>
                </span>
              ) : null}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-text-secondary sm:text-[13px]">
              <LocationIcon className="h-3.5 w-3.5" />
              <span>{hit.location_city || tCommon("slovakia")}</span>
              {bodyStyleLabel ? (
                <>
                  <span className="h-2.5 w-px bg-border-subtle sm:h-3" />
                  <span>{bodyStyleLabel}</span>
                </>
              ) : null}
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
