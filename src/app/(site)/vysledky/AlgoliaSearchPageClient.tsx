"use client";

import {
  Suspense,
  startTransition,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Configure,
  useHits,
  useInstantSearch,
  useCurrentRefinements,
} from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSearchClient, CARS_INDEX, AlgoliaCarRecord } from "@/lib/algolia";
import {
  getCarsSortIndexName,
  type SearchSortOption,
} from "@/lib/algolia/sort-indices";
import {
  type AlgoliaIndexUiState,
  indexUiStateToRouteParams,
  routeParamsToIndexUiState,
} from "@/lib/algolia/url-state";
import {
  normalizeRouteQuery,
  routeQueryToIndexUiState,
  shouldApplyRouteQueryToIndexUiState,
} from "@/lib/algolia/route-sync";
import {
  FilterSidebar,
  SearchResultsSearchBox,
  CarHit,
  SearchStats,
  SearchSortBy,
  SearchViewToggle,
  SearchPagination,
} from "@/components/search";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { cn } from "@/utils/cn";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { Button } from "@/components/ui/shadcn/button";
import { SearchIcon, FilterIcon } from "@/components/ui/Icons";

const URL_SYNC_DEBOUNCE_MS = 250;

function getActiveIndexUiState(
  uiState: Record<string, AlgoliaIndexUiState>,
  activeIndexName: string,
): AlgoliaIndexUiState {
  if (uiState[activeIndexName]) {
    return uiState[activeIndexName];
  }

  const firstState = Object.values(uiState)[0];
  return firstState || {};
}

function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-background-secondary">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="border-t border-border-subtle pt-3">
          <Skeleton className="h-7 w-1/3" />
        </div>
      </div>
    </div>
  );
}

function LoadingGrid({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SortedHits({
  viewMode,
  emptyState,
}: {
  viewMode: "grid" | "list";
  emptyState?: ReactNode;
}) {
  const { items } = useHits<AlgoliaCarRecord>();
  const { status, results } = useInstantSearch();
  // BUGFIX: Remove client-side sorting fallback because it falsely only sorts the current page.
  // We now rely purely on Algolia's replica-based sorting via indexName.
  const sortedItems = items;

  const isUpdating = status === "loading" || status === "stalled";
  const isArtificial = Boolean(
    results && "__isArtificial" in results && results.__isArtificial,
  );

  if (sortedItems.length === 0 && (isUpdating || isArtificial)) {
    return <LoadingGrid count={6} />;
  }

  if (sortedItems.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div className="relative">
      <div
        key={viewMode}
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
            : "flex flex-col gap-5",
          isUpdating && "opacity-70 transition-opacity",
        )}
      >
        {sortedItems.map((hit, index) => (
          <CarHit
            key={hit.objectID}
            hit={hit}
            viewMode={viewMode}
            priorityImage={index < 4}
          />
        ))}
      </div>
    </div>
  );
}

function SearchStateNotice() {
  const t = useTranslations("searchPage");
  const { status, error, refresh } = useInstantSearch({ catchError: true });

  if (status === "error") {
    return (
      <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-text-primary">
            {t("stateUpdateFailed")}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refresh()}>
            {t("retry")}
          </Button>
        </div>
        {error?.message && (
          <p className="mt-1 text-xs text-text-tertiary">{error.message}</p>
        )}
      </div>
    );
  }

  return null;
}

function SearchLiveFeedback() {
  const t = useTranslations("searchPage");
  const { status } = useInstantSearch();
  const isUpdating = status === "loading" || status === "stalled";

  if (!isUpdating) {
    return null;
  }

  return (
    <p className="inline-flex items-center gap-2 text-xs font-medium text-accent">
      <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
      {t("updatingResults")}
    </p>
  );
}

