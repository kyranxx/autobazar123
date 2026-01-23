"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AlgoliaCarRecord } from "@/lib/algolia";
import { formatPrice } from "@/utils/formatters";
import { TrustBadge } from "@/components/ui/TrustBadge";
import {
    StarIcon,
    HeartIcon,
    CameraIcon,
    SpeedometerIcon,
    FuelIcon,
    GearboxIcon,
    EngineIcon,
    LocationIcon,
} from "@/components/ui/Icons";

export function CarHit({ hit }: { hit: AlgoliaCarRecord }) {
    const t = useTranslations("car");
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const firstPhoto = hit.photos_json?.[0] || "/placeholder-car.jpg";
    const trustSignalsCount = [hit.has_service_book, hit.not_crashed, hit.is_bought_in_sk].filter(Boolean).length;

    return (
        <Link
            href={`/auto/${hit.objectID}`}
            className="block group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <article
                className={`relative rounded-2xl border overflow-hidden bg-white card-hover-lift car-result-item ${hit.is_top_ad
                    ? "border-amber-400/60 ring-2 ring-amber-400/30 shadow-lg"
                    : hit.is_highlighted
                        ? "border-accent/40 shadow-md"
                        : "border-border shadow-sm"
                    }`}
            >
                {/* Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                    {hit.is_top_ad && (
                        <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg animate-sparkle-glow flex items-center gap-1">
                            <StarIcon className="w-3.5 h-3.5" />
                            TOP
                        </span>
                    )}
                    {hit.is_vat_deductible && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                            DPH
                        </span>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="quick-action-btn flex items-center justify-center w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-sm hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all"
                        aria-label={t("save") || "Uložiť"}
                    >
                        <HeartIcon className="w-5 h-5 text-secondary hover:text-red-500" />
                    </button>
                </div>

                {/* Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden image-zoom-container">
                    {/* Loading skeleton */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 skeleton" />
                    )}

                    <Image
                        src={firstPhoto}
                        alt={`${hit.brand} ${hit.model}`}
                        fill
                        className={`object-cover ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        onLoad={() => setImageLoaded(true)}
                    />

                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

                    {/* Quick View Text */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="px-4 py-2 rounded-full bg-white/90 text-primary text-sm font-semibold backdrop-blur-sm shadow-lg">
                            {t("viewDetail") || "Zobraziť detail"}
                        </span>
                    </div>

                    {/* Photo count */}
                    {(hit.photos_json?.length ?? 0) > 1 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur-sm">
                            <CameraIcon className="w-3.5 h-3.5" />
                            {hit.photos_json?.length}
                        </div>
                    )}
                </div>

                {/* Content - Fixed height for uniformity */}
                <div className="p-4 h-[180px] flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                            <h3 className="font-bold text-primary group-hover:text-accent transition-colors truncate">
                                {hit.brand} {hit.model}
                            </h3>
                            <p className="text-sm text-secondary truncate">
                                {hit.generation} • {hit.year}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className={`text-xl font-extrabold ${hit.is_top_ad ? 'price-gradient-gold' : 'text-primary'}`}>
                                {formatPrice(hit.price_eur || 0)} €
                            </p>
                        </div>
                    </div>

                    {/* Specs */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                        <Spec icon={<SpeedometerIcon className="w-3.5 h-3.5" />} value={`${((hit.mileage_km || 0) / 1000).toFixed(0)} tis. km`} />
                        <Spec icon={<FuelIcon className="w-3.5 h-3.5" />} value={t(hit.fuel) || hit.fuel} />
                        <Spec icon={<GearboxIcon className="w-3.5 h-3.5" />} value={t(hit.transmission) || hit.transmission} />
                        {hit.power_kw && <Spec icon={<EngineIcon className="w-3.5 h-3.5" />} value={`${hit.power_kw} kW`} />}
                    </div>

                    {/* Trust signals - grows to fill space */}
                    <div className="flex-1 flex flex-col justify-end mt-auto">
                        {trustSignalsCount > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {hit.has_service_book && <TrustBadge label={t("serviceBook") || "Servisná knižka"} />}
                                {hit.not_crashed && <TrustBadge label={t("notCrashed") || "Nehavarované"} />}
                                {hit.is_bought_in_sk && <TrustBadge label={t("boughtInSK") || "Kúpené v SR"} />}
                            </div>
                        )}

                        {/* Location */}
                        {hit.location_city && (
                            <p className="text-xs text-secondary mt-2 flex items-center gap-1.5">
                                <LocationIcon className="w-3.5 h-3.5 text-accent" />
                                <span className="font-medium truncate">{hit.location_city}</span>
                            </p>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}

function Spec({ icon, value }: { icon: React.ReactNode; value: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-xs text-secondary">
            <span className="text-accent">{icon}</span>
            <span className="font-medium">{value}</span>
        </span>
    );
}
