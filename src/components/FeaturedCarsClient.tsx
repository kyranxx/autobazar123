"use client";

import Link from "next/link";
import type { FeaturedCar } from "@/lib/supabase/cached";
import { StarIcon, MapPinIcon, HeartIcon } from "@/components/ui/Icons";
import { LazyImage } from "@/components/LazyImage";

interface FeaturedCarsClientProps {
  cars: FeaturedCar[];
}

export default function FeaturedCarsClient({ cars }: FeaturedCarsClientProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {cars.map((car, index) => (
        <FeaturedCarItem key={car.id} car={car} index={index} />
      ))}
    </div>
  );
}

function FeaturedCarItem({ car, index }: { car: FeaturedCar; index: number }) {
  return (
    <Link
      href={`/auto/${car.id}`}
      className="group card card-hover overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
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
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-secondary/90 border border-border-subtle text-accent text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm">
              <StarIcon className="w-3 h-3" />
              Premium
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border border-border-subtle bg-background-secondary/90 text-text-secondary shadow-sm">
          <HeartIcon className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-text-primary leading-tight">
            {car.brand}{" "}
            <span className="font-normal text-text-secondary">{car.model}</span>
          </h3>
          <p className="text-sm text-text-tertiary mt-1">
            {car.year} â€˘ {car.fuel} â€˘{" "}
            {new Intl.NumberFormat("sk-SK").format(car.mileage)} km â€˘{" "}
            {car.transmission}
          </p>
        </div>

        <div className="flex items-end justify-between border-t border-border-subtle pt-4">
          <p className="text-2xl font-display font-semibold text-text-primary tabular-nums">
            {new Intl.NumberFormat("sk-SK").format(car.price)}{" "}
            <span className="text-sm font-normal text-text-tertiary">EUR</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
            <MapPinIcon className="w-3.5 h-3.5" />
            {car.location}
          </div>
        </div>
      </div>
    </Link>
  );
}
