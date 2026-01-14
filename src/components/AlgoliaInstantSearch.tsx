"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    SearchBox,
    Hits,
    RefinementList,
    RangeInput,
    Stats,
    Pagination,
    Configure,
    ClearRefinements,
    useInstantSearch,
    useSearchBox,
    SortBy,
    CurrentRefinements,
    ToggleRefinement,
} from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { searchClient, CARS_INDEX, AlgoliaCarRecord } from "@/lib/algolia";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

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

// Custom search box for search results page
export function SearchResultsSearchBox() {
    const { query, refine } = useSearchBox();
    const [inputValue, setInputValue] = useState(query);
    const t = useTranslations("search");

    useEffect(() => {
        setInputValue(query);
    }, [query]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        refine(value);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-white shadow-lg focus-within:border-accent focus-within:shadow-accent/10 transition-all">
                <SearchIcon className="w-6 h-6 text-accent" />
                <input
                    type="search"
                    value={inputValue}
                    onChange={handleChange}
                    placeholder={t("placeholder") || "Hľadať autá..."}
                    className="flex-1 text-lg font-medium text-primary placeholder:text-secondary/60 bg-transparent focus:outline-none"
                />
                {inputValue && (
                    <button
                        type="button"
                        onClick={() => {
                            setInputValue("");
                            refine("");
                        }}
                        className="p-2 rounded-full hover:bg-surface transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-secondary" />
                    </button>
                )}
            </div>
        </div>
    );
}

// Car hit component for search results
export function CarHit({ hit }: { hit: AlgoliaCarRecord }) {
    const t = useTranslations("car");

    const firstPhoto = hit.photos_json?.[0] || "/placeholder-car.jpg";

    return (
        <Link href={`/auto/${hit.objectID}`} className="block group">
            <article
                className={`relative rounded-2xl border overflow-hidden bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${hit.is_top_ad
                    ? "border-amber-400 ring-2 ring-amber-400/20"
                    : hit.is_highlighted
                        ? "border-accent/40"
                        : "border-border"
                    }`}
            >
                {/* Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                    {hit.is_top_ad && (
                        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-lg">
                            ⭐ TOP
                        </span>
                    )}
                    {hit.is_vat_deductible && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                            DPH
                        </span>
                    )}
                </div>

                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                        src={firstPhoto}
                        alt={`${hit.brand} ${hit.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                                {hit.brand} {hit.model}
                            </h3>
                            <p className="text-sm text-secondary">
                                {hit.generation} • {hit.year}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-accent">
                                {hit.price_eur?.toLocaleString("sk-SK")} €
                            </p>
                        </div>
                    </div>

                    {/* Specs */}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                        <Spec icon="🛣️" value={`${((hit.mileage_km || 0) / 1000).toFixed(0)} tis. km`} />
                        <Spec icon="⛽" value={t(hit.fuel) || hit.fuel} />
                        <Spec icon="⚙️" value={t(hit.transmission) || hit.transmission} />
                        {hit.power_kw && <Spec icon="💪" value={`${hit.power_kw} kW`} />}
                    </div>

                    {/* Trust signals */}
                    {(hit.has_service_book || hit.not_crashed || hit.is_bought_in_sk) && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {hit.has_service_book && <TrustBadge label={t("serviceBook") || "Servisná knižka"} />}
                            {hit.not_crashed && <TrustBadge label={t("notCrashed") || "Nehavarované"} />}
                            {hit.is_bought_in_sk && <TrustBadge label={t("boughtInSK") || "Kúpené v SR"} />}
                        </div>
                    )}

                    {/* Location */}
                    {hit.location_city && (
                        <p className="text-xs text-secondary mt-3 flex items-center gap-1">
                            <span>📍</span> {hit.location_city}
                        </p>
                    )}
                </div>
            </article>
        </Link>
    );
}

function Spec({ icon, value }: { icon: string; value: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface text-xs text-secondary">
            <span>{icon}</span>
            <span>{value}</span>
        </span>
    );
}

function TrustBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium">
            <span>✓</span> {label}
        </span>
    );
}

