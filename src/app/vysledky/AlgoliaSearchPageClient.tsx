"use client";

import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
} from "react-instantsearch";
import { getSearchClient, CARS_INDEX, AlgoliaCarRecord } from "@/lib/algolia";
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
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { Button } from "@/components/ui/shadcn/button";
import {
  FilterIcon,
  XIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
} from "@/components/ui/Icons";

const routing = {
  stateMapping: {
    stateToRoute(uiState: Record<string, unknown>) {
      const indexUiState = (uiState[CARS_INDEX] || {}) as Record<
        string,
        unknown
      >;
      const refinementList = indexUiState.refinementList as
        | Record<string, string[]>
        | undefined;

      return {
        q: (indexUiState.query as string) || undefined,
        brand: refinementList?.brand?.[0],
        model: refinementList?.model?.[0],
        fuel: refinementList?.fuel?.[0],
        transmission: refinementList?.transmission?.[0],
        body: refinementList?.body_style?.[0],
        page:
          (indexUiState.page as number) > 1
            ? String(indexUiState.page)
            : undefined,
      };
    },
    routeToState(routeState: Record<string, string | undefined>) {
      const refinementList: Record<string, string[]> = {};
      if (routeState.brand) refinementList.brand = [routeState.brand];
      if (routeState.model) refinementList.model = [routeState.model];
      if (routeState.fuel) refinementList.fuel = [routeState.fuel];
      if (routeState.transmission)
        refinementList.transmission = [routeState.transmission];
      if (routeState.body) refinementList.body_style = [routeState.body];

      return {
        [CARS_INDEX]: {
          query: routeState.q || "",
          refinementList:
            Object.keys(refinementList).length > 0 ? refinementList : undefined,
          page: routeState.page ? Number(routeState.page) : undefined,
        },
      };
    },
  },
};

function CarCardSkeleton() {
  return (
    <div className="bg-background-secondary border border-border-subtle rounded-xl overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-3 border-t border-border-subtle">
          <Skeleton className="h-7 w-1/3" />
        </div>
      </div>
    </div>
  );
}

function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SortedHits({
  sortOption,
  viewMode,
}: {
  sortOption: SortOption;
  viewMode: "grid" | "list";
}) {
  const { items } = useHits<AlgoliaCarRecord>();
  const { status } = useInstantSearch();

  const sortedItems = useMemo(() => {
    const itemsCopy = [...items];

    switch (sortOption) {
      case "price_asc":
        return itemsCopy.sort(
          (a, b) => (a.price_eur || 0) - (b.price_eur || 0),
        );
      case "price_desc":
        return itemsCopy.sort(
          (a, b) => (b.price_eur || 0) - (a.price_eur || 0),
        );
      case "year_desc":
        return itemsCopy.sort((a, b) => (b.year || 0) - (a.year || 0));
      case "mileage_asc":
        return itemsCopy.sort(
          (a, b) => (a.mileage_km || 0) - (b.mileage_km || 0),
        );
      case "newest":
      default:
        return itemsCopy.sort(
          (a, b) => (b.created_at || 0) - (a.created_at || 0),
        );
    }
  }, [items, sortOption]);

  if (status === "loading" || status === "stalled") {
    return <LoadingGrid count={6} />;
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
          : "flex flex-col gap-4",
      )}
    >
      {sortedItems.map((hit) => (
        <CarHit key={hit.objectID} hit={hit} viewMode={viewMode} />
      ))}
    </div>
  );
}

function ActiveFiltersCount() {
  const { results } = useInstantSearch();
  const activeCount = useMemo(() => {
    if (!results) return 0;
    const refinements = results.getRefinements?.() || [];
    return refinements.length;
  }, [results]);

  if (activeCount === 0) return null;

  return (
    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-accent text-white rounded-full">
      {activeCount}
    </span>
  );
}

function AlgoliaSearchContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("searchPage");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const searchKey = searchParams.toString();

  const closeMobileFilter = useCallback(() => setMobileFilterOpen(false), []);
  const openMobileFilter = useCallback(() => setMobileFilterOpen(true), []);

  return (
    <InstantSearch
      key={searchKey}
      searchClient={getSearchClient()!}
      indexName={CARS_INDEX}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: false }}
    >
      <Configure
        hitsPerPage={24}
        optionalFilters={["is_top_ad:true<score=10>"]}
      />

      <main
        id="main-content"
        className="pt-20 sm:pt-24 pb-16 bg-background min-h-screen"
      >
        <div className="container-main">
          {/* Search Header */}
          <div className="mb-8 lg:mb-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 max-w-2xl">
                <SearchResultsSearchBox autoFocus />
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <SearchStats />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-24">
                <div className="bg-background-secondary border border-border-subtle rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border-subtle">
                    <h2 className="text-sm font-semibold text-text-primary tracking-wide">
                      {t("filters")}
                    </h2>
                  </div>
                  <div className="p-5 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin">
                    <FilterSidebar />
                  </div>
                </div>
              </div>
            </aside>

            {/* Results Section */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openMobileFilter}
                    className="lg:hidden"
                  >
                    <FilterIcon className="w-4 h-4" />
                    {t("filters")}
                    <ActiveFiltersCount />
                  </Button>

                  {/* Stats - Mobile */}
                  <div className="lg:hidden text-xs text-text-tertiary">
                    <SearchStats />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted hidden sm:inline">
                      Zoradiť:
                    </span>
                    <SearchSortBy value={sortOption} onChange={setSortOption} />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="hidden sm:flex items-center bg-background-secondary border border-border-subtle rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200",
                        viewMode === "grid"
                          ? "bg-white shadow-sm text-text-primary"
                          : "text-text-tertiary hover:text-text-secondary",
                      )}
                      aria-label="Grid view"
                    >
                      <GridIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200",
                        viewMode === "list"
                          ? "bg-white shadow-sm text-text-primary"
                          : "text-text-tertiary hover:text-text-secondary",
                      )}
                      aria-label="List view"
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
              <div className="mt-12 pt-8 border-t border-border-subtle">
                <SearchPagination />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-[110] lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeMobileFilter}
            />
            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 w-full max-w-md bg-background shadow-2xl animate-slide-in-right">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {t("filters")}
                  </h2>
                  <button
                    onClick={closeMobileFilter}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-background-secondary transition-colors"
                    aria-label="Close filters"
                  >
                    <XIcon className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                  <FilterSidebar />
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-border-subtle bg-background-secondary/50">
                  <Button
                    size="lg"
                    onClick={closeMobileFilter}
                    className="w-full"
                  >
                    Zobraziť výsledky
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </InstantSearch>
  );
}

function NoResults() {
  const t = useTranslations("searchPage");

  return (
    <div className="text-center py-16 px-6">
      <div className="w-20 h-20 mx-auto mb-6 bg-background-secondary rounded-2xl flex items-center justify-center border border-border-subtle">
        <SearchIcon className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        {t("noResults")}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-8">
        Nenašli sme žiadne autá zodpovedajúce vašim kritériám. Skúste upraviť
        filtre alebo vyhľadávanie.
      </p>
      <Button
        variant="secondary"
        onClick={() => (window.location.href = "/vysledky")}
      >
        Resetovať všetky filtre
      </Button>
    </div>
  );
}

export default function AlgoliaSearchPageClient() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 pb-16 bg-background min-h-screen">
          <div className="container-main">
            <div className="mb-8">
              <Skeleton className="h-12 max-w-2xl" />
            </div>
            <div className="flex flex-col lg:flex-row gap-10">
              <aside className="hidden lg:block w-[280px] shrink-0">
                <Skeleton className="h-[500px] rounded-xl" />
              </aside>
              <div className="flex-1">
                <div className="mb-6 pb-5 border-b border-border-subtle">
                  <Skeleton className="h-10 w-48" />
                </div>
                <LoadingGrid count={6} />
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
