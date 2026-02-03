"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
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
        <Link
            href={`/auto/${car.id}`}
            className="group relative block aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-[2rem]"
        >
            {/* 1. Full Bleed Image with Zoom Effect */}
            <div className="absolute inset-0 bg-background-secondary">
                <Image
                    src={mainImage}
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
            {car.is_top_ad && (
                <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        <StarIcon className="w-3 h-3 text-accent" />
                        Premium Selection
                    </span>
                </div>
            )}

            {/* 4. Save Button (Top Right) */}
            <button
                onClick={handleSave}
                className={cn(
                    "absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/10",
                    saved
                        ? "bg-accent text-white shadow-glow-accent"
                        : "bg-black/20 text-white hover:bg-white hover:text-black"
                )}
            >
                <HeartIcon className={cn("w-5 h-5", saved && "fill-current")} />
            </button>

            {/* 5. Magazine Content (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 transform transition-transform duration-500 translate-y-2 group-hover:translate-y-0">
                {/* Specs Row */}
                <div className="flex flex-wrap gap-2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-medium text-white uppercase tracking-wider">
                        {car.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-medium text-white uppercase tracking-wider">
                        {tFuel(car.fuel)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-medium text-white uppercase tracking-wider">
                        {new Intl.NumberFormat("sk-SK").format(car.mileage_km)} km
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
                            {new Intl.NumberFormat("sk-SK").format(car.price_eur)} <span className="text-sm font-normal text-white/60">€</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {car.location_city}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function StarIcon({ className }: { className?: string }) {
    return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
}

function PhotoIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}

function MapPinIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}

function ArrowRightIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
}


function HeartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}
