"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AlgoliaCarRecord } from "@/lib/algolia";
import { formatPrice } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { HeartIcon, ArrowRightIcon, CameraIcon, CalendarIcon, SpeedometerIcon, LocationIcon } from "@/components/ui/Icons";

interface CarHitProps {
    hit: AlgoliaCarRecord;
    viewMode?: "grid" | "list";
}

export function CarHit({ hit, viewMode = "grid" }: CarHitProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");

    const firstPhoto = hit.photos_json?.[0] || "/placeholder-car.jpg";
    const isList = viewMode === "list";

    return (
        <Link
            href={`/auto/${hit.objectID}`}
            className="group block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <article
                className={cn(
                    "bg-background-secondary border border-border-subtle rounded-xl overflow-hidden transition-all duration-300",
                    "hover:border-border-strong hover:shadow-lg hover:-translate-y-0.5",
                    isList ? "flex flex-col sm:flex-row" : "flex flex-col"
                )}
            >
                {/* Image Container */}
                <div
                    className={cn(
                        "relative bg-background-muted overflow-hidden",
                        isList ? "w-full sm:w-72 h-52 sm:h-auto shrink-0" : "aspect-[16/10]"
                    )}
                >
                    {/* Skeleton placeholder */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 skeleton" />
                    )}

                    <Image
                        src={firstPhoto}
                        alt={`${hit.brand} ${hit.model}`}
                        fill
                        loading="lazy"
                        className={cn(
                            "object-cover transition-all duration-500",
                            imageLoaded ? "opacity-100" : "opacity-0",
                            isHovered && "scale-105"
                        )}
                        sizes={isList ? "(max-width: 640px) 100vw, 288px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                        onLoad={() => setImageLoaded(true)}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
                        {hit.is_top_ad ? (
                            <Badge variant="accent" size="sm" className="shadow-sm">
                                Premium
                            </Badge>
                        ) : (
                            <div />
                        )}

                        {/* Save button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                                "bg-white/90 backdrop-blur-sm shadow-sm",
                                "hover:bg-white hover:scale-110",
                                "opacity-0 group-hover:opacity-100"
                            )}
                            aria-label="Save to favorites"
                        >
                            <HeartIcon className="w-4 h-4 text-text-secondary" />
                        </button>
                    </div>

                    {/* Photo Count */}
                    {(hit.photos_json?.length ?? 0) > 1 && (
                        <div className="absolute bottom-3 left-3 z-10">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-[11px] font-medium text-white">
                                <CameraIcon className="w-3 h-3" />
                                {hit.photos_json?.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={cn(
                    "flex flex-col flex-1 p-4",
                    isList && "sm:p-5 sm:justify-between"
                )}>
                    {/* Title & Specs */}
                    <div className="mb-3">
                        <h3 className="text-base font-semibold text-text-primary leading-tight line-clamp-1 group-hover:text-accent transition-colors">
                            {hit.brand} {hit.model}
                        </h3>

                        {/* Specs row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-text-secondary">
                            <span className="inline-flex items-center gap-1">
                                <CalendarIcon className="w-3.5 h-3.5 text-text-muted" />
                                {hit.year}
                            </span>
                            <span className="w-px h-3 bg-border-subtle" />
                            <span className="inline-flex items-center gap-1">
                                <SpeedometerIcon className="w-3.5 h-3.5 text-text-muted" />
                                {formatNumber(hit.mileage_km || 0)} km
                            </span>
                            <span className="w-px h-3 bg-border-subtle" />
                            <span>{tFuel(hit.fuel) || hit.fuel}</span>
                        </div>

                        {/* Location */}
                        <p className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                            <LocationIcon className="w-3.5 h-3.5" />
                            {hit.location_city || "Slovensko"}
                        </p>
                    </div>

                    {/* Price & CTA */}
                    <div className={cn(
                        "flex items-end justify-between pt-3 mt-auto border-t border-border-subtle",
                        isList && "sm:pt-4"
                    )}>
                        <div>
                            <p className="text-xl font-bold text-text-primary tabular-nums tracking-tight">
                                {formatPrice(hit.price_eur || 0)}
                            </p>
                            {hit.is_vat_deductible && (
                                <p className="text-[10px] text-success font-medium mt-0.5">
                                    Odpočet DPH
                                </p>
                            )}
                        </div>

                        <div className={cn(
                            "w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center transition-all duration-200",
                            "group-hover:bg-accent group-hover:scale-110"
                        )}>
                            <ArrowRightIcon className={cn(
                                "w-4 h-4 text-accent transition-colors",
                                "group-hover:text-white"
                            )} />
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

function formatNumber(val: number): string {
    return new Intl.NumberFormat("sk-SK").format(val);
}