function SearchUnavailable() {
  const t = useTranslations("searchPage");

  return (
    <main id="main-content" className="min-h-screen bg-background pb-16 pt-20 sm:pt-24">
      <div className="container-main">
        <h1 className="sr-only">{t("srHeading")}</h1>
        <div className="max-w-2xl rounded-2xl border border-border-subtle bg-background-secondary p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold text-text-primary">
            {t("searchUnavailableTitle")}
          </h2>
          <p className="text-sm text-text-secondary">
            {t("searchUnavailableDescription")}
          </p>
        </div>
      </div>
    </main>
  );
}

function EnsureSearchBootstrapped() {
  const { refresh, results } = useInstantSearch();
  const didBootstrapRef = useRef(false);

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }
    const isArtificial = Boolean(
      results && "__isArtificial" in results && results.__isArtificial,
    );

    if (isArtificial) {
      refresh();
    }

    didBootstrapRef.current = true;
  }, [refresh, results]);

  return null;
}

function RouteQueryStateSync({ routeQuery }: { routeQuery: string }) {
  const { indexUiState, setIndexUiState } = useInstantSearch();
  const lastAppliedRouteQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const shouldApplyRouteQuery = shouldApplyRouteQueryToIndexUiState({
      routeQuery,
      currentUiState: indexUiState as AlgoliaIndexUiState,
      lastAppliedRouteQuery: lastAppliedRouteQueryRef.current,
    });

    if (!shouldApplyRouteQuery) {
      lastAppliedRouteQueryRef.current = routeQuery;
      return;
    }

    setIndexUiState(routeQueryToIndexUiState(routeQuery));
    lastAppliedRouteQueryRef.current = routeQuery;
  }, [indexUiState, routeQuery, setIndexUiState]);

  return null;
}

function MobileRefinementPills() {
  const { items: activeRefinementGroups } = useCurrentRefinements();
  if (activeRefinementGroups.length === 0) return null;
  return (
    <div className="lg:hidden flex overflow-x-auto no-scrollbar gap-2 pb-4 -mx-4 px-4 snap-x">
      {activeRefinementGroups.flatMap((group) =>
        group.refinements.map((ref, i) => (
          <div
            key={`${group.attribute}-${i}-${ref.label}`}
            className="snap-start shrink-0 inline-flex items-center rounded-full border border-accent/20 bg-accent/8 pl-3 pr-4 py-1.5 text-xs font-semibold text-accent"
          >
            <span>{ref.label}</span>
          </div>
        )),
      )}
    </div>
  );
}

function MobileFilterButton({
  setShowMobileFilters,
  t,
}: {
  setShowMobileFilters: (v: boolean) => void;
  t: (key: string) => string;
}) {
  const { items: activeRefinementGroups } = useCurrentRefinements();
  const totalActiveFiltersCount = activeRefinementGroups.reduce(
    (count, group) => count + group.refinements.length,
    0,
  );
  return (
             <Button 
               variant="default"
               className="pointer-events-auto h-12 rounded-full px-6 shadow-xl flex items-center gap-2 bg-text-primary hover:bg-text-primary/90 text-background border-none uppercase tracking-wide font-black text-xs transition-transform hover:scale-105"
               onClick={() => setShowMobileFilters(true)}
             >
               <FilterIcon className="h-4 w-4" />
               {t("filters")}
               {totalActiveFiltersCount > 0 && (
                 <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white font-bold text-[10px]">
                   {totalActiveFiltersCount}
                 </span>
               )}
             </Button>
  );
}

