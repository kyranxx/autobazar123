"use client";

import { ReactNode, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    RefinementList,
    RangeInput,
    Stats,
    Pagination,
    ClearRefinements,
    useInstantSearch,
    useSearchBox,
    SortBy,
    CurrentRefinements,
    ToggleRefinement,
    useRefinementList,
    useRange,
} from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { searchClient, CARS_INDEX, AlgoliaCarRecord } from "@/lib/algolia";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

// Brand aliases mapping - handles accented characters and common abbreviations
const BRAND_ALIASES: Record<string, string> = {
    // Slovak/Czech accented versions
    "skoda": "Škoda",
    "škoda": "Škoda",
    // Common abbreviations
    "vw": "Volkswagen",
    "volkswagen": "Volkswagen",
    "mb": "Mercedes-Benz",
    "mercedes": "Mercedes-Benz",
    "mercedes-benz": "Mercedes-Benz",
    // Standard brands
    "bmw": "BMW",
    "audi": "Audi",
    "toyota": "Toyota",
    "honda": "Honda",
    "ford": "Ford",
    "opel": "Opel",
    "peugeot": "Peugeot",
    "renault": "Renault",
    "citroen": "Citroën",
    "citroën": "Citroën",
    "fiat": "Fiat",
    "hyundai": "Hyundai",
    "kia": "Kia",
    "mazda": "Mazda",
    "nissan": "Nissan",
    "volvo": "Volvo",
    "seat": "SEAT",
    "alfa": "Alfa Romeo",
    "alfa romeo": "Alfa Romeo",
    "dacia": "Dacia",
    "suzuki": "Suzuki",
    "mitsubishi": "Mitsubishi",
    "subaru": "Subaru",
    "lexus": "Lexus",
    "porsche": "Porsche",
    "jaguar": "Jaguar",
    "land rover": "Land Rover",
    "landrover": "Land Rover",
    "jeep": "Jeep",
    "mini": "MINI",
    "smart": "Smart",
    "tesla": "Tesla",
    "chevrolet": "Chevrolet",
    "dodge": "Dodge",
    "cupra": "Cupra",
};

// Common model aliases
const MODEL_ALIASES: Record<string, string> = {
    "octavia": "Octavia",
    "fabia": "Fabia",
    "superb": "Superb",
    "kodiaq": "Kodiaq",
    "karoq": "Karoq",
    "scala": "Scala",
    "kamiq": "Kamiq",
    "enyaq": "Enyaq",
    "golf": "Golf",
    "passat": "Passat",
    "tiguan": "Tiguan",
    "polo": "Polo",
    "touran": "Touran",
    "a3": "A3",
    "a4": "A4",
    "a5": "A5",
    "a6": "A6",
    "q3": "Q3",
    "q5": "Q5",
    "q7": "Q7",
    "focus": "Focus",
    "fiesta": "Fiesta",
    "mondeo": "Mondeo",
    "kuga": "Kuga",
    "corsa": "Corsa",
    "astra": "Astra",
    "insignia": "Insignia",
    "mokka": "Mokka",
    "208": "208",
    "308": "308",
    "3008": "3008",
    "clio": "Clio",
    "megane": "Megane",
    "captur": "Captur",
    "i30": "i30",
    "tucson": "Tucson",
    "sportage": "Sportage",
    "ceed": "Ceed",
    "yaris": "Yaris",
    "corolla": "Corolla",
    "rav4": "RAV4",
};

// Normalize text for matching (remove accents, lowercase)
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// Find matching brand from query
function findBrandInQuery(query: string, availableBrands: string[]): string | null {
    const normalizedQuery = normalizeText(query);
    const words = normalizedQuery.split(/\s+/);

    // Check each word against brand aliases
    for (const word of words) {
        if (BRAND_ALIASES[word]) {
            const matchedBrand = BRAND_ALIASES[word];
            if (availableBrands.some(b => b === matchedBrand)) {
                return matchedBrand;
            }
        }
    }

    // Check two-word combinations (e.g., "alfa romeo")
    for (let i = 0; i < words.length - 1; i++) {
        const twoWords = `${words[i]} ${words[i + 1]}`;
        if (BRAND_ALIASES[twoWords]) {
            const matchedBrand = BRAND_ALIASES[twoWords];
            if (availableBrands.some(b => b === matchedBrand)) {
                return matchedBrand;
            }
        }
    }

    // Direct match against available brands
    for (const brand of availableBrands) {
        const normalizedBrand = normalizeText(brand);
        if (words.some(w => w === normalizedBrand)) {
            return brand;
        }
    }

    return null;
}

