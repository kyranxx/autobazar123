"use client";

import { useState, useEffect, useMemo } from "react";
import CarCard, { CarCardData } from "@/components/CarCard";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";

// Mock data for demonstration - will be replaced with Supabase queries
const MOCK_BRANDS = [
    { id: "1", name: "Škoda", slug: "skoda" },
    { id: "2", name: "Volkswagen", slug: "volkswagen" },
    { id: "3", name: "BMW", slug: "bmw" },
    { id: "4", name: "Audi", slug: "audi" },
    { id: "5", name: "Mercedes-Benz", slug: "mercedes-benz" },
    { id: "6", name: "Toyota", slug: "toyota" },
    { id: "7", name: "Ford", slug: "ford" },
    { id: "8", name: "Opel", slug: "opel" },
    { id: "9", name: "Peugeot", slug: "peugeot" },
    { id: "10", name: "Renault", slug: "renault" },
    { id: "11", name: "Hyundai", slug: "hyundai" },
    { id: "12", name: "Kia", slug: "kia" },
];

const MOCK_MODELS = [
    { id: "m1", name: "Octavia", brand_id: "1" },
    { id: "m2", name: "Fabia", brand_id: "1" },
    { id: "m3", name: "Superb", brand_id: "1" },
    { id: "m4", name: "Kodiaq", brand_id: "1" },
    { id: "m5", name: "Golf", brand_id: "2" },
    { id: "m6", name: "Passat", brand_id: "2" },
    { id: "m7", name: "Tiguan", brand_id: "2" },
    { id: "m8", name: "Rad 3", brand_id: "3" },
    { id: "m9", name: "Rad 5", brand_id: "3" },
    { id: "m10", name: "X3", brand_id: "3" },
    { id: "m11", name: "A4", brand_id: "4" },
    { id: "m12", name: "A6", brand_id: "4" },
    { id: "m13", name: "Q5", brand_id: "4" },
];

// Mock car data - will be replaced with Supabase data
const MOCK_CARS: CarCardData[] = [
    {
        id: "car1",
        brand: "Škoda",
        model: "Octavia",
        generation: "III Facelift",
        year: 2019,
        price_eur: 16990,
        mileage_km: 89000,
        fuel: "diesel",
        transmission: "automatic",
        location_city: "Bratislava",
        photos_json: [
            "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80",
        ],
        power_kw: 110,
        is_top_ad: true,
        is_highlighted: false,
        is_vat_deductible: false,
        has_service_book: true,
        not_crashed: true,
        is_bought_in_sk: true,
    },
    {
        id: "car2",
        brand: "BMW",
        model: "Rad 3",
        generation: "G20",
        year: 2021,
        price_eur: 34990,
        mileage_km: 45000,
        fuel: "diesel",
        transmission: "automatic",
        location_city: "Košice",
        photos_json: [
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
        ],
        power_kw: 140,
        is_top_ad: false,
        is_highlighted: true,
        is_vat_deductible: true,
        has_service_book: true,
        not_crashed: true,
        is_bought_in_sk: false,
    },
    {
        id: "car3",
        brand: "Volkswagen",
        model: "Golf",
        generation: "VIII",
        year: 2020,
        price_eur: 21500,
        mileage_km: 62000,
        fuel: "petrol",
        transmission: "manual",
        location_city: "Žilina",
        photos_json: [
            "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800&q=80",
        ],
        power_kw: 96,
        is_top_ad: false,
        is_highlighted: false,
        is_vat_deductible: false,
        has_service_book: true,
        not_crashed: true,
        is_bought_in_sk: true,
    },
    {
        id: "car4",
        brand: "Audi",
        model: "A4",
        generation: "B9",
        year: 2018,
        price_eur: 24900,
        mileage_km: 105000,
        fuel: "diesel",
        transmission: "automatic",
        location_city: "Nitra",
        photos_json: [
            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
        ],
        power_kw: 140,
        is_top_ad: false,
        is_highlighted: false,
        is_vat_deductible: false,
        has_service_book: false,
        not_crashed: true,
        is_bought_in_sk: true,
    },
    {
        id: "car5",
        brand: "Toyota",
        model: "Corolla",
        generation: "E210",
        year: 2022,
        price_eur: 22990,
        mileage_km: 28000,
        fuel: "hybrid",
        transmission: "automatic",
        location_city: "Trnava",
        photos_json: [
            "https://images.unsplash.com/photo-1621993202323-f438eec934ff?w=800&q=80",
        ],
        power_kw: 90,
        is_top_ad: true,
        is_highlighted: false,
        is_vat_deductible: false,
        has_service_book: true,
        not_crashed: true,
        is_bought_in_sk: false,
    },
    {
        id: "car6",
        brand: "Mercedes-Benz",
        model: "C-Class",
        generation: "W205",
        year: 2017,
        price_eur: 27500,
        mileage_km: 125000,
        fuel: "diesel",
        transmission: "automatic",
        location_city: "Prešov",
        photos_json: [
            "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
        ],
        power_kw: 125,
        is_top_ad: false,
        is_highlighted: false,
        is_vat_deductible: true,
        has_service_book: true,
        not_crashed: false,
        is_bought_in_sk: true,
    },
    {
        id: "car7",
        brand: "Škoda",
        model: "Kodiaq",
        generation: "I Facelift",
        year: 2022,
        price_eur: 38990,
        mileage_km: 35000,
        fuel: "diesel",
        transmission: "automatic",
        location_city: "Bratislava",
        photos_json: [
            "https://images.unsplash.com/photo-1619976215249-0df5a6f9c1ec?w=800&q=80",
        ],
        power_kw: 147,
        is_top_ad: false,
        is_highlighted: true,
        is_vat_deductible: false,
        has_service_book: true,
        not_crashed: true,
        is_bought_in_sk: true,
    },
    {
        id: "car8",
        brand: "Ford",
        model: "Focus",
        generation: "IV",
        year: 2019,
        price_eur: 14500,
        mileage_km: 92000,
        fuel: "petrol",
        transmission: "manual",
        location_city: "Banská Bystrica",
        photos_json: [
            "https://images.unsplash.com/photo-1551830820-330a71b99659?w=800&q=80",
        ],
        power_kw: 92,
        is_top_ad: false,
        is_highlighted: false,
        is_vat_deductible: false,
        has_service_book: false,
        not_crashed: true,
        is_bought_in_sk: true,
    },
];

