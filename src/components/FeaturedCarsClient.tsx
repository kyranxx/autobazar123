"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { FeaturedCar } from "@/lib/supabase/cached";
import { StarIcon, MapPinIcon, HeartIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";
import { useSavedAd } from "@/hooks/useSavedAd";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { buildAdPath } from "@/lib/cars/ad-path";

interface FeaturedCarsClientProps {
  cars: FeaturedCar[];
}

export default function FeaturedCarsClient({ cars }: FeaturedCarsClientProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cars.map((car, index) => (
        <FeaturedCarItem key={car.id} car={car} index={index} />
      ))}
    </div>
  );
}

function FeaturedCarItem({ car, index }: { car: FeaturedCar; index: number }) {
  const { saved, isSaving, toggleSaved } = useSavedAd(car.id);
  const locale = useLocale();
  const tFeatured = useTranslations("featuredCars");
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tCommon = useTranslations("common");

  const stopCardNavigation = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const fuelLabel =
    {
      petrol: tFuel("petrol"),
      diesel: tFuel("diesel"),
      electric: tFuel("electric"),
      hybrid: tFuel("hybrid"),
      lpg: tFuel("lpg"),
      cng: tFuel("cng"),
    }[car.fuel.toLowerCase()] ?? car.fuel;

  const transmissionLabel =
    {
      manual: tTransmission("manual"),
      automatic: tTransmission("automatic"),
    }[car.transmission.toLowerCase()] ?? car.transmission;

  return (
    <Link
      href={buildAdPath({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
      })}
      className={cn(
        "group animate-fade-in-up overflow-hidden rounded-xl border bg-white/90 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
        car.isTopAd ? "border-accent/25 ring-1 ring-accent/10" : "border-black/10",
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-tertiary">
        <Image
          src={optimizeCloudflareImage(car.image || "/placeholder-car.jpg", {
            width: 960,
            height: 720,
            fit: "cover",
            quality: 82,
            format: "auto",
          })}
          alt={`${car.brand} ${car.model}`}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {car.isTopAd && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2d5e9f] shadow-sm">
              <StarIcon className="h-3 w-3" />
              {tFeatured("premiumBadge")}
            </span>
          </div>
        )}

        <button
          type="button"
          onPointerDown={stopCardNavigation}
          onClick={(e) => {
            stopCardNavigation(e);
            toggleSaved();
          }}
          aria-label={saved ? tFeatured("removeFavorite") : tFeatured("addFavorite")}
          disabled={isSaving}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-text-secondary shadow-sm transition-colors hover:text-text-primary",
            saved && "border-error/20 bg-error/10 text-error",
            isSaving && "cursor-not-allowed opacity-60",
          )}
        >
          <HeartIcon className={cn("h-5 w-5", saved && "fill-current text-error")} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-base font-display font-semibold leading-tight text-text-primary">
            {car.brand} <span className="font-normal text-text-secondary">{car.model}</span>
          </h3>
          <p className="mt-1 text-xs text-text-tertiary">
            {car.year} • {fuelLabel} • {new Intl.NumberFormat(locale).format(car.mileage)} km •{" "}
            {transmissionLabel}
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-black/10 pt-3">
          <p className="text-xl font-display font-semibold tabular-nums text-text-primary">
            {new Intl.NumberFormat(locale).format(car.price)}{" "}
            <span className="text-sm font-normal text-text-tertiary">{tCommon("currency")}</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
            <MapPinIcon className="h-3.5 w-3.5" />
            {car.location}
          </div>
        </div>
      </div>
    </Link>
  );
}
