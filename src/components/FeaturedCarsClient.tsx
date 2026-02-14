"use client";

import Link from "next/link";
import type { FeaturedCar } from "@/lib/supabase/cached";
import { StarIcon, MapPinIcon, HeartIcon } from "@/components/ui/Icons";
import { LazyImage } from "@/components/LazyImage";
import { cn } from "@/utils/cn";
import { useSavedAd } from "@/hooks/useSavedAd";

interface FeaturedCarsClientProps {
  cars: FeaturedCar[];
}

export default function FeaturedCarsClient({ cars }: FeaturedCarsClientProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cars.map((car, index) => (
        <FeaturedCarItem key={car.id} car={car} index={index} />
      ))}
    </div>
  );
}

function FeaturedCarItem({ car, index }: { car: FeaturedCar; index: number }) {
  const { saved, isSaving, toggleSaved } = useSavedAd(car.id);

  const stopCardNavigation = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const fuelLabel = mapFuel(car.fuel);
  const transmissionLabel = mapTransmission(car.transmission);

  return (
    <Link
      href={`/auto/${car.id}`}
      className="group overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-tertiary">
        <LazyImage
          src={car.image || "/placeholder-car.jpg"}
          alt={`${car.brand} ${car.model}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          threshold={0.01}
          rootMargin="50px"
        />

        {car.isTopAd && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2d5e9f] shadow-sm">
              <StarIcon className="h-3 w-3" />
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
          aria-label={saved ? "Odobrať z obľúbených" : "Uložiť medzi obľúbené"}
          disabled={isSaving}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-text-secondary shadow-sm transition-colors hover:text-text-primary",
            saved && "text-accent",
            isSaving && "cursor-not-allowed opacity-60",
          )}
        >
          <HeartIcon className={cn("h-5 w-5", saved && "fill-current")} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-display font-semibold leading-tight text-text-primary">
            {car.brand} <span className="font-normal text-text-secondary">{car.model}</span>
          </h3>
          <p className="mt-1 text-sm text-text-tertiary">
            {car.year} • {fuelLabel} • {new Intl.NumberFormat("sk-SK").format(car.mileage)} km • {transmissionLabel}
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-black/10 pt-4">
          <p className="text-2xl font-display font-semibold tabular-nums text-text-primary">
            {new Intl.NumberFormat("sk-SK").format(car.price)} <span className="text-sm font-normal text-text-tertiary">EUR</span>
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

function mapFuel(fuel: string) {
  const normalized = fuel.toLowerCase();
  if (normalized === "petrol") return "Benzín";
  if (normalized === "diesel") return "Diesel";
  if (normalized === "electric") return "Elektro";
  if (normalized === "hybrid") return "Hybrid";
  if (normalized === "lpg") return "LPG";
  if (normalized === "cng") return "CNG";
  return fuel;
}

function mapTransmission(transmission: string) {
  const normalized = transmission.toLowerCase();
  if (normalized === "manual") return "Manuál";
  if (normalized === "automatic") return "Automat";
  return transmission;
}
