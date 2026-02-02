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
        <section className="section bg-white">
            <div className="container-main">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
                    <div>
                        <p className="eyebrow mb-2">Vybrané ponuky</p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-semibold text-text-primary mb-2">
                            {t("featured")}
                        </h2>
                        <p className="text-sm text-text-tertiary">
                            {t("featuredSubtitle")}
                        </p>
                    </div>
                    <Link
                        href="/vysledky"
                        className="btn-secondary text-sm"
                    >
                        {tCommon("viewAll")}
                        <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.map((car, index) => (
                        <FeaturedCarItem
                            key={car.id}
                            car={car}
                            index={index}
                            fuelLabel={getFuelLabel(car.fuel)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeaturedCarItem({ car, index, fuelLabel }: { car: FeaturedCar; index: number; fuelLabel: string }) {
    return (
        <Link
            href={`/auto/${car.id}`}
            className="group block card card-hover p-4 sm:p-5"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-background-secondary mb-4">
                {car.image ? (
                    <Image
                        src={car.image}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-background-secondary flex items-center justify-center">
                        <span className="text-text-muted text-xs">Bez obrázku</span>
                    </div>
                )}
                {car.isTopAd && (
                    <div className="absolute top-3 left-3">
                        <span className="badge badge-accent text-[10px]">
                            Premium
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div>
                    <h3 className="text-base font-semibold text-text-primary leading-tight truncate">
                        {car.brand} {car.model}
                    </h3>
                    <p className="text-sm text-text-tertiary">
                        {car.year} • {new Intl.NumberFormat("sk-SK").format(car.mileage)} km
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className="badge text-xs">
                        {fuelLabel}
                    </span>
                    <span className="badge text-xs">
                        {car.location}
                    </span>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-border">
                    <p className="text-lg font-semibold text-text-primary tabular-nums">
                        {new Intl.NumberFormat("sk-SK").format(car.price)} €
                    </p>
                    <ArrowRightIcon className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
                </div>
            </div>
        </Link>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}
