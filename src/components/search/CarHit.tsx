"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AlgoliaCarRecord } from "@/lib/algolia";
import { formatPrice } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface CarHitProps {
    hit: AlgoliaCarRecord;
    viewMode?: "grid" | "list";
}

export function CarHit({ hit, viewMode = "grid" }: CarHitProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");

    const firstPhoto = hit.photos_json?.[0] || "/placeholder-car.jpg";
    const isList = viewMode === "list";

    return (
        <Link
            href={`/auto/${hit.objectID}`}
            className="group block"
        >
            <article
                className={cn(
                    "bg-white rounded-lg border border-border overflow-hidden hover:border-border-strong hover:shadow-sm transition-all",
                    isList ? "flex flex-col sm:flex-row" : "flex flex-col"
                )}
            >
                {/* Image Container */}
                <div
                    className={cn(
                        "relative bg-background-secondary overflow-hidden",
                        isList ? "w-full sm:w-64 h-48 sm:h-auto shrink-0" : "aspect-[4/3]"
                    )}
                >
                    <Image
                        src={firstPhoto}
                        alt={`${hit.brand} ${hit.model}`}
                        fill
                        className={cn(
                            "object-cover transition-transform duration-500 group-hover:scale-105",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        sizes={isList ? "(max-width: 640px) 100vw, 256px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                        onLoad={() => setImageLoaded(true)}
                    />

                    {/* Premium Badge */}
                    {hit.is_top_ad && (
                        <div className="absolute top-3 left-3 z-10">
                            <span className="px-2 py-1 bg-white/90 rounded text-[10px] font-medium text-text-primary">
                                Premium
                            </span>
                        </div>
                    )}

                    {/* Photo Count */}
                    {(hit.photos_json?.length ?? 0) > 1 && (
                        <div className="absolute bottom-3 left-3 z-10">
                            <span className="px-2 py-1 bg-black/60 rounded text-[10px] font-medium text-white">
                                {hit.photos_json?.length}
                            </span>
                        </div>
                    )}

                    {/* Save button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-md bg-white/90 flex items-center justify-center hover:bg-white transition-colors z-10"
                    >
                        <HeartIcon className="w-4 h-4 text-text-primary" />
                    </button>
                </div>

                {/* Content */}
                <div className={cn("flex flex-col flex-1 p-4 justify-between", isList && "py-4")}>
                    <div>
                        <h3 className="text-base font-semibold text-text-primary leading-tight truncate group-hover:text-accent transition-colors">
                            {hit.brand} {hit.model}
                        </h3>
                        <p className="text-sm text-text-tertiary mt-0.5">
                            {hit.year} • {formatNumber(hit.mileage_km || 0)} km
                        </p>

                        {/* Specs */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <SpecBadge label={tFuel(hit.fuel) || hit.fuel} />
                            <SpecBadge label={tTransmission(hit.transmission) || hit.transmission} />
                            <SpecBadge label={hit.location_city || "SR"} />
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-text-primary tabular-nums">
                                {formatPrice(hit.price_eur || 0)}
                            </p>
                            {hit.is_vat_deductible && (
                                <p className="text-[10px] text-text-tertiary">
                                    Možný odpočet DPH
                                </p>
                            )}
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-text-tertiary group-hover:text-text-primary transition-colors" />
                    </div>
                </div>
            </article>
        </Link>
    );
}

function SpecBadge({ label }: { label: string }) {
    return (
        <span className="px-2 py-0.5 bg-background-secondary rounded text-xs text-text-secondary">
            {label}
        </span>
    );
}

function formatNumber(val: number): string {
    return new Intl.NumberFormat("sk-SK").format(val);
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}
