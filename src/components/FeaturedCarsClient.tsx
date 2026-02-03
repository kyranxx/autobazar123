"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FeaturedCar } from "@/lib/supabase/cached";
import { cn } from "@/utils/cn";
import { HeartIcon, MapPinIcon, StarIcon } from "@heroicons/react/24/outline";

interface FeaturedCarsClientProps {
    cars: FeaturedCar[];
}

export default function FeaturedCarsClient({ cars }: FeaturedCarsClientProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.map((car, index) => (
                <FeaturedCarItem
                    key={car.id}
                    car={car}
                    index={index}
                />
            ))}
        </div>
    );
}

function FeaturedCarItem({ car, index }: { car: FeaturedCar; index: number }) {
    const tFuel = useTranslations("fuel");
    // Simple mock for fuel translation since we might not have the full key logic here
    const fuelLabel = car.fuel;
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <Link
            href={`/auto/${car.id}`}
            className="group relative block aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-[2rem] animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* 1. Full Bleed Image with Zoom Effect */}
            <div className="absolute inset-0 bg-gray-900">
                <Image
                    src={car.image || "/placeholder-car.jpg"}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={cn(
                        "object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110",
                        imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setImageLoaded(true)}
                />
            </div>

            {/* 2. Cinematic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

            {/* 3. Floating 'Premium' Badge (Top Left) */}
            {car.isTopAd && (
                <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        <StarIcon className="w-3 h-3 text-accent" />
                        Premium Selection
                    </span>
                </div>
            )}

            {/* 4. Save Button (Top Right) - simplified for featured */}
            <div className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all hover:bg-white hover:text-black">
                <HeartIcon className="w-5 h-5" />
            </div>

            {/* 5. Magazine Content (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 transform transition-transform duration-500 translate-y-2 group-hover:translate-y-0">
                {/* Specs Row */}
                <div className="flex flex-wrap gap-2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-medium text-white uppercase tracking-wider">
                        {car.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-medium text-white uppercase tracking-wider">
                        {fuelLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-medium text-white uppercase tracking-wider">
                        {new Intl.NumberFormat("sk-SK").format(car.mileage)} km
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-display font-medium text-white leading-none mb-2 tracking-tight">
                    {car.brand} <span className="font-light italic text-white/80">{car.model}</span>
                </h3>

                {/* Price & Location Line */}
                <div className="flex items-end justify-between border-t border-white/20 pt-3 mt-3">
                    <div>
                        <p className="text-xl font-bold text-white tabular-nums tracking-tight">
                            {new Intl.NumberFormat("sk-SK").format(car.price)} <span className="text-sm font-normal text-white/60">€</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {car.location}
                    </div>
                </div>
            </div>
        </Link>
    );
}
