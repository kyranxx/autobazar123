"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
    Hits,
    Configure,
} from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { searchClient, CARS_INDEX } from "@/lib/algolia";
import {
    AlgoliaFilters,
    SearchResultsSearchBox,
    CarHit,
    SearchStats,
    SearchSortBy,
    SearchPagination,
    NoResultsBoundary,
} from "@/components/AlgoliaInstantSearch";
import { useTranslations } from "next-intl";

function AlgoliaSearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const t = useTranslations("searchPage");
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
            <Configure
                hitsPerPage={24}
                // Boost TOP ads
                optionalFilters={["is_top_ad:true<score=10>"]}
            />

            <main className="pt-20 pb-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Page Header with Search */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">
                            {t("title")}
                        </h1>
                        <p className="text-secondary mb-6">
                            {t("subtitle") || "Používajte filtre pre presnejšie výsledky"}
                        </p>

                        {/* Search box */}
                        <SearchResultsSearchBox />
                    </div>

                    <div className="flex gap-6">
                        {/* Desktop Filters Sidebar */}
                        <aside className="hidden lg:block w-80 shrink-0">
                            <div className="sticky top-24">
                                <AlgoliaFilters />
                            </div>
                        </aside>

                        {/* Results Section */}
                        <div className="flex-1 min-w-0">
                            {/* Enhanced Toolbar */}
                            <div className="sticky top-20 z-30 mb-6 p-4 rounded-2xl border border-border bg-white/95 backdrop-blur-md shadow-lg">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* Left side */}
                                    <div className="flex items-center gap-4">
                                        {/* Mobile Filter Button */}
                                        <button
                                            onClick={() => setMobileFilterOpen(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 lg:hidden"
                                        >
                                            <FilterIcon className="w-4 h-4" />
                                            {t("filters")}
                                        </button>

                                        {/* Stats with live indicator */}
                                        <div className="hidden sm:flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                            <SearchStats />
                                        </div>
                                    </div>

                                    {/* Right side - View Toggle + Sort */}
                                    <div className="flex items-center gap-3">
                                        {/* View Toggle */}
                                        <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-surface">
                                            <button
                                                onClick={() => setViewMode("grid")}
                                                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                                aria-label="Grid view"
                                            >
                                                <GridIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setViewMode("list")}
                                                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                                                aria-label="List view"
                                            >
                                                <ListIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Sort */}
                                        <div className="flex items-center gap-2">
                                            <SortIcon className="w-4 h-4 text-accent hidden sm:block" />
                                            <SearchSortBy />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <NoResultsBoundary fallback={<NoResults />}>
                                <Hits
                                    hitComponent={CarHit as React.ComponentType<{ hit: Record<string, unknown> }>}
                                    classNames={{
                                        root: "",
                                        list: viewMode === "grid"
                                            ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                                            : "flex flex-col gap-4",
                                        item: "animate-fade-in",
                                    }}
                                />
                            </NoResultsBoundary>

                            {/* Enhanced Pagination */}
                            <div className="mt-10 flex flex-col items-center gap-4">
                                <SearchPagination />
                                <p className="text-sm text-secondary">
                                    {t("paginationHint") || "Stránky výsledkov"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Drawer */}
                {mobileFilterOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setMobileFilterOpen(false)}
                        />
                        <div className="fixed inset-y-0 left-0 w-full max-w-md bg-background z-50 lg:hidden animate-slide-in-right shadow-2xl overflow-y-auto">
                            <div className="flex items-center justify-between p-5 border-b border-border bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-accent/10">
                                        <FilterIcon className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 className="font-bold text-lg text-primary">
                                        {t("filters")}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setMobileFilterOpen(false)}
                                    className="p-2 rounded-full hover:bg-surface transition-colors"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4">
                                <AlgoliaFilters />
                            </div>
                            <div className="sticky bottom-0 p-4 border-t border-border bg-white shadow-lg">
                                <button
                                    onClick={() => setMobileFilterOpen(false)}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                >
                                    {t("showResults") || "Zobraziť výsledky"}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Mobile Sticky Filter Button (when drawer is closed) */}
                {!mobileFilterOpen && (
                    <button
                        onClick={() => setMobileFilterOpen(true)}
                        className="mobile-filter-sticky lg:hidden flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-bold"
                    >
                        <FilterIcon className="w-4 h-4" />
                        {t("filters")}
                    </button>
                )}
            </main>
        </InstantSearchNext>
    );
}

// Enhanced No results component with illustration
function NoResults() {
    const t = useTranslations("searchPage");

    return (
        <div className="text-center py-20">
            {/* Illustration */}
            <div className="w-32 h-32 mx-auto mb-8 rounded-full no-results-illustration flex items-center justify-center">
                <svg
                    className="w-16 h-16 text-accent/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>

            <h3 className="text-2xl font-bold text-primary mb-3">
                {t("noResults")}
            </h3>
            <p className="text-secondary max-w-md mx-auto mb-8">
                {t("noResultsText") || "Nenašli sme žiadne autá zodpovedajúce vašim kritériám. Skúste zmeniť filtre alebo hľadaný výraz."}
            </p>

            {/* Suggestions */}
            <div className="inline-flex flex-col items-start gap-3 p-6 rounded-2xl bg-surface text-left">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                    <LightbulbIcon className="w-5 h-5 text-warning" />
                    {t("suggestions") || "Tipy pre lepšie výsledky:"}
                </h4>
                <ul className="space-y-2 text-sm text-secondary">
                    <li className="flex items-center gap-2">
                        <CheckIcon className="w-4 h-4 text-success" />
                        {t("suggestionBroader") || "Rozšírte cenové rozpätie"}
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckIcon className="w-4 h-4 text-success" />
                        {t("suggestionYear") || "Zmeňte rok výroby"}
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckIcon className="w-4 h-4 text-success" />
                        {t("suggestionClear") || "Vymažte niektoré filtre"}
                    </li>
                </ul>
            </div>
        </div>
    );
}

// Loading skeleton for cards
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden">
                    <div className="aspect-[16/10] skeleton" />
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between">
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-3/4 skeleton rounded" />
                                <div className="h-4 w-1/2 skeleton rounded" />
                            </div>
                            <div className="h-6 w-20 skeleton rounded" />
                        </div>
                        <div className="flex gap-2 pt-3">
                            <div className="h-7 w-20 skeleton rounded-lg" />
                            <div className="h-7 w-16 skeleton rounded-lg" />
                            <div className="h-7 w-18 skeleton rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Main export with Suspense wrapper for useSearchParams
export default function AlgoliaSearchPageClient() {
    return (
        <Suspense
            fallback={
                <div className="pt-20 pb-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <div className="h-10 w-48 skeleton rounded-lg mb-4" />
                            <div className="h-16 skeleton rounded-2xl" />
                        </div>
                        <div className="flex gap-6">
                            <aside className="hidden lg:block w-80 shrink-0">
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="h-16 skeleton rounded-xl" />
                                    ))}
                                </div>
                            </aside>
                            <div className="flex-1">
                                <div className="h-16 skeleton rounded-2xl mb-6" />
                                <LoadingSkeleton />
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <AlgoliaSearchContent />
        </Suspense>
    );
}

// Icons
function FilterIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
        </svg>
    );
}

function SortIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9M3 12h5m0 0l4 4m-4-4l4-4"
            />
        </svg>
    );
}

function CloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    );
}

function GridIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
        </svg>
    );
}

function ListIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
        </svg>
    );
}

function LightbulbIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
            />
        </svg>
    );
}
