"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface FeaturedCar {
    id: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    price: number;
    location: string;
    fuel: string;
    transmission: string;
    image: string | null;
    isTopAd: boolean;
}

export default function FeaturedCars() {
    const [cars, setCars] = useState<FeaturedCar[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCars = async () => {
            const supabase = createClient();

            try {
                const { data, error } = await supabase
                    .from("ads")
                    .select(`
                        id,
                        year,
                        price_eur,
                        mileage_km,
                        fuel,
                        transmission,
                        location_city,
                        photos_json,
                        is_top_ad,
                        brands:brand_id (name),
                        models:model_id (name)
                    `)
                    .eq("status", "active")
                    .order("is_top_ad", { ascending: false })
                    .order("created_at", { ascending: false })
                    .limit(6);

                if (error) throw error;

                const formattedCars: FeaturedCar[] = (data || []).map((ad: any) => ({
                    id: ad.id,
                    brand: ad.brands?.name || "Neznáma",
                    model: ad.models?.name || "Model",
                    year: ad.year || 0,
                    mileage: ad.mileage_km || 0,
                    price: ad.price_eur || 0,
                    location: ad.location_city || "Slovensko",
                    fuel: getFuelLabel(ad.fuel),
                    transmission: ad.transmission === "automatic" ? "Automat" : "Manuál",
                    image: ad.photos_json?.[0] || null,
                    isTopAd: ad.is_top_ad || false,
                }));

                setCars(formattedCars);
            } catch (err) {
                console.error("Error fetching featured cars:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCars();
    }, []);

    const getFuelLabel = (fuel: string) => {
        const labels: Record<string, string> = {
            petrol: "Benzín",
            diesel: "Diesel",
            electric: "Elektro",
            hybrid: "Hybrid",
            lpg: "LPG",
        };
        return labels[fuel] || fuel || "N/A";
    };

    if (isLoading) {
        return (
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-5">
                    <div className="h-8 w-48 bg-surface rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="rounded-2xl border border-border bg-white p-4">
                            <div className="aspect-[16/10] bg-surface rounded-lg animate-pulse" />
                            <div className="mt-4 space-y-2">
                                <div className="h-4 bg-surface rounded w-3/4 animate-pulse" />
                                <div className="h-3 bg-surface rounded w-1/2 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (cars.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                        Odporúčané ponuky
                    </h2>
                    <p className="mt-2 text-secondary">
                        Najlepšie overené autá práve teraz
                    </p>
                </div>
                <Link
                    href="/auta"
                    className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover"
                >
                    Zobraziť všetky
                    <span>→</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cars.map((car, index) => (
                    <CarCard key={car.id} car={car} index={index} />
                ))}
            </div>

            <div className="mt-5 text-center sm:hidden">
                <Link
                    href="/auta"
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent"
                >
                    Zobraziť všetky ponuky →
                </Link>
            </div>
        </section>
    );
}

interface CarCardProps {
    car: FeaturedCar;
    index: number;
}

function CarCard({ car, index }: CarCardProps) {
    const handleSaveClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Redirect to login or save the car
        window.location.href = `/auth/login?redirect=/auto/${car.id}`;
    };

    return (
        <Link
            href={`/auto/${car.id}`}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:border-accent/40 hover:shadow-xl transition-all duration-300 opacity-0 animate-slide-in-up`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
        >
            {/* Image Container */}
            <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                {car.image ? (
                    <img
                        src={car.image}
                        alt={`${car.brand} ${car.model}`}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-hover group-hover:scale-105 transition-transform duration-500" />
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {car.isTopAd && (
                        <span className="px-2.5 py-1 bg-accent text-white text-xs font-semibold rounded-full shadow-lg">
                            TOP
                        </span>
                    )}
                </div>

                {/* Heart button */}
                <button
                    className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white hover:scale-110 transition-all duration-200"
                    onClick={handleSaveClick}
                >
                    <HeartIcon />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
                {/* Title & Price */}
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-primary truncate group-hover:text-accent transition-colors">
                            {car.brand} {car.model}
                        </h3>
                        <p className="mt-0.5 text-sm text-secondary">
                            {car.year} • {formatMileage(car.mileage)} km
                        </p>
                    </div>
                    <span className="flex-shrink-0 text-lg font-bold text-accent">
                        {formatPrice(car.price)}
                    </span>
                </div>

                {/* Details */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <Tag>{car.fuel}</Tag>
                    <Tag>{car.transmission}</Tag>
                    <Tag icon={<LocationIcon />}>{car.location}</Tag>
                </div>
            </div>
        </Link>
    );
}

function Tag({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-xs font-medium text-secondary">
            {icon}
            {children}
        </span>
    );
}

function HeartIcon() {
    return (
        <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}

function LocationIcon() {
    return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

function formatMileage(km: number): string {
    return new Intl.NumberFormat("sk-SK").format(km);
}
