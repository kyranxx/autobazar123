"use client";

import { useState, useEffect } from "react";

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
    isSaved?: boolean;
}

export default function CarCard({ car, onSave, isSaved = false }: CarCardProps) {
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("sk-SK", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatMileage = (km: number) => {
        return new Intl.NumberFormat("sk-SK").format(km) + " km";
    };

    const getFuelLabel = (fuel: string) => {
        const labels: Record<string, string> = {
            petrol: "Benzín",
            diesel: "Diesel",
            electric: "Elektro",
            hybrid: "Hybrid",
            lpg: "LPG",
            cng: "CNG",
            hydrogen: "Vodík",
        };
        return labels[fuel] || fuel;
    };

    const getTransmissionLabel = (transmission: string) => {
        return transmission === "automatic" ? "Automat" : "Manuál";
    };

    const mainImage = car.photos_json?.[0] || "/placeholder-car.jpg";

    return (
        <a
            href={`/auto/${car.id}`}
            className={`group relative block rounded-2xl border bg-background overflow-hidden transition-all duration-300 hover:shadow-lg ${car.is_top_ad
                    ? "border-accent/50 ring-2 ring-accent/20 shadow-md"
                    : car.is_highlighted
                        ? "border-warning/30 shadow-sm"
                        : "border-border hover:border-accent/30"
                }`}
        >
            {/* Top Badge */}
            {car.is_top_ad && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-white text-xs font-semibold shadow-lg">
                    <StarIcon className="w-3.5 h-3.5" />
                    TOP
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                className="absolute top-3 right-3 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-sm hover:bg-background hover:scale-110 active:scale-95 transition-all"
                aria-label={saved ? "Odstrániť z uložených" : "Uložiť"}
            >
                <HeartIcon className={`w-5 h-5 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-secondary"}`} />
            </button>

            {/* Image Container */}
            <div className={`relative aspect-[16/10] bg-surface overflow-hidden ${car.is_highlighted ? "aspect-[16/9]" : ""}`}>
                {!imageLoaded && (
                    <div className="absolute inset-0 animate-shimmer" />
                )}
                <img
                    src={mainImage}
                    alt={`${car.brand} ${car.model}`}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                    onLoad={() => setImageLoaded(true)}
                />

                {/* Photo count badge */}
                {car.photos_json?.length > 1 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                        <CameraIcon className="w-3.5 h-3.5" />
                        {car.photos_json.length}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title & Price */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-primary truncate group-hover:text-accent transition-colors">
                            {car.brand} {car.model}
                        </h3>
                        <p className="text-sm text-secondary mt-0.5">
                            {car.generation && `${car.generation} • `}
                            {car.year}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">
                            {formatPrice(car.price_eur)}
                        </p>
                        {car.is_vat_deductible && (
                            <p className="text-xs text-secondary">bez DPH</p>
                        )}
                    </div>
                </div>

                {/* Specs Row */}
                <div className="flex items-center gap-4 mt-4 text-sm text-secondary">
                    <span className="flex items-center gap-1">
                        <SpeedometerIcon className="w-4 h-4" />
                        {formatMileage(car.mileage_km)}
                    </span>
                    <span className="flex items-center gap-1">
                        <FuelIcon className="w-4 h-4" />
                        {getFuelLabel(car.fuel)}
                    </span>
                    <span className="flex items-center gap-1">
                        <GearboxIcon className="w-4 h-4" />
                        {getTransmissionLabel(car.transmission)}
                    </span>
                    {car.power_kw && (
                        <span className="hidden sm:flex items-center gap-1">
                            <EngineIcon className="w-4 h-4" />
                            {car.power_kw} kW
                        </span>
                    )}
                </div>

                {/* Trust Signals */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {car.is_bought_in_sk && (
                        <TrustBadge icon={<FlagIcon />} label="Kúpené v SR" />
                    )}
                    {car.has_service_book && (
                        <TrustBadge icon={<BookIcon />} label="Servisná knižka" />
                    )}
                    {car.not_crashed && (
                        <TrustBadge icon={<ShieldCheckIcon />} label="Nehavarované" />
                    )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border text-sm text-secondary">
                    <LocationIcon className="w-4 h-4" />
                    {car.location_city}
                </div>
            </div>
        </a>
    );
}

// Trust Badge Component
function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
            {icon}
            {label}
        </span>
    );
}

// Icons
function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

function CameraIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function SpeedometerIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function FuelIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2zm0 0v11a1 1 0 001 1h6a1 1 0 001-1v-5" />
        </svg>
    );
}

function GearboxIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
    );
}

function EngineIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );
}

function LocationIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function FlagIcon() {
    return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
        </svg>
    );
}

function BookIcon() {
    return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
    );
}

function ShieldCheckIcon() {
    return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
}
