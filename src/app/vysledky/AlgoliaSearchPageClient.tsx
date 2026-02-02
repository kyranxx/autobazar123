"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useMemo } from "react";
import {
    Configure,
    useHits,
} from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { searchClient, CARS_INDEX, AlgoliaCarRecord } from "@/lib/algolia";
import {
    FilterSidebar,
    SearchResultsSearchBox,
    CarHit,
    SearchStats,
    SearchSortBy,
    SearchPagination,
    NoResultsBoundary,
    SortOption,
} from "@/components/search";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

// Routing configuration to sync URL with InstantSearch state
const routing = {
    stateMapping: {
        stateToRoute(uiState: Record<string, unknown>) {
            const indexUiState = (uiState[CARS_INDEX] || {}) as Record<string, unknown>;
            const refinementList = indexUiState.refinementList as Record<string, string[]> | undefined;

            return {
                q: indexUiState.query as string || undefined,
                brand: refinementList?.brand?.[0],
                model: refinementList?.model?.[0],
                fuel: refinementList?.fuel?.[0],
                transmission: refinementList?.transmission?.[0],
                body: refinementList?.body_style?.[0],
                page: (indexUiState.page as number) > 1 ? String(indexUiState.page) : undefined,
            };
        },
        routeToState(routeState: Record<string, string | undefined>) {
            const refinementList: Record<string, string[]> = {};
            if (routeState.brand) refinementList.brand = [routeState.brand];
            if (routeState.model) refinementList.model = [routeState.model];
            if (routeState.fuel) refinementList.fuel = [routeState.fuel];
            if (routeState.transmission) refinementList.transmission = [routeState.transmission];
            if (routeState.body) refinementList.body_style = [routeState.body];

            return {
                [CARS_INDEX]: {
                    query: routeState.q || '',
                    refinementList: Object.keys(refinementList).length > 0 ? refinementList : undefined,
                    page: routeState.page ? Number(routeState.page) : undefined,
                },
            };
        },
    },
};

// Custom component for sorted hits (client-side sorting)
function SortedHits({
    sortOption,
    viewMode,
}: {
    sortOption: SortOption;
    viewMode: "grid" | "list";
}) {
    const { items } = useHits<AlgoliaCarRecord>();

    // Sort items client-side based on sort option
    const sortedItems = useMemo(() => {
        const itemsCopy = [...items];

        switch (sortOption) {
            case "price_asc":
                return itemsCopy.sort((a, b) => (a.price_eur || 0) - (b.price_eur || 0));
            case "price_desc":
                return itemsCopy.sort((a, b) => (b.price_eur || 0) - (a.price_eur || 0));
            case "year_desc":
                return itemsCopy.sort((a, b) => (b.year || 0) - (a.year || 0));
            case "mileage_asc":
                return itemsCopy.sort((a, b) => (a.mileage_km || 0) - (b.mileage_km || 0));
            case "newest":
            default:
                return itemsCopy.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        }
    }, [items, sortOption]);

    return (
        <div
            className={
                viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
            }
        >
            {sortedItems.map((hit) => (
                <CarHit key={hit.objectID} hit={hit} />
            ))}
        </div>
    );
}