// Find matching model from query
function findModelInQuery(query: string, availableModels: string[], brandToRemove?: string): string | null {
    let normalizedQuery = normalizeText(query);

    // Remove brand from query
    if (brandToRemove) {
        const normalizedBrand = normalizeText(brandToRemove);
        normalizedQuery = normalizedQuery.replace(new RegExp(normalizedBrand, 'g'), "").trim();
        // Also remove alias versions
        for (const [alias, brand] of Object.entries(BRAND_ALIASES)) {
            if (brand === brandToRemove) {
                normalizedQuery = normalizedQuery.replace(new RegExp(alias, 'g'), "").trim();
            }
        }
    }

    const words = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

    // Check against model aliases
    for (const word of words) {
        if (MODEL_ALIASES[word]) {
            const matchedModel = MODEL_ALIASES[word];
            if (availableModels.some(m => m === matchedModel)) {
                return matchedModel;
            }
        }
    }

    // Direct match against available models
    for (const model of availableModels) {
        const normalizedModel = normalizeText(model);
        if (words.some(w => w === normalizedModel)) {
            return model;
        }
    }

    return null;
}

// Wrapper component that provides InstantSearch context
export function AlgoliaSearchProvider({
    children,
    initialQuery = "",
}: {
    children: ReactNode;
    initialQuery?: string;
}) {
    return (
        <InstantSearchNext
            searchClient={searchClient}
            indexName={CARS_INDEX}
            initialUiState={{
                [CARS_INDEX]: {
                    query: initialQuery,
                },
            }}
            future={{ preserveSharedStateOnUnmount: true }}
        >
            {children}
        </InstantSearchNext>
    );
}

