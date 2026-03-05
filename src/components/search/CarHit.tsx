"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AlgoliaCarRecord } from "@/lib/algolia";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { formatPrice } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/shadcn/badge";
import { useSavedAd } from "@/hooks/useSavedAd";
import { SafeLink } from "@/components/SafeLink";
import { buildAdPath } from "@/lib/cars/ad-path";
import {
  HeartIcon,
  ArrowRightIcon,
  CameraIcon,
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBodyType = useTranslations("bodyType");
  const { saved, isSaving, toggleSaved } = useSavedAd(hit.objectID);
  const stopCardNavigation = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const isList = viewMode === "list";
  const galleryPhotos =
    hit.photos_json && hit.photos_json.length > 0
      ? hit.photos_json.slice(0, 4)
      : ["/placeholder-car.jpg"];
  const activePhoto = optimizeCloudflareImage(galleryPhotos[activePhotoIndex] || "/placeholder-car.jpg", {
    width: isList ? 640 : 960,
    height: isList ? 420 : 600,
    fit: "cover",
    quality: 82,
    format: "auto",
  });

  const cyclePhoto = (step: number) => {
    setImageLoaded(false);
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActivePhotoIndex(0);
      }}
    >
      <article
        className={cn(
          "flex h-full overflow-hidden rounded-xl border border-border-subtle bg-background-secondary transition-all duration-300",
          "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg",
          isList ? "flex-col sm:flex-row" : "flex-col",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-background-muted",
            isList ? "h-52 w-full shrink-0 sm:h-auto sm:w-72" : "aspect-[16/10]",
          )}
        >
          {!imageLoaded ? <div className="absolute inset-0 skeleton" /> : null}

          <Image
            src={activePhoto}
            alt={`${hit.brand} ${hit.model}`}
            fill
            loading={priorityImage ? "eager" : "lazy"}
            priority={priorityImage}
            className={cn(
              "object-cover transition-all duration-500",
              imageLoaded ? "opacity-100" : "opacity-0",
              isHovered && "scale-105",
            )}
            sizes={
              isList
                ? "(max-width: 640px) 100vw, 288px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            onLoad={() => setImageLoaded(true)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between">
            {hit.is_top_ad ? (
              <Badge className="bg-accent text-accent-foreground shadow-sm">
                Premium
              </Badge>
            ) : (
              <div />
            )}

            <button
              type="button"
              onPointerDown={stopCardNavigation}
              onClick={(event) => {
                stopCardNavigation(event);
                toggleSaved();
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200",
                "hover:scale-110 hover:bg-white",
                "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                saved && "text-error",
                isSaving && "cursor-not-allowed opacity-60",
              )}
              aria-label={saved ? tCar("removeFromSaved") : tCar("save")}
              disabled={isSaving}
            >
              <HeartIcon
                className={cn(
                  "h-4 w-4 text-text-secondary",
                  saved && "fill-current text-accent",
                )}
              />
            </button>
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  aria-label={tCar("previousPhoto")}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onPointerDown={stopCardNavigation}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    cyclePhoto(1);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  aria-label={tCar("nextPhoto")}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 backdrop-blur-sm">
                {galleryPhotos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onPointerDown={stopCardNavigation}
                    onClick={(event) => {
                      stopCardNavigation(event);
                      setImageLoaded(false);
                      setActivePhotoIndex(index);
                    }}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      activePhotoIndex === index ? "w-4 bg-white" : "bg-white/55",
                    )}
                    aria-label={tCar("showPhoto", { index: index + 1 })}
                  />
                ))}
              </div>
            </>
          ) : null}

          {(hit.photos_json?.length ?? 0) > 1 ? (
            <div className="absolute bottom-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <CameraIcon className="h-3 w-3" />
                {hit.photos_json?.length}
              </span>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "flex flex-1 flex-col p-4",
            isList && "sm:justify-between sm:p-5",
          )}
        >
          <div className="mb-3">
            <h3 className="line-clamp-1 text-base font-semibold leading-tight text-text-primary transition-colors group-hover:text-accent">
              {hit.brand} {hit.model}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 text-text-muted" />
                {hit.year}
              </span>
              <span className="h-3 w-px bg-border-subtle" />
              <span className="inline-flex items-center gap-1">
                <SpeedometerIcon className="h-3.5 w-3.5 text-text-muted" />
                {formatNumber(hit.mileage_km || 0, locale)} km
              </span>
              <span className="h-3 w-px bg-border-subtle" />
              <span>{tFuel(hit.fuel) || hit.fuel}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
              <span>
                {tTransmission(
                  hit.transmission.toLowerCase() as Parameters<typeof tTransmission>[0],
                ) || hit.transmission}
              </span>
              {hit.body_style ? <span className="h-3 w-px bg-border-subtle" /> : null}
              {hit.body_style ? (
                <span>
                  {tBodyType(
                    hit.body_style.toLowerCase() as Parameters<typeof tBodyType>[0],
                  ) || hit.body_style}
                </span>
              ) : null}
            </div>

            <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
              <LocationIcon className="h-3.5 w-3.5" />
              {hit.location_city || tCommon("slovakia")}
            </p>
          </div>

          <div
            className={cn(
              "mt-auto flex items-end justify-between border-t border-border-subtle pt-3",
              isList && "sm:pt-4",
            )}
          >
            <div className="flex min-h-[3rem] flex-col justify-end">
              <p className="text-xl font-bold tracking-tight text-text-primary tabular-nums">
                {formatPrice(hit.price_eur || 0)}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[10px] font-medium text-success",
                  !hit.is_vat_deductible && "invisible",
                )}
              >
                {tCar("vatDeductible")}
              </p>
            </div>

            <div
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200",
                "group-hover:-translate-y-0.5 group-hover:shadow-md",
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
