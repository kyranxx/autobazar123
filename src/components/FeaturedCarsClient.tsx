"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { FeaturedCar } from "@/lib/supabase/cached";
import { cn } from "@/utils/cn";

interface FeaturedCarsClientProps {
    cars: FeaturedCar[];
}

export default function FeaturedCarsClient({ cars }: FeaturedCarsClientProps) {
    const t = useTranslations("sections");
    const tCommon = useTranslations("common");
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");

    const getFuelLabel = (fuel: string) => {
        const labels: Record<string, string> = {
            petrol: tFuel("petrol"),
            diesel: tFuel("diesel"),
            electric: tFuel("electric"),
            hybrid: tFuel("hybrid"),
            lpg: tFuel("lpg"),
            cng: tFuel("cng"),
        };
        return labels[fuel] || fuel || "N/A";
    };

    return (
        <section className="py-32 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-primary mb-4">
                            {t("featured")}
                        </h2>
                        <p className="text-secondary opacity-60 max-w-lg leading-relaxed">
                            {t("featuredSubtitle")}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                    {cars.map((car, index) => (
                        <FeaturedCarItem
                            key={car.id}
                            car={car}
                            index={index}
                            fuelLabel={getFuelLabel(car.fuel)}
                        />
                    ))}
                </div>

                <div className="mt-20 flex justify-center">
                    <Link
                        href="/auta"
                        className="px-12 py-4 border border-border rounded-full text-sm font-bold text-primary hover:bg-surface transition-all duration-300"
                    >
                        {tCommon("viewAll")}
                    </Link>
                </div>
            </div>
        </section>
    );
}

function FeaturedCarItem({ car, index, fuelLabel }: { car: FeaturedCar; index: number; fuelLabel: string }) {
    return (
        <Link
            href={`/auto/${car.id}`}
            className="group block animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface mb-6">
                {car.image ? (
                    <Image
                        src={car.image}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-surface flex items-center justify-center">
                        <span className="text-secondary/20 font-bold uppercase tracking-widest text-[10px]">No image Available</span>
                    </div>
                )}
                {car.isTopAd && (
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                            Premium
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-display font-bold text-primary leading-tight truncate">
                            {car.brand} {car.model}
                        </h3>
                        <p className="text-sm text-secondary opacity-60 mt-1">
                            {car.year} • {new Intl.NumberFormat("sk-SK").format(car.mileage)} km
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-surface rounded-md text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {fuelLabel}
                    </span>
                    <span className="px-2.5 py-1 bg-surface rounded-md text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {car.location}
                    </span>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-border/40">
                    <p className="text-2xl font-display font-bold text-primary">
                        {new Intl.NumberFormat("sk-SK").format(car.price)} €
                    </p>
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300">
                        <ArrowRightIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    );
}
