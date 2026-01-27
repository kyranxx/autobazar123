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
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-6"
            }
        >
            {sortedItems.map((hit, index) => (
                <div
                    key={hit.objectID}
                    className="animate-stagger-fade-in"
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                >
                    <CarHit hit={hit} />
                </div>
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

            <main id="main-content" className="pt-32 pb-24 bg-white min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-primary mb-4">
                                    {t("title")}
                                </h1>
                                <p className="text-secondary opacity-60 font-medium leading-relaxed">
                                    {t("subtitle") || "Objavte ponuku viac ako 5 000 preverených vozidiel."}
                                </p>
                            </div>
                            <div className="w-full md:w-96">
                                <SearchResultsSearchBox />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-16">
                        {/* Desktop Filters Sidebar */}
                        <aside className="hidden lg:block w-72 shrink-0">
                            <div className="sticky top-32">
                                <div className="mb-8 flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Filtre</h2>
                                </div>
                                <div className="max-h-[calc(100vh-160px)] overflow-y-auto pr-4 scrollbar-none">
                                    <FilterSidebar />
                                </div>
                            </div>
                        </aside>

                        {/* Results Section */}
                        <div className="flex-1 min-w-0">
                            {/* Toolbar */}
                            <div className="mb-8 flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-border/40">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setMobileFilterOpen(true)}
                                        className="inline-flex lg:hidden h-12 px-6 items-center gap-2 bg-surface rounded-full text-xs font-bold text-primary tracking-widest transition-all hover:bg-surface-hover"
                                    >
                                        <FilterIcon className="w-4 h-4" />
                                        {t("filters")}
                                    </button>

                                    <div className="hidden sm:flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <div className="text-xs font-bold text-secondary uppercase tracking-widest opacity-60">
                                            <SearchStats />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Sort */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-[11px] font-bold text-secondary uppercase tracking-widest opacity-40">Zoradiť:</span>
                                        <SearchSortBy value={sortOption} onChange={setSortOption} />
                                    </div>

                                    {/* View Mode Toggle */}
                                    <div className="hidden sm:flex items-center gap-1 p-1 bg-surface rounded-full">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={cn(
                                                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                                viewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-secondary hover:text-primary"
                                            )}
                                        >
                                            <GridIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={cn(
                                                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                                viewMode === "list" ? "bg-white shadow-sm text-primary" : "text-secondary hover:text-primary"
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
                            <div className="mt-20 pt-12 border-t border-border/40 flex flex-col items-center gap-6">
                                <SearchPagination />
                                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-40">
                                    Zobraziť ďalšie vozidlá
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Drawer */}
                {mobileFilterOpen && (
                    <div className="fixed inset-0 z-[110] animate-in fade-in duration-400">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
                        <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-premium animate-in slide-in-from-right duration-500 rounded-l-[40px]">
                            <div className="flex flex-col h-full h-screen overflow-hidden">
                                <div className="flex items-center justify-between p-8 border-b border-border/40">
                                    <h2 className="text-xl font-bold text-primary uppercase tracking-widest">
                                        {t("filters")}
                                    </h2>
                                    <button onClick={() => setMobileFilterOpen(false)} className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                                        <CloseIcon className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                    <FilterSidebar />
                                </div>
                                <div className="p-8 pb-12">
                                    <button
                                        onClick={() => setMobileFilterOpen(false)}
                                        className="w-full h-18 bg-primary text-white rounded-full font-bold text-sm shadow-xl shadow-black/10"
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
        <div className="text-center py-32 bg-surface/30 rounded-[40px] border border-dashed border-border/60">
            <div className="w-20 h-20 mx-auto mb-8 bg-white rounded-3xl flex items-center justify-center shadow-premium">
                <SearchIcon className="w-8 h-8 text-secondary opacity-40" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-4">{t("noResults")}</h3>
            <p className="text-base text-secondary opacity-60 max-w-md mx-auto mb-10 font-medium">
                Nenašli sme žiadne autá zodpovedajúce vašim kritériám. Skúste prosím upraviť svoje filtre.
            </p>
            <button
                onClick={() => window.location.href = '/auta'}
                className="px-10 py-4 bg-primary text-white rounded-full font-bold text-sm"
            >
                Resetovať všetky filtre
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
        <Suspense fallback={<div className="pt-40 text-center font-display font-medium text-secondary animate-pulse">Načítavam výsledky…</div>}>
            <AlgoliaSearchContent />
        </Suspense>
    );
}
