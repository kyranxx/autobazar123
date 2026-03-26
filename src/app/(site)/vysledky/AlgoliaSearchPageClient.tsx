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
  InstantSearch,
  useHits,
  useInstantSearch,
  useCurrentRefinements,
} from "react-instantsearch";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getCarsIndexName,
  getSearchClient,
  AlgoliaCarRecord,
} from "@/lib/algolia";
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
  SearchSortBy,
  SearchViewToggle,
  SearchPagination,
} from "@/components/search";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { Button } from "@/components/ui/shadcn/button";
import { SearchIcon, FilterIcon, ChevronDownIcon } from "@/components/ui/Icons";

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
  showSponsoredBlocks,
}: {
  viewMode: "grid" | "list";
  emptyState?: ReactNode;
  showSponsoredBlocks: boolean;
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

  const isFirstPage = (results?.page || 0) === 0;
  const topItems = sortedItems.filter(
    (hit) => hit.promotion_tier === "top" || hit.is_top_ad,
  );
  const premiumItems = sortedItems.filter(
    (hit) =>
      !(hit.promotion_tier === "top" || hit.is_top_ad)
      && (hit.promotion_tier === "premium" || hit.is_highlighted),
  );
  const organicItems =
    showSponsoredBlocks && isFirstPage
      ? sortedItems.filter(
          (hit) =>
            !topItems.some((entry) => entry.objectID === hit.objectID)
            && !premiumItems.some((entry) => entry.objectID === hit.objectID),
        )
      : sortedItems;

  const renderHits = (hits: AlgoliaCarRecord[]) => (
    <div
      key={`${viewMode}-${hits.length}`}
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          : "flex flex-col gap-5",
        isUpdating && "opacity-70 transition-opacity",
      )}
    >
      {hits.map((hit, index) => (
        <CarHit
          key={hit.objectID}
          hit={hit}
          viewMode={viewMode}
          preloadImage={index < 3}
        />
      ))}
    </div>
  );

  return (
    <div className="relative">
      {showSponsoredBlocks && isFirstPage && topItems.length > 0 ? (
        <section className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-accent">
            Exclusive inzeráty
          </p>
          {renderHits(topItems)}
        </section>
      ) : null}
      {showSponsoredBlocks && isFirstPage && premiumItems.length > 0 ? (
        <section className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Premium inzeráty
          </p>
          {renderHits(premiumItems)}
        </section>
      ) : null}
      {renderHits(organicItems)}
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
  isOpen,
  setShowMobileFilters,
  t,
}: {
  isOpen: boolean;
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
      aria-controls="mobile-filter-panel"
      aria-expanded={isOpen}
      className="pointer-events-auto flex h-11 w-full items-center justify-between gap-2 rounded-[1.45rem] border border-border-strong bg-background px-4 text-sm font-black text-text-primary shadow-sm transition-colors hover:bg-background-secondary"
      onClick={() => setShowMobileFilters(!isOpen)}
    >
      <span className="flex items-center gap-2">
        <FilterIcon className="h-4 w-4" />
        {t("filters")}
      </span>
      <span className="flex items-center gap-2">
        {totalActiveFiltersCount > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
            {totalActiveFiltersCount}
          </span>
        ) : null}
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 text-text-muted transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </span>
    </Button>
  );
}

