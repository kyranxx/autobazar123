"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
import { useState } from "react";

function AlgoliaSearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const t = useTranslations("searchPage");
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
                            {/* Toolbar */}
                            <div className="sticky top-20 z-30 mb-6 p-4 rounded-2xl border border-border bg-white/95 backdrop-blur-sm shadow-lg">
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

                                        {/* Stats */}
                                        <div className="hidden sm:flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                            <SearchStats />
                                        </div>
                                    </div>

                                    {/* Right side - Sort */}
                                    <div className="flex items-center gap-3">
                                        <SortIcon className="w-4 h-4 text-accent" />
                                        <SearchSortBy />
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <NoResultsBoundary fallback={<NoResults />}>
                                <Hits
                                    hitComponent={CarHit as React.ComponentType<{ hit: Record<string, unknown> }>}
                                    classNames={{
                                        root: "",
                                        list: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5",
                                        item: "animate-fade-in",
                                    }}
                                />
                            </NoResultsBoundary>

                            {/* Pagination */}
                            <div className="mt-10">
                                <SearchPagination />
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
                            <div className="flex items-center justify-between p-5 border-b border-border bg-white sticky top-0">
                                <h2 className="font-bold text-lg text-primary">
                                    {t("filters")}
                                </h2>
                                <button
                                    onClick={() => setMobileFilterOpen(false)}
                                    className="p-2 rounded-full hover:bg-surface"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4">
                                <AlgoliaFilters />
                            </div>
                            <div className="sticky bottom-0 p-4 border-t border-border bg-white">
                                <button
                                    onClick={() => setMobileFilterOpen(false)}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white font-semibold"
                                >
                                    {t("showResults") || "Zobraziť výsledky"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </InstantSearchNext>
    );
}

// No results component
function NoResults() {
    const t = useTranslations("searchPage");

    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
                <svg
                    className="w-12 h-12 text-tertiary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">
                {t("noResults")}
            </h3>
            <p className="text-secondary max-w-md mx-auto">
                {t("noResultsText") || "Skúste zmeniť vyhľadávacie kritériá"}
            </p>
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
                        <div className="animate-pulse">
                            <div className="h-10 w-48 bg-surface rounded-lg mb-4" />
                            <div className="h-16 bg-surface rounded-2xl mb-8" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="aspect-[4/5] bg-surface rounded-2xl" />
                                ))}
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
