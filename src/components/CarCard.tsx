"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/utils/cn";

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
    const tTransmission = useTranslations("transmission");

    const [imageLoaded, setImageLoaded] = useState(false);
    const [saved, setSaved] = useState(isSaved);

    useEffect(() => {
        setSaved(isSaved);
    }, [isSaved]);

    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(!saved);
        onSave?.(car.id);
    };

    const mainImage = car.photos_json?.[0] || "/placeholder-car.jpg";

    return (
        <a
            href={`/auto/${car.id}`}
            className="group block card card-hover p-4"
        >
            {/* Image container */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-background-secondary mb-4">
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-background-secondary animate-pulse" />
                )}
                <Image
                    src={mainImage}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={cn(
                        "object-cover transition-transform duration-500",
                        imageLoaded ? "opacity-100" : "opacity-0",
                        "group-hover:scale-105"
                    )}
                    onLoad={() => setImageLoaded(true)}
                />

                {/* Save button */}
                <button
                    onClick={handleSave}
                    className={cn(
                        "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm",
                        saved 
                            ? "bg-text-primary text-white" 
                            : "bg-white/90 text-text-primary hover:bg-white"
                    )}
                >
                    <HeartIcon className={cn("w-4 h-4", saved && "fill-current")} />
                </button>

                {/* Top ad badge */}
                {car.is_top_ad && (
                    <div className="absolute top-3 left-3">
                        <span className="badge badge-accent text-[10px]">
                            Premium
                        </span>
                    </div>
                )}

                {/* Photo count */}
                {car.photos_json?.length > 1 && (
                    <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 bg-black/60 rounded-full text-[10px] font-medium text-white">
                            {car.photos_json.length}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="space-y-2">
                <div>
                    <h3 className="text-base font-semibold text-text-primary leading-tight truncate">
                        {car.brand} {car.model}
                    </h3>
                    <p className="text-sm text-text-tertiary">
                        {car.year} • {new Intl.NumberFormat("sk-SK").format(car.mileage_km)} km
                    </p>
                </div>

                {/* Specs */}
                <div className="flex flex-wrap gap-2">
                    <SpecBadge label={tFuel(car.fuel)} />
                    <SpecBadge 
                        label={car.transmission === "automatic" 
                            ? tTransmission("automatic") 
                            : tTransmission("manual")} 
                    />
                </div>

                {/* Price */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                        <p className="text-lg font-semibold text-text-primary tabular-nums">
                            {new Intl.NumberFormat("sk-SK").format(car.price_eur)} €
                        </p>
                        {car.is_vat_deductible && (
                            <p className="text-[10px] text-text-tertiary">
                                Možný odpočet DPH
                            </p>
                        )}
                    </div>
                    <div className="text-text-tertiary text-sm">
                        {car.location_city}
                    </div>
                </div>
            </div>
        </a>
    );
}

function SpecBadge({ label }: { label: string }) {
    return (
        <span className="badge text-xs">
            {label}
        </span>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}