function AlgoliaSearchContent() {
  const t = useTranslations("searchPage");
  const router = useRouter();
  const pathname = usePathname();
  const isResultsRoute = pathname === "/vysledky";
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<SearchSortOption>("newest");
  const [isTypingSearch, setIsTypingSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const searchParamsSnapshot = searchParams.toString();
  const routeQuery = useMemo(
    () => normalizeRouteQuery(searchParamsSnapshot),
    [searchParamsSnapshot],
  );
  const baseIndexName = useMemo(() => getCarsIndexName(), []);
  const searchClient = useMemo(() => getSearchClient(), []);
  const indexName = useMemo(() => getCarsSortIndexName(sortOption), [sortOption]);
  const lastSyncedQueryRef = useRef(routeQuery);
  const urlSyncDebounceRef = useRef<number | null>(null);
  const pendingUrlQueryRef = useRef<string | null>(null);
  const initialIndexUiState = useMemo(
    () => routeParamsToIndexUiState(new URLSearchParams(routeQuery)),
    [routeQuery],
  );
  const initialUiState = useMemo(() => {
    return {
      [indexName || baseIndexName]: initialIndexUiState,
    };
  }, [baseIndexName, indexName, initialIndexUiState]);

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

  if (!isResultsRoute) {
    // App Router can keep this client route mounted offscreen across sibling navigations.
    // Unmount the search tree outside `/vysledky` so it starts clean on re-entry.
    return null;
  }

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={indexName || baseIndexName}
      initialUiState={initialUiState}
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
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure
        hitsPerPage={isTypingSearch ? 12 : 24}
        typoTolerance={isTypingSearch ? "min" : true}
      />
      <EnsureSearchBootstrapped />
      <RouteQueryStateSync routeQuery={routeQuery} />

      <main id="main-content" className="min-h-screen bg-background pb-16 pt-5 sm:pt-6">
        <h1 className="sr-only">{t("srHeading")}</h1>
        <div className="container-main">
          <div className="mb-4 rounded-[1.45rem] border border-border-subtle bg-background-secondary/92 p-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background-secondary/85 sm:p-3 lg:mb-5 lg:rounded-2xl">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="w-full">
                <SearchResultsSearchBox onTypingStateChange={setIsTypingSearch} />
              </div>
              <div className="lg:hidden">
                <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
                  <span className="text-sm font-semibold text-text-muted">{t("sortBy")}</span>
                  <SearchSortBy
                    value={sortOption}
                    onChange={setSortOption}
                    className="w-[148px]"
                    buttonClassName="rounded-[1.45rem] bg-background"
                  />
                </div>
              </div>
              <div className="flex min-h-4 w-full items-center justify-end">
                <SearchLiveFeedback />
              </div>
            </div>
          </div>

          <div className="sticky top-2 z-30 mb-3 lg:hidden">
            <div className="rounded-[1.45rem] bg-background-secondary/96 backdrop-blur supports-[backdrop-filter]:bg-background-secondary/90">
              <MobileFilterButton
                isOpen={showMobileFilters}
                setShowMobileFilters={setShowMobileFilters}
                t={t}
              />
            </div>
          </div>

          <div
            id="mobile-filter-panel"
            className={cn(
              "overflow-hidden rounded-[1.45rem] border border-border-subtle bg-background transition-all duration-200 lg:hidden",
              showMobileFilters
                ? "mb-3 max-h-[70svh] opacity-100"
                : "mb-0 max-h-0 border-transparent opacity-0",
            )}
          >
            <div className="max-h-[70svh] overflow-y-auto p-3">
              <FilterSidebar />
            </div>
          </div>

          <MobileRefinementPills />

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
              <div className="relative z-20 mb-3 hidden flex-wrap items-center justify-end gap-2 overflow-visible rounded-lg border border-border-subtle bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85 isolate sm:flex">
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
                showSponsoredBlocks={sortOption === "newest"}
                emptyState={<NoResults />}
              />

              <div className="mt-10 border-t border-border-subtle pt-6">
                <SearchPagination />
              </div>
            </section>
          </div>
        </div>
      </main>
    </InstantSearch>
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
        <main className="min-h-screen bg-background pb-16 pt-5 sm:pt-6">
          <div className="container-main">
            <div className="mb-4 h-20 animate-pulse rounded-2xl border border-border-subtle bg-background-secondary/60 lg:mb-5" />
            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="hidden h-[560px] animate-pulse rounded-2xl border border-border-subtle bg-background-secondary/60 lg:block" />
              <div>
                <div className="mb-3 h-14 animate-pulse rounded-lg border border-border-subtle bg-background-secondary/60" />
                <LoadingGrid count={6} />
              </div>
            </div>
          </div>
        </main>
      }
    >
      <AlgoliaSearchContent />
    </Suspense>
  );
}