type SortOption = "newest" | "price_asc" | "price_desc" | "mileage_asc" | "year_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Najnovšie" },
    { value: "price_asc", label: "Najlacnejšie" },
    { value: "price_desc", label: "Najdrahšie" },
    { value: "mileage_asc", label: "Najmenej najazdených" },
    { value: "year_desc", label: "Najnovšie ročníky" },
];

export default function SearchPageClient() {
    const [filters, setFilters] = useState<FilterState>({});
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [savedCars, setSavedCars] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isLoading, setIsLoading] = useState(false);

    // Filter and sort cars
    const filteredCars = useMemo(() => {
        let result = [...MOCK_CARS];

        // Apply filters
        if (filters.brand_id) {
            const brand = MOCK_BRANDS.find((b) => b.id === filters.brand_id);
            if (brand) {
                result = result.filter((car) => car.brand === brand.name);
            }
        }
        if (filters.model_id) {
            const model = MOCK_MODELS.find((m) => m.id === filters.model_id);
            if (model) {
                result = result.filter((car) => car.model === model.name);
            }
        }
        if (filters.year_from) {
            result = result.filter((car) => car.year >= filters.year_from!);
        }
        if (filters.year_to) {
            result = result.filter((car) => car.year <= filters.year_to!);
        }
        if (filters.price_from) {
            result = result.filter((car) => car.price_eur >= filters.price_from!);
        }
        if (filters.price_to) {
            result = result.filter((car) => car.price_eur <= filters.price_to!);
        }
        if (filters.mileage_from) {
            result = result.filter((car) => car.mileage_km >= filters.mileage_from!);
        }
        if (filters.mileage_to) {
            result = result.filter((car) => car.mileage_km <= filters.mileage_to!);
        }
        if (filters.fuel) {
            result = result.filter((car) => car.fuel === filters.fuel);
        }
        if (filters.transmission) {
            result = result.filter((car) => car.transmission === filters.transmission);
        }
        if (filters.is_bought_in_sk) {
            result = result.filter((car) => car.is_bought_in_sk);
        }
        if (filters.has_service_book) {
            result = result.filter((car) => car.has_service_book);
        }
        if (filters.not_crashed) {
            result = result.filter((car) => car.not_crashed);
        }

        // Sort - TOP ads always first
        result.sort((a, b) => {
            if (a.is_top_ad && !b.is_top_ad) return -1;
            if (!a.is_top_ad && b.is_top_ad) return 1;

            switch (sortBy) {
                case "price_asc":
                    return a.price_eur - b.price_eur;
                case "price_desc":
                    return b.price_eur - a.price_eur;
                case "mileage_asc":
                    return a.mileage_km - b.mileage_km;
                case "year_desc":
                    return b.year - a.year;
                case "newest":
                default:
                    return 0;
            }
        });

        return result;
    }, [filters, sortBy]);

    const handleSaveCar = (carId: string) => {
        setSavedCars((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(carId)) {
                newSet.delete(carId);
            } else {
                newSet.add(carId);
            }
            return newSet;
        });
    };

    const activeFilterCount = Object.values(filters).filter(
        (v) => v !== undefined && v !== ""
    ).length;

    return (
        <main className="pt-20 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="py-8">
                    <h1 className="text-2xl font-bold text-primary sm:text-3xl">
                        Vyhľadávanie áut
                    </h1>
                    <p className="mt-2 text-secondary">
                        {filteredCars.length} {filteredCars.length === 1 ? "vozidlo" : filteredCars.length < 5 ? "vozidlá" : "vozidiel"} v ponuke
                    </p>
                </div>

                <div className="flex gap-8 overflow-hidden">
                    {/* Filter Sidebar */}
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={setFilters}
                        brands={MOCK_BRANDS}
                        models={MOCK_MODELS}
                        isMobileOpen={mobileFilterOpen}
                        onMobileClose={() => setMobileFilterOpen(false)}
                    />

                    {/* Results Section */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl border border-border bg-surface/50">
                            {/* Mobile Filter Button */}
                            <button
                                onClick={() => setMobileFilterOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-primary hover:bg-surface lg:hidden"
                            >
                                <FilterIcon className="w-4 h-4" />
                                Filtre
                                {activeFilterCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-xs">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-secondary hidden sm:block">
                                    Zoradiť:
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* View Toggle */}
                            <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-surface">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-md transition-colors ${viewMode === "grid"
                                        ? "bg-background shadow-sm text-primary"
                                        : "text-secondary hover:text-primary"
                                        }`}
                                    aria-label="Grid view"
                                >
                                    <GridIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-md transition-colors ${viewMode === "list"
                                        ? "bg-background shadow-sm text-primary"
                                        : "text-secondary hover:text-primary"
                                        }`}
                                    aria-label="List view"
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Results Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div
                                        key={i}
                                        className="rounded-2xl border border-border overflow-hidden animate-pulse"
                                    >
                                        <div className="aspect-[16/10] bg-surface" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-5 bg-surface rounded w-3/4" />
                                            <div className="h-4 bg-surface rounded w-1/2" />
                                            <div className="h-4 bg-surface rounded w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredCars.length === 0 ? (
                            <div className="text-center py-16">
                                <NoResultsIcon className="w-16 h-16 mx-auto text-tertiary" />
                                <h3 className="mt-4 text-lg font-semibold text-primary">
                                    Žiadne výsledky
                                </h3>
                                <p className="mt-2 text-secondary max-w-md mx-auto">
                                    Pre zadané filtre sa nenašli žiadne vozidlá. Skúste zmeniť
                                    kritériá vyhľadávania.
                                </p>
                                <button
                                    onClick={() => setFilters({})}
                                    className="mt-6 px-6 py-2.5 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                                >
                                    Vymazať filtre
                                </button>
                            </div>
                        ) : (
                            <div
                                className={`grid gap-6 ${viewMode === "grid"
                                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                                    : "grid-cols-1"
                                    }`}
                            >
                                {filteredCars.map((car, index) => (
                                    <div
                                        key={car.id}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <CarCard
                                            car={car}
                                            onSave={handleSaveCar}
                                            isSaved={savedCars.has(car.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Placeholder */}
                        {filteredCars.length > 0 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                <button
                                    disabled
                                    className="px-4 py-2 rounded-lg border border-border text-secondary cursor-not-allowed opacity-50"
                                >
                                    Predchádzajúca
                                </button>
                                <div className="flex items-center gap-1">
                                    <button className="w-10 h-10 rounded-lg bg-accent text-white font-semibold">
                                        1
                                    </button>
                                    <button className="w-10 h-10 rounded-lg border border-border text-primary hover:bg-surface">
                                        2
                                    </button>
                                    <button className="w-10 h-10 rounded-lg border border-border text-primary hover:bg-surface">
                                        3
                                    </button>
                                    <span className="px-2 text-secondary">...</span>
                                    <button className="w-10 h-10 rounded-lg border border-border text-primary hover:bg-surface">
                                        12
                                    </button>
                                </div>
                                <button className="px-4 py-2 rounded-lg border border-border text-primary hover:bg-surface">
                                    Ďalšia
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

// Icons
function FilterIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
    );
}

function GridIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    );
}

function ListIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
    );
}

function NoResultsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
    );
}
