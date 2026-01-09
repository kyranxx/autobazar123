"use client";

import Link from "next/link";

// Mock data - will be replaced with Supabase data
const featuredCars = [
    {
        id: "1",
        brand: "Škoda",
        model: "Octavia Combi",
        year: 2023,
        mileage: 15000,
        price: 24900,
        location: "Bratislava",
        fuel: "Diesel",
        transmission: "Automat",
        image: null, // Placeholder
        isTopAd: true,
    },
    {
        id: "2",
        brand: "Volkswagen",
        model: "Golf 8",
        year: 2022,
        mileage: 32000,
        price: 21500,
        location: "Košice",
        fuel: "Benzín",
        transmission: "Manuál",
        image: null,
        isTopAd: true,
    },
    {
        id: "3",
        brand: "Audi",
        model: "A4 Avant",
        year: 2021,
        mileage: 45000,
        price: 32900,
        location: "Žilina",
        fuel: "Diesel",
        transmission: "Automat",
        image: null,
        isTopAd: false,
    },
    {
        id: "4",
        brand: "BMW",
        model: "320d xDrive",
        year: 2022,
        mileage: 28000,
        price: 38500,
        location: "Nitra",
        fuel: "Diesel",
        transmission: "Automat",
        image: null,
        isTopAd: false,
    },
    {
        id: "5",
        brand: "Mercedes-Benz",
        model: "C 200",
        year: 2021,
        mileage: 52000,
        price: 35900,
        location: "Trnava",
        fuel: "Benzín",
        transmission: "Automat",
        image: null,
        isTopAd: true,
    },
    {
        id: "6",
        brand: "Toyota",
        model: "RAV4 Hybrid",
        year: 2023,
        mileage: 18000,
        price: 41200,
        location: "Prešov",
        fuel: "Hybrid",
        transmission: "Automat",
        image: null,
        isTopAd: false,
    },
];

export default function FeaturedCars() {
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
                {featuredCars.map((car, index) => (
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
    car: (typeof featuredCars)[0];
    index: number;
}

function CarCard({ car, index }: CarCardProps) {
    return (
        <Link
            href={`/auto/${car.id}`}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background hover:border-accent/30 hover:shadow-xl transition-all duration-300 opacity-0 animate-slide-in-up`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
        >
            {/* Image Container */}
            <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                {/* Placeholder gradient - will be replaced with actual images */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-hover group-hover:scale-105 transition-transform duration-500" />

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
                    onClick={(e) => {
                        e.preventDefault();
                        // TODO: Add to favorites
                    }}
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
