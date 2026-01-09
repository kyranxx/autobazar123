"use client";

import { useState, useEffect, useMemo } from "react";
import CarCard, { CarCardData } from "@/components/CarCard";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";
import { createClient } from "@/lib/supabase/client";

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
    const [isLoading, setIsLoading] = useState(true);
    const [cars, setCars] = useState<CarCardData[]>([]);
    const [brands, setBrands] = useState(MOCK_BRANDS);
    const [models, setModels] = useState(MOCK_MODELS);

    // Fetch real data from Supabase
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const supabase = createClient();

            try {
                // Fetch brands
                const { data: brandsData } = await supabase
                    .from("brands")
                    .select("id, name, slug")
                    .order("name");

                if (brandsData && brandsData.length > 0) {
                    setBrands(brandsData);
                }

                // Fetch models
                const { data: modelsData } = await supabase
                    .from("models")
                    .select("id, name, brand_id")
                    .order("name");

                if (modelsData && modelsData.length > 0) {
                    setModels(modelsData);
                }

                // Build query for cars
                let query = supabase
                    .from("ads")
                    .select(`
                        id,
                        year,
                        price_eur,
                        mileage_km,
                        fuel,
                        transmission,
                        body_style,
                        power_kw,
                        location_city,
                        photos_json,
                        is_top_ad,
                        is_highlighted,
                        is_vat_deductible,
                        has_service_book,
                        not_crashed,
                        is_bought_in_sk,
                        created_at,
                        brands:brand_id (id, name),
                        models:model_id (id, name)
                    `)
                    .eq("status", "active");

                // Apply sorting
                if (sortBy === "newest") {
                    query = query.order("created_at", { ascending: false });
                } else if (sortBy === "price_asc") {
                    query = query.order("price_eur", { ascending: true });
                } else if (sortBy === "price_desc") {
                    query = query.order("price_eur", { ascending: false });
                } else if (sortBy === "mileage_asc") {
                    query = query.order("mileage_km", { ascending: true });
                } else if (sortBy === "year_desc") {
                    query = query.order("year", { ascending: false });
                }

                query = query.limit(50);

                const { data: adsData, error } = await query;

                if (error) throw error;

                const formattedCars: CarCardData[] = (adsData || []).map((ad: any) => ({
                    id: ad.id,
                    brand: ad.brands?.name || "Neznáma",
                    model: ad.models?.name || "Model",
                    generation: "",
                    year: ad.year || 0,
                    price_eur: ad.price_eur || 0,
                    mileage_km: ad.mileage_km || 0,
                    fuel: ad.fuel || "",
                    transmission: ad.transmission || "",
                    body_style: ad.body_style || "",
                    power_kw: ad.power_kw || 0,
                    location_city: ad.location_city || "",
                    photos_json: ad.photos_json || [],
                    is_top_ad: ad.is_top_ad || false,
                    is_highlighted: ad.is_highlighted || false,
                    is_vat_deductible: ad.is_vat_deductible || false,
                    has_service_book: ad.has_service_book || false,
                    not_crashed: ad.not_crashed || false,
                    is_bought_in_sk: ad.is_bought_in_sk || false,
                }));

                setCars(formattedCars);
            } catch (err) {
                console.error("Error fetching cars:", err);
                // Fall back to mock data
                setCars(MOCK_CARS);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [sortBy]);

    // Filter cars
    const filteredCars = useMemo(() => {
        let result = [...cars];

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
    }, [filters, sortBy, cars, brands, models]);

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
        <main className="pt-16 pb-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="py-5">
                    <h1 className="text-2xl font-bold text-primary sm:text-3xl">
                        Vyhľadávanie áut
                    </h1>
                    <p className="mt-2 text-secondary">
                        {filteredCars.length} {filteredCars.length === 1 ? "vozidlo" : filteredCars.length < 5 ? "vozidlá" : "vozidiel"} v ponuke
                    </p>
                </div>

                <div className="flex gap-6 overflow-hidden">
                    {/* Filter Sidebar */}
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={setFilters}
                        brands={brands}
                        models={models}
                        isMobileOpen={mobileFilterOpen}
                        onMobileClose={() => setMobileFilterOpen(false)}
                    />

                    {/* Results Section */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        <div className="sticky top-20 z-30 mb-4 p-4 rounded-2xl border border-border bg-white/95 backdrop-blur-sm shadow-lg">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                {/* Left side - Filter button & Results count */}
                                <div className="flex items-center gap-4">
                                    {/* Mobile Filter Button */}
                                    <button
                                        onClick={() => setMobileFilterOpen(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 lg:hidden"
                                    >
                                        <FilterIcon className="w-4 h-4" />
                                        Filtre
                                        {activeFilterCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Results count - desktop */}
                                    <div className="hidden sm:flex items-center gap-2 text-sm text-secondary">
                                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                                        <span className="font-medium text-primary">{filteredCars.length}</span>
                                        <span>{filteredCars.length === 1 ? "výsledok" : filteredCars.length < 5 ? "výsledky" : "výsledkov"}</span>
                                    </div>
                                </div>

                                {/* Right side - Sort & View controls */}
                                <div className="flex items-center gap-3">
                                    {/* Sort Dropdown */}
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors">
                                        <SortIcon className="w-4 h-4 text-accent" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="bg-transparent text-sm font-medium text-primary focus:outline-none cursor-pointer appearance-none pr-6"
                                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', backgroundSize: '1.25rem' }}
                                        >
                                            {SORT_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* View Toggle */}
                                    <div className="hidden sm:flex items-center gap-1 p-1.5 rounded-xl bg-surface border border-border">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={`p-2 rounded-lg transition-all ${viewMode === "grid"
                                                ? "bg-accent text-white shadow-sm"
                                                : "text-secondary hover:text-primary hover:bg-background"
                                                }`}
                                            aria-label="Grid view"
                                        >
                                            <GridIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={`p-2 rounded-lg transition-all ${viewMode === "list"
                                                ? "bg-accent text-white shadow-sm"
                                                : "text-secondary hover:text-primary hover:bg-background"
                                                }`}
                                            aria-label="List view"
                                        >
                                            <ListIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Active filters chips - show when filters are applied */}
                            {activeFilterCount > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                                    <span className="text-xs text-secondary">Aktívne filtre:</span>
                                    {filters.brand_id && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                            Značka
                                            <button onClick={() => setFilters({ ...filters, brand_id: undefined, model_id: undefined })} className="ml-1 hover:text-error">×</button>
                                        </span>
                                    )}
                                    {(filters.price_from || filters.price_to) && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                            Cena
                                            <button onClick={() => setFilters({ ...filters, price_from: undefined, price_to: undefined })} className="ml-1 hover:text-error">×</button>
                                        </span>
                                    )}
                                    {(filters.year_from || filters.year_to) && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                            Rok
                                            <button onClick={() => setFilters({ ...filters, year_from: undefined, year_to: undefined })} className="ml-1 hover:text-error">×</button>
                                        </span>
                                    )}
                                    {filters.fuel && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                            Palivo
                                            <button onClick={() => setFilters({ ...filters, fuel: undefined })} className="ml-1 hover:text-error">×</button>
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setFilters({})}
                                        className="text-xs text-error hover:underline font-medium"
                                    >
                                        Vymazať všetky
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Results Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                                className={`grid gap-4 ${viewMode === "grid"
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
                            <div className="flex items-center justify-center gap-2 mt-8">
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

function SortIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m0 0l4 4m-4-4l4-4" />
        </svg>
    );
}
