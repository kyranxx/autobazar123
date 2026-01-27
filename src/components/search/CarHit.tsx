"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AlgoliaCarRecord } from "@/lib/algolia";
import { formatPrice } from "@/utils/formatters";
import {
    HeartIcon,
    CameraIcon,
    SpeedometerIcon,
    GearboxIcon,
    FuelIcon,
    LocationIcon,
    EngineIcon,
} from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

interface CarHitProps {
    hit: AlgoliaCarRecord;
    viewMode?: "grid" | "list";
}

export function CarHit({ hit, viewMode = "grid" }: CarHitProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const firstPhoto = hit.photos_json?.[0] || "/placeholder-car.jpg";
    const isList = viewMode === "list";

    return (
        <Link
            href={`/auto/${hit.objectID}`}
            className="group block animate-fade-in"
        >
            <article
                className={cn(
                    "bg-white rounded-[24px] border border-border/60 overflow-hidden hover:shadow-premium hover:border-accent/30 transition-all duration-300",
                    isList ? "flex flex-col md:flex-row h-auto md:h-64" : "flex flex-col"
                )}
            >
                {/* Image Container */}
                <div
                    className={cn(
                        "relative bg-surface overflow-hidden",
                        isList ? "w-full md:w-80 h-64 md:h-full shrink-0" : "aspect-[16/11]"
                    )}
                >
                    <Image
                        src={firstPhoto}
                        alt={`${hit.brand} ${hit.model}`}
                        fill
                        className={cn(
                            "object-cover transition-transform duration-700 ease-out group-hover:scale-105",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        sizes={isList ? "(max-width: 768px) 100vw, 320px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                        onLoad={() => setImageLoaded(true)}
                    />

                    {/* Premium Badge */}
                    {hit.is_top_ad && (
                        <div className="absolute top-4 left-4 z-10">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                                Premium
                            </span>
                        </div>
                    )}

                    {/* Photo Count */}
                    {(hit.photos_json?.length ?? 0) > 1 && (
                        <div className="absolute bottom-4 left-4 z-10">
                            <span className="px-2.5 py-1 bg-black/40 backdrop-blur rounded-full text-white text-[9px] font-bold tracking-widest flex items-center gap-1.5">
                                <CameraIcon className="w-3 h-3" />
                                {hit.photos_json?.length}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur border border-border flex items-center justify-center hover:bg-white transition-all shadow-sm z-10"
                    >
                        <HeartIcon className="w-4 h-4 text-primary" />
                    </button>

                    {/* Dark gradient overlay for text readability if needed */}
                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className={cn("flex flex-col flex-1 p-5 md:p-6 justify-between", isList && "py-6")}>
                    <div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <h3 className="text-lg md:text-xl font-display font-bold text-primary leading-tight line-clamp-1 group-hover:text-accent transition-colors">
                                    {hit.brand} {hit.model}
                                </h3>
                                <p className="text-sm font-medium text-secondary/70 mt-1 line-clamp-1">
                                    {hit.generation ? `${hit.generation} • ` : ''}{hit.body_style}
                                </p>
                            </div>
                        </div>

                        {/* Tech Specs Grid */}
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-6">
                            <SpecRow icon={<SpeedometerIcon className="w-3.5 h-3.5" />} text={`${formatNumber(hit.mileage_km || 0)} km`} />
                            <SpecRow icon={<EngineIcon className="w-3.5 h-3.5" />} text={`${hit.power_kw || 0} kW (${Math.round((hit.power_kw || 0) * 1.36)} PS)`} />
                            <SpecRow icon={<GearboxIcon className="w-3.5 h-3.5" />} text={hit.transmission} />
                            <SpecRow icon={<FuelIcon className="w-3.5 h-3.5" />} text={hit.fuel} />
                            <SpecRow icon={<div className="w-3.5 text-center font-bold text-[10px]">ROK</div>} text={hit.year.toString()} />
                            <SpecRow icon={<LocationIcon className="w-3.5 h-3.5" />} text={hit.location_city || "Slovensko"} />
                        </div>
                    </div>

                    <div className="pt-5 border-t border-border/40 flex items-center justify-between mt-auto">
                        <div>
                            <p className="text-2xl font-display font-bold text-primary tabular-nums tracking-tight">
                                {formatPrice(hit.price_eur || 0)}
                            </p>
                            {hit.is_vat_deductible && (
                                <p className="text-[10px] text-secondary/60 font-bold uppercase tracking-widest mt-0.5">
                                    Možný odpočet DPH
                                </p>
                            )}
                        </div>
                        <div
                            className="h-10 px-5 rounded-full bg-surface border border-border/50 flex items-center justify-center text-xs font-bold text-primary uppercase tracking-wider group-hover:bg-primary group-hover:text-white transition-all duration-300"
                        >
                            Detail
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

function SpecRow({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            <span className="text-secondary/40 shrink-0">{icon}</span>
            <span className="text-xs font-semibold text-primary/80 truncate">{text}</span>
        </div>
    );
}

function formatNumber(val: number): string {
    return new Intl.NumberFormat("sk-SK").format(val);
}
