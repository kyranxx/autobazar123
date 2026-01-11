"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface SoldCar {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    soldAt: Date;
    location: string;
    image: string | null;
}

// Demo sold cars when database is empty
const DEMO_SOLD_CARS: SoldCar[] = [
    {
        id: "sold1",
        brand: "Mazda",
        model: "CX-5",
        year: 2021,
        price: 26900,
        soldAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        location: "Bratislava",
        image: "https://images.unsplash.com/photo-1612544448445-b8232cff3b4c?w=400&q=80",
    },
    {
        id: "sold2",
        brand: "Ford",
        model: "Focus ST",
        year: 2020,
        price: 18500,
        soldAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        location: "Martin",
        image: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&q=80",
    },
    {
        id: "sold3",
        brand: "Peugeot",
        model: "3008 GT",
        year: 2022,
        price: 31200,
        soldAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        location: "Košice",
        image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&q=80",
    },
    {
        id: "sold4",
        brand: "Hyundai",
        model: "Tucson",
        year: 2023,
        price: 29900,
        soldAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        location: "Trenčín",
        image: "https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=400&q=80",
    },
];

export default function RecentlySoldFeed() {
    const [soldCars, setSoldCars] = useState<SoldCar[]>(DEMO_SOLD_CARS);
    const [, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSoldCars = async () => {
            try {
                const supabase = createClient();

                const { data, error } = await supabase
                    .from("ads")
                    .select(`
                        id,
                        year,
                        price_eur,
                        location_city,
                        updated_at,
                        photos_json,
                        brands:brand_id (name),
                        models:model_id (name)
                    `)
                    .eq("status", "sold")
                    .order("updated_at", { ascending: false })
                    .limit(4);

                if (error) throw error;

                interface SoldAdData {
                    id: string;
                    year?: number;
                    price_eur?: number;
                    location_city?: string;
                    updated_at: string;
                    photos_json?: string[];
                    brands?: { name: string };
                    models?: { name: string };
                }

                const formattedCars: SoldCar[] = ((data || []) as unknown as SoldAdData[]).map((ad) => ({
                    id: ad.id,
                    brand: ad.brands?.name || "Neznáma",
                    model: ad.models?.name || "Model",
                    year: ad.year || 0,
                    price: ad.price_eur || 0,
                    soldAt: new Date(ad.updated_at),
                    location: ad.location_city || "Slovensko",
                    image: ad.photos_json?.[0] || null,
                }));

                // Only replace if we have real data
                if (formattedCars.length > 0) {
                    setSoldCars(formattedCars);
                }
            } catch {
                console.log("Using demo sold cars");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSoldCars();
    }, []);

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
    // Use state to avoid Date.now() being called during render
    const [now] = useState(() => Date.now());
    const daysAgo = React.useMemo(() => Math.floor(
        (now - car.soldAt.getTime()) / (1000 * 60 * 60 * 24)
    ), [car.soldAt, now]);

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
                {/* Mini Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-border/50 overflow-hidden">
                    {car.image ? (
                        <Image
                            src={car.image}
                            alt={`${car.brand} ${car.model}`}
                            fill
                            sizes="64px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface-hover to-border opacity-60 flex items-center justify-center">
                            <svg className="w-6 h-6 text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
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
