"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface SoldCar {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    soldAt: Date;
    location: string;
}

export default function RecentlySoldFeed() {
    const [soldCars, setSoldCars] = useState<SoldCar[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSoldCars = async () => {
            const supabase = createClient();

            try {
                const { data, error } = await supabase
                    .from("ads")
                    .select(`
                        id,
                        year,
                        price_eur,
                        location_city,
                        updated_at,
                        brands:brand_id (name),
                        models:model_id (name)
                    `)
                    .eq("status", "sold")
                    .order("updated_at", { ascending: false })
                    .limit(4);

                if (error) throw error;

                const formattedCars: SoldCar[] = (data || []).map((ad: any) => ({
                    id: ad.id,
                    brand: ad.brands?.name || "Neznáma",
                    model: ad.models?.name || "Model",
                    year: ad.year || 0,
                    price: ad.price_eur || 0,
                    soldAt: new Date(ad.updated_at),
                    location: ad.location_city || "Slovensko",
                }));

                setSoldCars(formattedCars);
            } catch (err) {
                console.error("Error fetching sold cars:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSoldCars();
    }, []);

    if (isLoading) {
        return (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-6">
                    <div className="h-8 w-48 mx-auto bg-surface rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-xl border border-border p-4">
                            <div className="h-20 bg-surface rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (soldCars.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
                    Aktívny trh
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                    Práve predané
                </h2>
                <p className="mt-3 text-secondary max-w-xl mx-auto">
                    Tieto autá si už našli nových majiteľov. Pridajte sa k tisícom spokojných zákazníkov!
                </p>
            </div>

            {/* Sold Cars Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {soldCars.map((car, index) => (
                    <SoldCarCard key={car.id} car={car} index={index} />
                ))}
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
                <Link
                    href="/pridat-inzerat"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-background font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                >
                    <span>Predajte aj vy svoje auto</span>
                    <span>→</span>
                </Link>
                <p className="mt-3 text-sm text-secondary">
                    Priemerná doba predaja: 7 dní
                </p>
            </div>
        </section>
    );
}

interface SoldCarCardProps {
    car: SoldCar;
    index: number;
}

function SoldCarCard({ car, index }: SoldCarCardProps) {
    const daysAgo = React.useMemo(() => Math.floor(
        (Date.now() - car.soldAt.getTime()) / (1000 * 60 * 60 * 24)
    ), [car.soldAt]);

    return (
        <div
            className="group relative overflow-hidden rounded-xl border border-border bg-white shadow-sm p-4 opacity-0 animate-slide-in-up"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
        >
            {/* Sold Badge */}
            <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
                    <CheckIcon />
                    Predané
                </span>
            </div>

            {/* Content */}
            <div className="flex items-start gap-4">
                {/* Mini Thumbnail Placeholder */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-border/50 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-surface-hover to-border opacity-60" />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-primary truncate">
                        {car.brand} {car.model}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                        {car.year} • {car.location}
                    </p>
                    <p className="text-sm font-bold text-primary mt-2">
                        {formatPrice(car.price)}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <p className="mt-3 pt-3 border-t border-border text-[11px] text-tertiary text-center">
                {daysAgo === 0
                    ? "Predané dnes"
                    : daysAgo === 1
                        ? "Predané včera"
                        : `Predané pred ${daysAgo} dňami`}
                {" "}na Autobazar123
            </p>
        </div>
    );
}

function CheckIcon() {
    return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("sk-SK", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}