function AlgoliaSearchContent() {
  const t = useTranslations("searchPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<SearchSortOption>("newest");
  const [isTypingSearch, setIsTypingSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const searchClient = useMemo(() => getSearchClient(), []);
  const indexName = useMemo(() => getCarsSortIndexName(sortOption), [sortOption]);
  const usesReplicaSort = indexName !== CARS_INDEX;
  const searchParamsSnapshot = searchParams.toString();
  const routeQuery = useMemo(
    () => normalizeRouteQuery(searchParamsSnapshot),
    [searchParamsSnapshot],
  );
  const lastSyncedQueryRef = useRef(routeQuery);
  const urlSyncDebounceRef = useRef<number | null>(null);
  const pendingUrlQueryRef = useRef<string | null>(null);
  const initialIndexUiState = useMemo(
    () => routeParamsToIndexUiState(new URLSearchParams(routeQuery)),
    [routeQuery],
  );
  const initialUiState = useMemo(() => {
    return {
      [indexName || CARS_INDEX]: initialIndexUiState,
    };
  }, [indexName, initialIndexUiState]);

  useEffect(() => {
    lastSyncedQueryRef.current = routeQuery;
  }, [routeQuery]);

  useEffect(() => {
    return () => {
      if (urlSyncDebounceRef.current !== null) {
        window.clearTimeout(urlSyncDebounceRef.current);
      }
    };
  }, []);

  if (!searchClient) {
    return <SearchUnavailable />;
  }

  return (
    <InstantSearchNext
      searchClient={searchClient}
      indexName={indexName || CARS_INDEX}
      initialUiState={initialUiState}
      ignoreMultipleHooksWarning
      onStateChange={({ uiState, setUiState }) => {
        setUiState(uiState);

        const activeIndexUiState = getActiveIndexUiState(
          uiState as Record<string, AlgoliaIndexUiState>,
          indexName,
        );
        const nextParams = indexUiStateToRouteParams(activeIndexUiState);
        const nextQuery = nextParams.toString();

        if (lastSyncedQueryRef.current === nextQuery) {
          return;
        }

        pendingUrlQueryRef.current = nextQuery;
        if (urlSyncDebounceRef.current !== null) {
          window.clearTimeout(urlSyncDebounceRef.current);
        }

        urlSyncDebounceRef.current = window.setTimeout(() => {
          const queuedQuery = pendingUrlQueryRef.current ?? "";
          if (lastSyncedQueryRef.current === queuedQuery) {
            urlSyncDebounceRef.current = null;
            return;
          }

          lastSyncedQueryRef.current = queuedQuery;
          const nextUrl = queuedQuery ? `${pathname}?${queuedQuery}` : pathname;
          // Keep App Router state in sync with the URL so browser back restores
          // the exact results page instead of reviving a stale blank cache entry.
          startTransition(() => {
            router.replace(nextUrl, { scroll: false });
          });
          urlSyncDebounceRef.current = null;
        }, URL_SYNC_DEBOUNCE_MS);
      }}
      // BUGFIX: preserveSharedStateOnUnmount=false ensures that navigating back to this page
      // correctly re-mounts the search state from the active URL parameters rather than using stale blank state
      future={{ preserveSharedStateOnUnmount: false }}
    >
      <Configure
        hitsPerPage={isTypingSearch ? 12 : 24}
        optionalFilters={["is_top_ad:true<score=10>"]}
        typoTolerance={isTypingSearch ? "min" : true}
      />
      <EnsureSearchBootstrapped />
      <RouteQueryStateSync routeQuery={routeQuery} />

      <main id="main-content" className="min-h-screen bg-background pb-16 pt-5 sm:pt-6">
        <h1 className="sr-only">{t("srHeading")}</h1>
        <div className="container-main">
          <div className="z-30 mb-4 rounded-2xl border border-border-strong bg-background-secondary/95 p-3.5 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background-secondary/85 lg:mb-5">
            <div className="flex flex-col gap-3">
              <div className="w-full">
                <SearchResultsSearchBox onTypingStateChange={setIsTypingSearch} />
              </div>
              <div className="flex w-full items-center justify-end h-0 overflow-visible">
                <SearchLiveFeedback />
              </div>
            </div>
          </div>

          <MobileRefinementPills />

          {showMobileFilters && (
            <div className="fixed inset-0 z-[100] bg-background lg:hidden flex flex-col isolate animate-in fade-in slide-in-from-bottom-8 duration-300">
              <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-background/95 backdrop-blur z-10">
                <h2 className="text-xl font-bold text-text-primary">{t("filters")}</h2>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 -mr-2 text-text-muted hover:text-text-primary rounded-full hover:bg-background-secondary transition-colors"
                >
                  <SearchIcon className="h-6 w-6 rotate-45" /> 
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 no-scrollbar bg-background">
                <FilterSidebar />
              </div>
              <div className="p-4 border-t border-border-subtle shrink-0 pb-safe bg-background z-10 sticky bottom-0">
                <Button className="w-full h-12 rounded-xl text-base shadow-lg" onClick={() => setShowMobileFilters(false)}>
                  {t("showResults")}
                </Button>
              </div>
            </div>
          )}

          <div className="lg:hidden fixed bottom-6 left-0 right-0 z-40 flex justify-center items-center pointer-events-none px-4 gap-3">
             <div className="pointer-events-auto">
               <SaveSearchButton queryString={routeQuery} />
             </div>
             <MobileFilterButton setShowMobileFilters={setShowMobileFilters} t={t} />
          </div>

          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
            <aside className="order-1 hidden lg:block lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-secondary shadow-sm">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4 lg:shrink-0">
                  <h2 className="!text-2xl font-black leading-none tracking-tight text-text-primary">
                    {t("filters")}
                  </h2>
                  <SaveSearchButton queryString={routeQuery} />
                </div>
                <div className="p-4">
                  <FilterSidebar />
                </div>
              </div>
            </aside>



            <section id="results-grid" className="order-2 min-w-0 scroll-mt-6 lg:order-2">
              <div className="relative z-[110] mb-3 flex flex-wrap items-center justify-end gap-2 overflow-visible rounded-lg border border-border-subtle bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85 isolate">
                <div className="flex w-full justify-end sm:w-auto items-center gap-2">
                  <span className="whitespace-nowrap text-sm font-semibold text-text-muted">
                    {t("sortBy")}
                  </span>
                  <SearchSortBy value={sortOption} onChange={setSortOption} />
                </div>

                <div className="hidden sm:flex">
                  <SearchViewToggle
                    viewMode={viewMode}
                    onToggle={() => setViewMode((currentValue) => (currentValue === "grid" ? "list" : "grid"))}
                  />
                </div>
              </div>

              <SearchStateNotice />
              <SortedHits
                viewMode={viewMode}
                emptyState={<NoResults />}
              />

              <div className="mt-10 border-t border-border-subtle pt-6">
                <SearchPagination />
              </div>
            </section>
          </div>
        </div>
      </main>
    </InstantSearchNext>
  );
}

function NoResults() {
  const t = useTranslations("searchPage");
  const { indexUiState, results, setIndexUiState } = useInstantSearch();
  const canResetFilters = useMemo(() => {
    const hasActiveQuery =
      typeof indexUiState?.query === "string" && indexUiState.query.trim().length > 0;
    const hasActiveRefinements = (results?.getRefinements?.().length ?? 0) > 0;

    return hasActiveQuery || hasActiveRefinements;
  }, [indexUiState, results]);

  const handleResetFilters = useCallback(() => {
    setIndexUiState({});
  }, [setIndexUiState]);

  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border-subtle bg-background-secondary">
        <SearchIcon className="h-8 w-8 text-text-tertiary" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-text-primary">{t("noResults")}</h3>
      <p className="mx-auto mb-8 max-w-sm text-sm text-text-secondary">
        {t("noResultsText")}
      </p>
      <Button variant="secondary" onClick={handleResetFilters} disabled={!canResetFilters}>
        {t("resetAllFilters")}
      </Button>
    </div>
  );
}

export default function AlgoliaSearchPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background pb-16 pt-24">
          <div className="container-main">
            <div className="mb-8">
              <Skeleton className="h-12 max-w-2xl" />
            </div>
            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside>
                <Skeleton className="h-[560px] rounded-2xl" />
              </aside>
              <div>
                <div className="mb-6 rounded-2xl border border-border-subtle p-4">
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
