"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { StarIcon, MapPinIcon, HeartIcon } from "@/components/ui/Icons";
import { LazyImage } from "@/components/LazyImage";
import { useSavedAd } from "@/hooks/useSavedAd";

export interface CarCardData {
  id: string;
  brand: string;
  model: string;
  generation?: string;
  year: number;
  price_eur: number;
  mileage_km: number;
  fuel: string;
  transmission: string;
  body_style?: string;
  location_city: string;
  photos_json: string[];
  power_kw?: number;
  is_top_ad: boolean;
  is_highlighted: boolean;
  is_vat_deductible: boolean;
  has_service_book: boolean;
  not_crashed: boolean;
  is_bought_in_sk: boolean;
}

interface CarCardProps {
  car: CarCardData;
  onSave?: (id: string) => void;
  onCompare?: (id: string) => void;
  isSaved?: boolean;
  isCompareMode?: boolean;
}

export default function CarCard({
  car,
  onSave,
  isSaved = false,
}: CarCardProps) {
  const tFuel = useTranslations("fuel");
  const { saved, isSaving, toggleSaved } = useSavedAd(car.id, {
    initialSaved: isSaved,
    onToggle: () => onSave?.(car.id),
  });

  const stopCardNavigation = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const mainImage = car.photos_json?.[0] || "/placeholder-car.jpg";

  return (
    <Link
      href={`/auto/${car.id}`}
      className={cn(
        "group card card-hover overflow-hidden",
        car.is_highlighted && "ring-1 ring-accent/40",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-tertiary">
        <LazyImage
          src={mainImage}
          alt={`${car.brand} ${car.model}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          threshold={0.01}
          rootMargin="50px"
        />

        {car.is_top_ad && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-secondary/90 border border-border-subtle text-accent text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm">
              <StarIcon className="w-3 h-3" />
              Premium
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
          aria-label={saved ? "Remove from favorites" : "Save to favorites"}
          disabled={isSaving}
          className={cn(
            "absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border border-border-subtle bg-background-secondary/90 text-text-secondary shadow-sm transition-colors hover:text-text-primary hover:shadow-md",
            saved && "text-accent",
            isSaving && "opacity-60 cursor-not-allowed",
          )}
        >
          <HeartIcon className={cn("w-5 h-5", saved && "fill-current")} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-text-primary leading-tight">
            {car.brand}{" "}
            <span className="font-normal text-text-secondary">{car.model}</span>
          </h3>
          <p className="text-sm text-text-tertiary mt-1">
            {car.year} • {tFuel(car.fuel)} •{" "}
            {new Intl.NumberFormat("sk-SK").format(car.mileage_km)} km •{" "}
            {car.transmission}
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-border-subtle pt-4">
          <p className="text-2xl font-display font-semibold text-text-primary tabular-nums">
            {new Intl.NumberFormat("sk-SK").format(car.price_eur)}{" "}
            <span className="text-sm font-normal text-text-tertiary">EUR</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
            <MapPinIcon className="w-3.5 h-3.5" />
            {car.location_city}
          </div>
        </div>
      </div>
    </Link>
  );
}