// Big hero search bar for homepage
export function HeroSearchBar() {
    const router = useRouter();
    const t = useTranslations("search");
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/auta?q=${encodeURIComponent(query.trim())}`);
        } else {
            router.push("/auta");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        // Navigate immediately when typing (instant search behavior)
        if (value.length >= 2) {
            // Debounce navigation to avoid too many URL updates
            const timeout = setTimeout(() => {
                router.push(`/auta?q=${encodeURIComponent(value.trim())}`);
            }, 300);
            return () => clearTimeout(timeout);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div
                className={`relative flex items-center gap-3 p-2 rounded-2xl border-2 transition-all duration-300 bg-white shadow-2xl ${isFocused
                    ? "border-accent shadow-accent/20"
                    : "border-border hover:border-accent/50"
                    }`}
            >
                {/* Search Icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-blue-600 text-white shrink-0">
                    <SearchIcon className="w-7 h-7" />
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    id="hero-search-input"
                    name="q"
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={t("placeholder") || "Škoda Octavia, BMW, Audi A4..."}
                    className="flex-1 text-lg md:text-xl font-medium text-primary placeholder:text-secondary/60 bg-transparent focus:outline-none py-3"
                    autoComplete="off"
                />

                {/* Clear button */}
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="p-2 rounded-full hover:bg-surface transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-secondary" />
                    </button>
                )}

                {/* Search Button */}
                <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-blue-600 text-white font-bold hover:from-accent-hover hover:to-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                    <span className="hidden sm:inline">{t("search")}</span>
                    <ArrowIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Quick suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-sm text-secondary">Populárne:</span>
                {["Škoda Octavia", "BMW", "Audi A4", "Mercedes", "VW Golf"].map((suggestion) => (
                    <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                            setQuery(suggestion);
                            router.push(`/auta?q=${encodeURIComponent(suggestion)}`);
                        }}
                        className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </form>
    );
}

// Custom search box for search results page with smart auto-filter selection
export function SearchResultsSearchBox() {
    const { query, refine: refineQuery } = useSearchBox();
    const [inputValue, setInputValue] = useState(query);
    const t = useTranslations("search");

    // Get brand and model refinement lists
    const { items: brandItems, refine: refineBrand } = useRefinementList({ attribute: 'brand' });
    const { items: modelItems, refine: refineModel } = useRefinementList({ attribute: 'model' });

    // Track which refinements we've auto-applied
    const [autoAppliedBrand, setAutoAppliedBrand] = useState<string | null>(null);
    const [autoAppliedModel, setAutoAppliedModel] = useState<string | null>(null);

    useEffect(() => {
        setInputValue(query);
    }, [query]);

    // Auto-apply refinements based on search query
    const applySmartRefinements = useCallback((searchValue: string) => {
        const availableBrands = brandItems.map(item => item.value);
        const availableModels = modelItems.map(item => item.value);

        // Find brand in query
        const detectedBrand = findBrandInQuery(searchValue, availableBrands);

        // Handle brand refinement
        if (detectedBrand) {
            // Check if this brand is already refined
            const brandItem = brandItems.find(item => item.value === detectedBrand);
            if (brandItem && !brandItem.isRefined) {
                // Clear previous auto-applied brand if different
                if (autoAppliedBrand && autoAppliedBrand !== detectedBrand) {
                    const prevBrandItem = brandItems.find(item => item.value === autoAppliedBrand);
                    if (prevBrandItem?.isRefined) {
                        refineBrand(autoAppliedBrand);
                    }
                }
                refineBrand(detectedBrand);
                setAutoAppliedBrand(detectedBrand);
            }
        } else if (autoAppliedBrand) {
            // No brand detected, clear auto-applied brand
            const prevBrandItem = brandItems.find(item => item.value === autoAppliedBrand);
            if (prevBrandItem?.isRefined) {
                refineBrand(autoAppliedBrand);
            }
            setAutoAppliedBrand(null);
        }

        // Find model in query
        const detectedModel = findModelInQuery(searchValue, availableModels, detectedBrand || undefined);

        // Handle model refinement
        if (detectedModel) {
            const modelItem = modelItems.find(item => item.value === detectedModel);
            if (modelItem && !modelItem.isRefined) {
                // Clear previous auto-applied model if different
                if (autoAppliedModel && autoAppliedModel !== detectedModel) {
                    const prevModelItem = modelItems.find(item => item.value === autoAppliedModel);
                    if (prevModelItem?.isRefined) {
                        refineModel(autoAppliedModel);
                    }
                }
                refineModel(detectedModel);
                setAutoAppliedModel(detectedModel);
            }
        } else if (autoAppliedModel) {
            // No model detected, clear auto-applied model
            const prevModelItem = modelItems.find(item => item.value === autoAppliedModel);
            if (prevModelItem?.isRefined) {
                refineModel(autoAppliedModel);
            }
            setAutoAppliedModel(null);
        }
    }, [brandItems, modelItems, refineBrand, refineModel, autoAppliedBrand, autoAppliedModel]);

    // Debounced effect to apply smart refinements
    useEffect(() => {
        if (inputValue.length >= 2) {
            const timeout = setTimeout(() => {
                applySmartRefinements(inputValue);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [inputValue, applySmartRefinements]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        refineQuery(value);
    };

    const handleClear = () => {
        setInputValue("");
        refineQuery("");
        // Clear auto-applied refinements
        if (autoAppliedBrand) {
            const brandItem = brandItems.find(item => item.value === autoAppliedBrand);
            if (brandItem?.isRefined) {
                refineBrand(autoAppliedBrand);
            }
            setAutoAppliedBrand(null);
        }
        if (autoAppliedModel) {
            const modelItem = modelItems.find(item => item.value === autoAppliedModel);
            if (modelItem?.isRefined) {
                refineModel(autoAppliedModel);
            }
            setAutoAppliedModel(null);
        }
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-white shadow-lg focus-within:border-accent focus-within:shadow-accent/10 transition-all">
                <SearchIcon className="w-6 h-6 text-accent" />
                <input
                    id="search-results-input"
                    name="q"
                    type="search"
                    value={inputValue}
                    onChange={handleChange}
                    placeholder={t("placeholder") || "Hľadať autá..."}
                    className="flex-1 text-lg font-medium text-primary placeholder:text-secondary/60 bg-transparent focus:outline-none"
                />
                {inputValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 rounded-full hover:bg-surface transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-secondary" />
                    </button>
                )}
            </div>
            {/* Smart detection indicator */}
            {(autoAppliedBrand || autoAppliedModel) && (
                <div className="flex items-center gap-2 mt-2 text-sm text-secondary">
                    <span className="text-accent">✓</span>
                    <span>
                        {autoAppliedBrand && `Značka: ${autoAppliedBrand}`}
                        {autoAppliedBrand && autoAppliedModel && " • "}
                        {autoAppliedModel && `Model: ${autoAppliedModel}`}
                    </span>
                </div>
            )}
        </div>
    );
}

// Enhanced Car hit component for search results
export function CarHit({ hit }: { hit: AlgoliaCarRecord }) {
    const t = useTranslations("car");
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const firstPhoto = hit.photos_json?.[0] || "/placeholder-car.jpg";

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("sk-SK", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

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

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                            <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                                {hit.brand} {hit.model}
                            </h3>
                            <p className="text-sm text-secondary">
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

                    {/* Trust signals - Enhanced */}
                    {trustSignalsCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {hit.has_service_book && <TrustBadge label={t("serviceBook") || "Servisná knižka"} />}
                            {hit.not_crashed && <TrustBadge label={t("notCrashed") || "Nehavarované"} />}
                            {hit.is_bought_in_sk && <TrustBadge label={t("boughtInSK") || "Kúpené v SR"} />}
                        </div>
                    )}

                    {/* Location */}
                    {hit.location_city && (
                        <p className="text-xs text-secondary mt-3 flex items-center gap-1.5">
                            <LocationIcon className="w-3.5 h-3.5 text-accent" />
                            <span className="font-medium">{hit.location_city}</span>
                        </p>
                    )}
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

function TrustBadge({ label }: { label: string }) {
    return (
        <span className="trust-badge-enhanced">
            <CheckCircleIcon className="w-3 h-3" />
            {label}
        </span>
    );
}

// Faceted filter components with enhanced styling
export function AlgoliaFilters() {
    const t = useTranslations("filters");
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");
    const tBodyType = useTranslations("bodyType");
    const tAddListing = useTranslations("addListing");

    return (
        <div className="space-y-3">
            {/* Clear all refinements - Enhanced */}
            <ClearRefinements
                translations={{
                    resetButtonText: t("clear"),
                }}
                classNames={{
                    button:
                        "w-full px-4 py-2.5 rounded-xl bg-error/10 text-error text-sm font-semibold hover:bg-error/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2",
                }}
            />

            {/* Current refinements - Horizontal scroll on mobile */}
            <div className="active-filters-scroll">
                <CurrentRefinements
                    classNames={{
                        root: "flex flex-wrap gap-2",
                        item: "flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium",
                        delete: "ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-accent/20 hover:text-error transition-colors",
                    }}
                />
            </div>

            {/* Brand and Model filter */}
            <FilterSectionWithCount title={t("brandAndModel")} attribute="brand">
                <RefinementList
                    attribute="brand"
                    searchable
                    searchablePlaceholder="Hľadať značku..."
                    showMore
                    showMoreLimit={30}
                    classNames={{
                        root: "space-y-2",
                        searchBox: "mb-3",
                        list: "space-y-1 max-h-48 overflow-y-auto",
                        item: "flex items-center gap-2",
                        checkbox:
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "flex items-center gap-2 text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                        showMore:
                            "mt-2 text-sm text-accent hover:underline font-medium",
                    }}
                />
                <div className="h-4" />
                <RefinementList
                    attribute="model"
                    searchable
                    searchablePlaceholder="Hľadať model..."
                    showMore
                    showMoreLimit={30}
                    classNames={{
                        root: "space-y-2",
                        searchBox: "mb-3",
                        list: "space-y-1 max-h-48 overflow-y-auto",
                        item: "flex items-center gap-2",
                        checkbox:
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "flex items-center gap-2 text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                        showMore:
                            "mt-2 text-sm text-accent hover:underline font-medium",
                    }}
                />
            </FilterSectionWithCount>

            {/* Location filter */}
            <FilterSectionWithCount title={tAddListing("location") || "Lokalita"} attribute="location_city">
                <RefinementList
                    attribute="location_city"
                    searchable
                    searchablePlaceholder="Hľadať mesto..."
                    showMore
                    classNames={{
                        root: "space-y-2",
                        searchBox: "mb-3",
                        list: "space-y-1 max-h-48 overflow-y-auto",
                        item: "flex items-center gap-2",
                        checkbox: "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "flex items-center gap-2 text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count: "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                        showMore: "mt-2 text-sm text-accent hover:underline font-medium",
                    }}
                />
            </FilterSectionWithCount>

            {/* Price range */}
            <FilterSectionWithRange title={t("priceTitle")} attribute="price_eur">
                <RangeInput
                    attribute="price_eur"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input:
                            "w-24 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary font-medium",
                        submit:
                            "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors",
                    }}
                    translations={{
                        separatorElementText: "–",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSectionWithRange>

            {/* Year range */}
            <FilterSectionWithRange title={t("yearTitle")} attribute="year">
                <RangeInput
                    attribute="year"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input:
                            "w-20 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary font-medium",
                        submit:
                            "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors",
                    }}
                    translations={{
                        separatorElementText: "–",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSectionWithRange>

            {/* Mileage range */}
            <FilterSectionWithRange title={t("mileageTitle") || "Najazdené km"} attribute="mileage_km">
                <RangeInput
                    attribute="mileage_km"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input: "w-24 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary font-medium",
                        submit: "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors",
                    }}
                    translations={{
                        separatorElementText: "–",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSectionWithRange>

            {/* Power range */}
            <FilterSectionWithRange title={t("powerTitle") || "Výkon"} attribute="power_kw">
                <RangeInput
                    attribute="power_kw"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input: "w-20 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary font-medium",
                        submit: "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors",
                    }}
                    translations={{
                        separatorElementText: "–",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSectionWithRange>

            {/* Fuel type */}
            <FilterSectionWithCount title={t("fuelTitle")} attribute="fuel">
                <RefinementList
                    attribute="fuel"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label: tFuel(item.label as keyof typeof tFuel) || item.label,
                        }))
                    }
                    classNames={{
                        root: "space-y-1",
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox:
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                    }}
                />
            </FilterSectionWithCount>

            {/* Transmission */}
            <FilterSectionWithCount title={t("transmissionTitle")} attribute="transmission">
                <RefinementList
                    attribute="transmission"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label:
                                tTransmission(item.label as keyof typeof tTransmission) ||
                                item.label,
                        }))
                    }
                    classNames={{
                        root: "space-y-1",
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox:
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                    }}
                />
            </FilterSectionWithCount>

            {/* Body Style */}
            <FilterSectionWithCount title={t("bodyTypeTitle") || "Typ karosérie"} attribute="body_style">
                <RefinementList
                    attribute="body_style"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label: tBodyType(item.label.toLowerCase() as keyof typeof tBodyType) || item.label,
                        }))
                    }
                    classNames={{
                        root: "space-y-1",
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox: "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count: "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                        showMore: "mt-2 text-sm text-accent hover:underline font-medium",
                    }}
                />
            </FilterSectionWithCount>

            {/* Trust signals */}
            <FilterSectionToggle title={t("trustTitle")}>
                <div className="space-y-2">
                    <ToggleRefinement
                        attribute="has_service_book"
                        label={t("serviceBook")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                            label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        }}
                    />
                    <ToggleRefinement
                        attribute="not_crashed"
                        label={t("notCrashed")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                            label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        }}
                    />
                    <ToggleRefinement
                        attribute="is_bought_in_sk"
                        label={t("boughtInSK")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                            label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        }}
                    />
                </div>
            </FilterSectionToggle>
        </div>
    );
}

// Filter section with count badge for refinement lists
function FilterSectionWithCount({
    title,
    attribute,
    children,
}: {
    title: string;
    attribute: string;
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const { items } = useRefinementList({ attribute });
    const selectedCount = items.filter(item => item.isRefined).length;

    return (
        <div className={`rounded-xl border overflow-hidden bg-white transition-all ${selectedCount > 0 ? 'filter-section-active' : 'border-border'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors ${isOpen ? "bg-accent/5" : "hover:bg-surface"
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{title}</span>
                    {selectedCount > 0 && (
                        <span className="filter-count-badge">{selectedCount}</span>
                    )}
                </div>
                <ChevronIcon
                    className={`w-4 h-4 text-accent transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            {isOpen && <div className="px-4 py-3 border-t border-border">{children}</div>}
        </div>
    );
}

// Filter section for range inputs
function FilterSectionWithRange({
    title,
    attribute,
    children,
}: {
    title: string;
    attribute: string;
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const { start, range } = useRange({ attribute });
    const hasValue = start[0] !== range.min || start[1] !== range.max;

    return (
        <div className={`rounded-xl border overflow-hidden bg-white transition-all ${hasValue ? 'filter-section-active' : 'border-border'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors ${isOpen ? "bg-accent/5" : "hover:bg-surface"
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{title}</span>
                    {hasValue && (
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                    )}
                </div>
                <ChevronIcon
                    className={`w-4 h-4 text-accent transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            {isOpen && <div className="px-4 py-3 border-t border-border">{children}</div>}
        </div>
    );
}

// Filter section for toggles
function FilterSectionToggle({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors ${isOpen ? "bg-accent/5" : "hover:bg-surface"
                    }`}
            >
                <span className="text-sm font-semibold text-primary">{title}</span>
                <ChevronIcon
                    className={`w-4 h-4 text-accent transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            {isOpen && <div className="px-4 py-3 border-t border-border">{children}</div>}
        </div>
    );
}



// Enhanced Stats component
export function SearchStats() {
    return (
        <Stats
            classNames={{
                root: "text-sm font-medium text-secondary",
            }}
            translations={{
                rootElementText({ nbHits, processingTimeMS }) {
                    return `${nbHits.toLocaleString("sk-SK")} výsledkov (${processingTimeMS}ms)`;
                },
            }}
        />
    );
}

// Enhanced Sort by component
export function SearchSortBy() {
    const t = useTranslations("sort");

    return (
        <SortBy
            items={[
                { label: t("newest"), value: CARS_INDEX },
                { label: t("priceAsc"), value: `${CARS_INDEX}_price_asc` },
                { label: t("priceDesc"), value: `${CARS_INDEX}_price_desc` },
                { label: t("yearDesc"), value: `${CARS_INDEX}_year_desc` },
                { label: t("mileageAsc"), value: `${CARS_INDEX}_mileage_asc` },
            ]}
            classNames={{
                root: "flex items-center gap-2",
                select:
                    "px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer",
            }}
        />
    );
}

// Enhanced Pagination component
export function SearchPagination() {
    return (
        <Pagination
            padding={2}
            showFirst={false}
            showLast={false}
            classNames={{
                root: "flex items-center justify-center gap-2",
                list: "flex items-center gap-2",
                item: "text-sm font-medium",
                selectedItem: "font-bold",
                link: "pagination-item",
                disabledItem: "pagination-item disabled",
            }}
        />
    );
}

// Enhanced No results component
export function NoResultsBoundary({
    children,
    fallback,
}: {
    children: ReactNode;
    fallback: ReactNode;
}) {
    const { results } = useInstantSearch();

    if (!results.__isArtificial && results.nbHits === 0) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

// Icons
function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}

function HeartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}

function CameraIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function SpeedometerIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function FuelIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2zm0 0v11a1 1 0 001 1h6a1 1 0 001-1v-5" />
        </svg>
    );
}

function GearboxIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
    );
}

function EngineIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );
}

function LocationIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
}

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    );
}

function ArrowIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
        </svg>
    );
}

function ChevronIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
            />
        </svg>
    );
}
