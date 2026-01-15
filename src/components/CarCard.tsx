"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

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
    const tFilters = useTranslations("filters");
    const t = useTranslations("car");

    const [imageLoaded, setImageLoaded] = useState(false);
    const [saved, setSaved] = useState(isSaved);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setSaved(isSaved);
    }, [isSaved]);

    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(!saved);
        onSave?.(car.id);
    };

    const handleCompare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onCompare?.(car.id);
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/auto/${car.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${car.brand} ${car.model}`,
                    text: `${car.brand} ${car.model} ${car.year} - ${formatPrice(car.price_eur)}`,
                    url,
                });
            } catch {
                // User cancelled or share failed
            }
        } else {
            await navigator.clipboard.writeText(url);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("sk-SK", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatMileage = (km: number) => {
        return new Intl.NumberFormat("sk-SK").format(km) + " km";
    };

    const getFuelLabel = (fuel: string) => {
        const fuelMap: Record<string, string> = {
            petrol: tFuel("petrol"),
            diesel: tFuel("diesel"),
            electric: tFuel("electric"),
            hybrid: tFuel("hybrid"),
            lpg: tFuel("lpg"),
            cng: tFuel("cng"),
        };
        return fuelMap[fuel] || fuel;
    };

    const getTransmissionLabel = (transmission: string) => {
        return transmission === "automatic" ? tTransmission("automatic") : tTransmission("manual");
    };

    const mainImage = car.photos_json?.[0] || "/placeholder-car.jpg";
    const trustSignalsCount = [car.is_bought_in_sk, car.has_service_book, car.not_crashed].filter(Boolean).length;

    return (
        <a
            href={`/auto/${car.id}`}
            className={`group relative block rounded-2xl border bg-white overflow-hidden card-hover-lift ${car.is_top_ad
                ? "border-amber-400/60 ring-2 ring-amber-400/30 shadow-lg"
                : car.is_highlighted
                    ? "border-accent/30 shadow-md"
                    : "border-border shadow-sm hover:border-accent/40"
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* TOP Badge - Premium with sparkle animation */}
            {car.is_top_ad && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg animate-sparkle-glow">
                    <StarIcon className="w-3.5 h-3.5" />
                    <span>TOP</span>
                </div>
            )}

            {/* Quick Actions - Appear on hover */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                {/* Compare Button */}
                {onCompare && (
                    <button
                        onClick={handleCompare}
                        className={`quick-action-btn flex items-center justify-center w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-sm hover:bg-accent hover:border-accent hover:text-white active:scale-95 transition-all ${isCompareMode ? 'opacity-100 transform-none bg-accent border-accent text-white' : ''}`}
                        aria-label={t("compare") || "Porovnať"}
                        data-tooltip={t("compare") || "Porovnať"}
                    >
                        <CompareIcon className="w-4 h-4" />
                    </button>
                )}

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="quick-action-btn flex items-center justify-center w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-sm hover:bg-accent hover:border-accent hover:text-white active:scale-95 transition-all"
                    aria-label={t("share") || "Zdieľať"}
                    data-tooltip={t("share") || "Zdieľať"}
                >
                    <ShareIcon className="w-4 h-4" />
                </button>

                {/* Save Button - Always visible */}
                <button
                    onClick={handleSave}
                    className={`flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm border shadow-sm hover:scale-110 active:scale-95 transition-all ${saved
                        ? "bg-red-50 border-red-200"
                        : "bg-background/90 border-border hover:bg-background"
                        }`}
                    aria-label={saved ? t("removeFromSaved") || "Odstrániť z uložených" : t("save") || "Uložiť"}
                >
                    <HeartIcon className={`w-5 h-5 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-secondary"}`} />
                </button>
            </div>

            {/* Image Container with enhanced zoom */}
            <div className={`relative aspect-[16/10] bg-surface overflow-hidden image-zoom-container ${car.is_highlighted ? "aspect-[16/9]" : ""}`}>
                {/* Loading skeleton */}
                {!imageLoaded && (
                    <div className="absolute inset-0 skeleton" />
                )}

                <Image
                    src={mainImage}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setImageLoaded(true)}
                />

                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

                {/* Quick View Text on hover */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="px-4 py-2 rounded-full bg-white/90 text-primary text-sm font-semibold backdrop-blur-sm shadow-lg">
                        {t("viewDetail") || "Zobraziť detail"}
                    </span>
                </div>

                {/* Photo count badge */}
                {car.photos_json?.length > 1 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur-sm">
                        <CameraIcon className="w-3.5 h-3.5" />
                        {car.photos_json.length}
                    </div>
                )}

                {/* VAT Deductible Badge */}
                {car.is_vat_deductible && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md">
                        DPH
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title & Price */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-primary truncate group-hover:text-accent transition-colors">
                            {car.brand} {car.model}
                        </h3>
                        <p className="text-sm text-secondary mt-0.5">
                            {car.generation && `${car.generation} • `}
                            {car.year}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        {/* Enhanced Price Display */}
                        <p className={`text-xl font-extrabold ${car.is_top_ad ? 'price-gradient-gold' : 'text-primary'}`}>
                            {formatPrice(car.price_eur)} €
                        </p>
                        {car.is_vat_deductible && (
                            <p className="text-xs text-secondary mt-0.5">
                                {t("vatDeductible") || "Možný odpočet DPH"}
                            </p>
                        )}
                    </div>
                </div>

                {/* Specs Row - Enhanced with icons */}
                <div className="flex items-center flex-wrap gap-3 mt-4 text-sm text-secondary">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface">
                        <SpeedometerIcon className="w-4 h-4 text-accent" />
                        <span className="font-medium">{formatMileage(car.mileage_km)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface">
                        <FuelIcon className="w-4 h-4 text-accent" />
                        <span className="font-medium">{getFuelLabel(car.fuel)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface">
                        <GearboxIcon className="w-4 h-4 text-accent" />
                        <span className="font-medium">{getTransmissionLabel(car.transmission)}</span>
                    </span>
                    {car.power_kw && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface">
                            <EngineIcon className="w-4 h-4 text-accent" />
                            <span className="font-medium">{car.power_kw} kW</span>
                        </span>
                    )}
                </div>

                {/* Trust Signals - Enhanced with colored icons and tooltips */}
                {trustSignalsCount > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {car.is_bought_in_sk && (
                            <TrustBadge
                                icon={<FlagIcon />}
                                label={tFilters("boughtInSK")}
                                tooltip={t("boughtInSKTooltip") || "Auto bolo kúpené na Slovensku"}
                            />
                        )}
                        {car.has_service_book && (
                            <TrustBadge
                                icon={<BookIcon />}
                                label={tFilters("serviceBook")}
                                tooltip={t("serviceBookTooltip") || "Kompletná servisná knižka"}
                            />
                        )}
                        {car.not_crashed && (
                            <TrustBadge
                                icon={<ShieldCheckIcon />}
                                label={tFilters("notCrashed")}
                                tooltip={t("notCrashedTooltip") || "Auto nebolo havarované"}
                            />
                        )}
                    </div>
                )}

                {/* Location - Enhanced */}
                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border text-sm text-secondary">
                    <LocationIcon className="w-4 h-4 text-accent" />
                    <span className="font-medium">{car.location_city}</span>
                </div>
            </div>
        </a>
    );
}

// Enhanced Trust Badge Component with tooltip support
function TrustBadge({ icon, label, tooltip }: { icon: React.ReactNode; label: string; tooltip?: string }) {
    return (
        <span
            className="trust-badge-enhanced tooltip"
            data-tooltip={tooltip}
        >
            <span className="text-success">{icon}</span>
            <span>{label}</span>
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
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
        </svg>
    );
}

function BookIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
    );
}

function ShieldCheckIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
}

function CompareIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}

function ShareIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
    );
}
