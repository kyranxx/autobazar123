"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";
import type { FeaturedCar } from "@/lib/supabase/cached";
import { cn } from "@/utils/cn";

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
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <Link
            href={`/auto/${car.id}`}
            className="group block overflow-hidden rounded-lg border border-border bg-background-secondary shadow-sm transition-shadow hover:shadow-lg"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-tertiary">
                <Image
                    src={car.image || "/placeholder-car.jpg"}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={cn(
                        "object-cover transition-transform duration-500 group-hover:scale-105",
                        imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setImageLoaded(true)}
                />

                {car.isTopAd && (
                    <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-secondary border border-border text-accent text-[10px] font-bold uppercase tracking-widest shadow-sm">
                            <StarIcon className="w-3 h-3" />
                            Premium
                        </span>
                    </div>
                )}

                <div className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border border-border bg-background-secondary text-text-secondary shadow-sm">
                    <HeartIcon className="w-5 h-5" />
                </div>
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <h3 className="text-lg font-display font-semibold text-text-primary leading-tight">
                        {car.brand} <span className="font-light italic text-text-secondary">{car.model}</span>
                    </h3>
                    <p className="text-xs text-text-tertiary mt-1">{car.transmission}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <SpecChip>{car.year}</SpecChip>
                    <SpecChip>{car.fuel}</SpecChip>
                    <SpecChip>{new Intl.NumberFormat("sk-SK").format(car.mileage)} km</SpecChip>
                </div>

                <div className="flex items-end justify-between border-t border-border-subtle pt-3">
                    <p className="text-lg font-semibold text-text-primary tabular-nums">
                        {new Intl.NumberFormat("sk-SK").format(car.price)} <span className="text-sm font-normal text-text-tertiary">EUR</span>
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

function SpecChip({ children }: { children: ReactNode }) {
    return (
        <span className="px-2.5 py-1 rounded-full bg-background-tertiary text-[11px] font-semibold text-text-secondary">
            {children}
        </span>
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

function MapPinIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}