function AlgoliaSearchContent() {
    const searchParams = useSearchParams();
    const t = useTranslations("searchPage");
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortOption, setSortOption] = useState<SortOption>("newest");

    // Create a unique key based on URL params to force re-mount on client navigation
    const searchKey = searchParams.toString();

    return (
        <InstantSearchNext
            key={searchKey}
            searchClient={searchClient}
            indexName={CARS_INDEX}
            routing={{
                ...routing,
                router: {
                    cleanUrlOnDispose: true,
                },
            }}
            future={{ preserveSharedStateOnUnmount: false }}
        >
            <Configure
                hitsPerPage={24}
                optionalFilters={["is_top_ad:true<score=10>"]}
            />

            <main id="main-content" className="pt-20 sm:pt-24 pb-16 bg-white min-h-screen">
                <div className="container-main">
                    {/* Prominent Search Bar */}
                    <div className="mb-8">
                        <div className="max-w-2xl mx-auto sm:mx-0">
                            <SearchResultsSearchBox autoFocus />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                        {/* Desktop Filters Sidebar */}
                        <aside className="hidden lg:block w-64 shrink-0">
                            <div className="sticky top-24">
                                <div className="mb-4">
                                    <h2 className="text-sm font-semibold text-text-primary">Filtre</h2>
                                </div>
                                <div className="max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
                                    <FilterSidebar />
                                </div>
                            </div>
                        </aside>

                        {/* Results Section */}
                        <div className="flex-1 min-w-0">
                            {/* Toolbar */}
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setMobileFilterOpen(true)}
                                        className="inline-flex lg:hidden items-center gap-2 px-3 py-2 bg-background-secondary rounded-md text-sm font-medium text-text-primary hover:bg-background-tertiary transition-colors"
                                    >
                                        <FilterIcon className="w-4 h-4" />
                                        {t("filters")}
                                    </button>

                                    <div className="hidden sm:flex items-center gap-2 text-sm text-text-tertiary">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                        <SearchStats />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Sort */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-text-tertiary hidden sm:inline">Zoradiť:</span>
                                        <SearchSortBy value={sortOption} onChange={setSortOption} />
                                    </div>

                                    {/* View Mode Toggle */}
                                    <div className="hidden sm:flex items-center gap-1 p-1 bg-background-secondary rounded-md">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={cn(
                                                "w-8 h-8 rounded flex items-center justify-center transition-colors",
                                                viewMode === "grid" ? "bg-white shadow-sm text-text-primary" : "text-text-tertiary hover:text-text-primary"
                                            )}
                                        >
                                            <GridIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={cn(
                                                "w-8 h-8 rounded flex items-center justify-center transition-colors",
                                                viewMode === "list" ? "bg-white shadow-sm text-text-primary" : "text-text-tertiary hover:text-text-primary"
                                            )}
                                        >
                                            <ListIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <NoResultsBoundary fallback={<NoResults />}>
                                <SortedHits sortOption={sortOption} viewMode={viewMode} />
                            </NoResultsBoundary>

                            {/* Pagination */}
                            <div className="mt-12 pt-8 border-t border-border">
                                <SearchPagination />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Drawer */}
                {mobileFilterOpen && (
                    <div className="fixed inset-0 z-[110]">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
                        <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl animate-fade-in">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between p-4 border-b border-border">
                                    <h2 className="text-lg font-semibold text-text-primary">
                                        {t("filters")}
                                    </h2>
                                    <button onClick={() => setMobileFilterOpen(false)} className="p-2 hover:bg-background-secondary rounded-md transition-colors">
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                                    <FilterSidebar />
                                </div>
                                <div className="p-4 border-t border-border">
                                    <button
                                        onClick={() => setMobileFilterOpen(false)}
                                        className="btn-primary w-full py-3"
                                    >
                                        Zobraziť výsledky
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </InstantSearchNext>
    );
}

function NoResults() {
    const t = useTranslations("searchPage");
    return (
        <div className="text-center py-16 bg-background-secondary rounded-lg border border-dashed border-border">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center">
                <SearchIcon className="w-6 h-6 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{t("noResults")}</h3>
            <p className="text-sm text-text-tertiary max-w-md mx-auto mb-6">
                Nenašli sme žiadne autá zodpovedajúce vašim kritériám. Skúste prosím upraviť svoje filtre.
            </p>
            <button
                onClick={() => window.location.href = '/vysledky'}
                className="btn-primary px-6 py-2.5"
            >
                Resetovať filtre
            </button>
        </div>
    );
}

// Icons
function FilterIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
}

function CloseIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

function GridIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
}

function ListIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
}

function SearchIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}

export default function AlgoliaSearchPageClient() {
    return (
        <Suspense fallback={
            <div className="pt-32 text-center">
                <div className="w-8 h-8 border-2 border-border border-t-text-primary rounded-full animate-spin mx-auto" />
            </div>
        }>
            <AlgoliaSearchContent />
        </Suspense>
    );
}
