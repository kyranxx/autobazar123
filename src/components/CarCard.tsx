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
    onCompare,
    isSaved = false,
    isCompareMode = false
}: CarCardProps) {
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");
    const t = useTranslations("car");

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
            className="group block animate-fade-in"
        >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface mb-5">
                {!imageLoaded && <div className="absolute inset-0 bg-surface animate-pulse" />}
                <Image
                    src={mainImage}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={cn(
                        "object-cover transition-transform duration-700 ease-out",
                        imageLoaded ? "opacity-100" : "opacity-0",
                        "group-hover:scale-105"
                    )}
                    onLoad={() => setImageLoaded(true)}
                />

                <button
                    onClick={handleSave}
                    className={cn(
                        "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md",
                        saved ? "bg-primary text-white" : "bg-white/80 text-primary hover:bg-white"
                    )}
                >
                    <HeartIcon className={cn("w-5 h-5", saved ? "fill-current" : "")} />
                </button>

                {car.is_top_ad && (
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                            Premium
                        </span>
                    </div>
                )}

                {car.photos_json?.length > 1 && (
                    <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-black/40 backdrop-blur rounded-full text-[9px] font-bold text-white uppercase tracking-widest">
                            {car.photos_json.length} FOTO
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-4 px-2">
                <div>
                    <h3 className="text-xl font-display font-bold text-primary leading-tight truncate">
                        {car.brand} {car.model}
                    </h3>
                    <p className="text-sm text-secondary opacity-60 mt-1">
                        {car.year} • {new Intl.NumberFormat("sk-SK").format(car.mileage_km)} km
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge label={tFuel(car.fuel)} />
                    <Badge label={car.transmission === "automatic" ? tTransmission("automatic") : tTransmission("manual")} />
                    <Badge label={car.location_city} />
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-display font-bold text-primary tabular-nums">
                            {new Intl.NumberFormat("sk-SK").format(car.price_eur)} €
                        </p>
                        {car.is_vat_deductible && (
                            <p className="text-[10px] text-secondary opacity-50 font-bold uppercase tracking-wider mt-0.5">
                                Možný odpočet DPH
                            </p>
                        )}
                    </div>
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300">
                        <ArrowRightIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </a>
    );
}

function Badge({ label }: { label: string }) {
    return (
        <span className="px-2.5 py-1 bg-surface border border-border/20 rounded-lg text-[10px] font-bold text-secondary uppercase tracking-tight">
            {label}
        </span>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    );
}