// Faceted filter components
export function AlgoliaFilters() {
    const t = useTranslations("filters");
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");
    const tBodyType = useTranslations("bodyType");
    const tAddListing = useTranslations("addListing");

    return (
        <div className="space-y-4">
            {/* Clear all refinements */}
            <ClearRefinements
                translations={{
                    resetButtonText: t("clear"),
                }}
                classNames={{
                    button:
                        "w-full px-4 py-2.5 rounded-xl bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                }}
            />

            {/* Current refinements */}
            <CurrentRefinements
                classNames={{
                    root: "flex flex-wrap gap-2",
                    item: "flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm",
                    delete: "ml-1 hover:text-error",
                }}
            />

            {/* Brand and Model filter */}
            <FilterSection title={t("brandAndModel")}>
                <RefinementList
                    attribute="brand"
                    searchable
                    searchablePlaceholder="Hľadať značku..."
                    showMore
                    showMoreLimit={30}
                    classNames={{
                        root: "space-y-2",
                        searchBox: "mb-3",
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox:
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                        label: "flex items-center gap-2 text-sm text-primary cursor-pointer",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs",
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
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox:
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                        label: "flex items-center gap-2 text-sm text-primary cursor-pointer",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs",
                        showMore:
                            "mt-2 text-sm text-accent hover:underline font-medium",
                    }}
                />
            </FilterSection>

            {/* Location filter */}
            <FilterSection title={tAddListing("location") || "Lokalita"}>
                <RefinementList
                    attribute="location_city"
                    searchable
                    searchablePlaceholder="Hľadať mesto..."
                    showMore
                    classNames={{
                        root: "space-y-2",
                        searchBox: "mb-3",
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox: "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                        label: "flex items-center gap-2 text-sm text-primary cursor-pointer",
                        count: "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs",
                        showMore: "mt-2 text-sm text-accent hover:underline font-medium",
                    }}
                />
            </FilterSection>

            {/* Price range */}
            <FilterSection title={t("priceTitle")}>
                <RangeInput
                    attribute="price_eur"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input:
                            "w-24 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary",
                        submit:
                            "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover",
                    }}
                    translations={{
                        separatorElementText: "-",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSection>

            {/* Year range */}
            <FilterSection title={t("yearTitle")}>
                <RangeInput
                    attribute="year"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input:
                            "w-20 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary",
                        submit:
                            "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover",
                    }}
                    translations={{
                        separatorElementText: "-",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSection>

            {/* Mileage range */}
            <FilterSection title={t("mileageTitle") || "Najazdené km"}>
                <RangeInput
                    attribute="mileage_km"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input: "w-24 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary",
                        submit: "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover",
                    }}
                    translations={{
                        separatorElementText: "-",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSection>

            {/* Power range */}
            <FilterSection title={t("powerTitle") || "Výkon"}>
                <RangeInput
                    attribute="power_kw"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input: "w-20 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary",
                        submit: "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover",
                    }}
                    translations={{
                        separatorElementText: "-",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSection>

            {/* Fuel type */}
            <FilterSection title={t("fuelTitle")}>
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
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                        label: "text-sm text-primary cursor-pointer",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs",
                    }}
                />
            </FilterSection>

            {/* Transmission */}
            <FilterSection title={t("transmissionTitle")}>
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
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                        label: "text-sm text-primary cursor-pointer",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs",
                    }}
                />
            </FilterSection>

            {/* Body Style */}
            <FilterSection title={t("bodyTypeTitle") || "Typ karosérie"}>
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
                        checkbox: "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                        label: "text-sm text-primary cursor-pointer",
                        count: "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs",
                        showMore: "mt-2 text-sm text-accent hover:underline font-medium",
                    }}
                />
            </FilterSection>

            {/* Trust signals */}
            <FilterSection title={t("trustTitle")}>
                <div className="space-y-2">
                    <ToggleRefinement
                        attribute="has_service_book"
                        label={t("serviceBook")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                            label: "text-sm text-primary cursor-pointer",
                        }}
                    />
                    <ToggleRefinement
                        attribute="not_crashed"
                        label={t("notCrashed")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                            label: "text-sm text-primary cursor-pointer",
                        }}
                    />
                    <ToggleRefinement
                        attribute="is_bought_in_sk"
                        label={t("boughtInSK")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent",
                            label: "text-sm text-primary cursor-pointer",
                        }}
                    />
                </div>
            </FilterSection>
        </div>
    );
}

function FilterSection({
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

// Stats component
export function SearchStats() {
    return (
        <Stats
            classNames={{
                root: "text-sm text-secondary",
            }}
            translations={{
                rootElementText({ nbHits, processingTimeMS }) {
                    return `${nbHits.toLocaleString("sk-SK")} výsledkov (${processingTimeMS}ms)`;
                },
            }}
        />
    );
}

// Sort by component
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
                    "px-3 py-2 rounded-lg border border-border bg-white text-sm focus:border-accent focus:ring-1 focus:ring-accent",
            }}
        />
    );
}

// Pagination component
export function SearchPagination() {
    return (
        <Pagination
            padding={2}
            showFirst={false}
            showLast={false}
            classNames={{
                root: "flex items-center justify-center gap-1",
                list: "flex items-center gap-1",
                item: "text-sm",
                selectedItem: "font-bold",
                link: "w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-surface transition-colors",
                disabledItem: "opacity-50 cursor-not-allowed",
            }}
        />
    );
}

// No results component
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
