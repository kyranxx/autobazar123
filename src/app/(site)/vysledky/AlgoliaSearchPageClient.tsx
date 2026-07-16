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
  useStats,
} from "react-instantsearch";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getCarsIndexName,
  getSearchClient,
  AlgoliaCarRecord,
} from "@/lib/algolia";
import {
  DEFAULT_MARKET_CODE,
  getAlgoliaMarketFilter,
  resolveMarketCodeFromHost,
} from "@/config/markets";
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
import { getVehicleCountMessageKey } from "@/lib/search/result-count-copy";
import { cn } from "@/utils/cn";
import { getMarketPath } from "@/lib/routes";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { Button } from "@/components/ui/shadcn/button";
import { SearchIcon, FilterIcon, ChevronDownIcon, XIcon } from "@/components/ui/Icons";

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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
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
  const orderedItems =
    showSponsoredBlocks && isFirstPage
      ? [...topItems, ...premiumItems, ...organicItems]
      : sortedItems;

  return (
    <div className="relative">
      <AlgoliaHitsGrid
        hits={orderedItems}
        isUpdating={isUpdating}
        viewMode={viewMode}
      />
    </div>
  );
}

function AlgoliaHitsGrid({
  hits,
  isUpdating,
  viewMode,
}: {
  hits: AlgoliaCarRecord[];
  isUpdating: boolean;
  viewMode: "grid" | "list";
}) {
  const eagerPhotoUrls = useMemo(
    () =>
      new Set(
        hits
          .slice(0, 3)
          .map((hit) => hit.photos_json?.[0])
          .filter((photoUrl): photoUrl is string => Boolean(photoUrl)),
      ),
    [hits],
  );
  const effectiveViewMode =
    viewMode === "grid" && hits.length === 1 ? "list" : viewMode;

  return (
    <div
      key={`${viewMode}-${hits.length}`}
      className={cn(
        effectiveViewMode === "grid"
          ? "grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3"
          : "flex flex-col gap-5",
        isUpdating && "opacity-70 transition-opacity",
      )}
    >
      {hits.map((hit, index) => (
        <CarHit
          key={hit.objectID}
          hit={hit}
          viewMode={effectiveViewMode}
          preloadImage={index < 3}
          eagerPhotoUrls={eagerPhotoUrls}
        />
      ))}
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
      <span className="size-2 animate-pulse rounded-full bg-accent" />
      {t("updatingResults")}
    </p>
  );
}

function SearchUnavailable() {
  const t = useTranslations("searchPage");

  return (
    <main id="main-content" className="min-h-screen pb-16 pt-20 sm:pt-24">
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

function MobileFilterButton({
  isOpen,
  setShowMobileFilters,
  t,
  className,
  iconOnly = false,
}: {
  isOpen: boolean;
  setShowMobileFilters: (v: boolean) => void;
  t: (key: string) => string;
  className?: string;
  iconOnly?: boolean;
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
      className={cn(
        "market-action-secondary pointer-events-auto flex h-11 w-full !justify-between px-4 text-sm",
        className,
      )}
      onClick={() => setShowMobileFilters(!isOpen)}
    >
      <span className="flex items-center gap-2">
        <FilterIcon className="size-4" />
        <span className={cn(iconOnly && "sr-only")}>{t("filters")}</span>
      </span>
      <span className={cn("flex items-center gap-2", iconOnly && "hidden")}>
        {totalActiveFiltersCount > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
            {totalActiveFiltersCount}
          </span>
        ) : null}
        <ChevronDownIcon
          className={cn(
            "size-4 text-text-muted transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </span>
    </Button>
  );
}

function MobileResultsControls({
  sortOption,
  setSortOption,
  showMobileFilters,
  setShowMobileFilters,
}: {
  sortOption: SearchSortOption;
  setSortOption: (value: SearchSortOption) => void;
  showMobileFilters: boolean;
  setShowMobileFilters: (value: boolean) => void;
}) {
  const t = useTranslations("searchPage");

  return (
    <div className="market-panel mb-3 flex items-center gap-2 px-2.5 py-2 lg:hidden">
      <div className="min-w-0 flex-1">
        <ResultsToolbarSummary />
      </div>
      <SearchSortBy
        value={sortOption}
        onChange={setSortOption}
        className="w-[132px]"
        buttonClassName="h-11 bg-background px-3"
      />
      <MobileFilterButton
        isOpen={showMobileFilters}
        setShowMobileFilters={setShowMobileFilters}
        t={t}
        className="w-12 !justify-center px-0"
        iconOnly
      />
    </div>
  );
}

function MobileFilterSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("searchPage");
  const tFilters = useTranslations("filters");
  const { nbHits } = useStats();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140] lg:hidden" role="presentation">
      <button
        type="button"
        aria-label={tFilters("close")}
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <section
        id="mobile-filter-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-filter-title"
        className="absolute inset-x-0 bottom-0 max-h-[86svh] overflow-hidden rounded-t-2xl border border-border-subtle bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 id="mobile-filter-title" className="!text-2xl font-semibold text-text-primary">
            {t("filters")}
          </h2>
          <button
            type="button"
            aria-label={tFilters("close")}
            onClick={onClose}
            className="market-icon-button flex size-10 items-center justify-center text-text-secondary"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="max-h-[calc(86svh-8.5rem)] overflow-y-auto px-3 py-3">
          <FilterSidebar idScope="mobile-filters" />
        </div>
        <div className="border-t border-border-subtle bg-background px-3 py-3">
          <Button type="button" className="h-11 w-full" onClick={onClose}>
            {t("showResultsCount", { count: nbHits })}
          </Button>
        </div>
      </section>
    </div>
  );
}

function ResultsToolbarSummary() {
  const t = useTranslations("searchPage");
  const { nbHits } = useStats();

  return (
    <div className="min-w-0">
      <p className="market-kicker">{t("results")}</p>
      <p className="mt-0.5 text-sm font-semibold text-text-primary">
        {t(getVehicleCountMessageKey(nbHits), { count: nbHits })}
      </p>
    </div>
  );
}

function AlgoliaSearchContent() {
  const t = useTranslations("searchPage");
  const { replace } = useRouter();
  const pathname = usePathname();
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
  const marketCode = useMemo(
    () =>
      typeof window === "undefined"
        ? DEFAULT_MARKET_CODE
        : resolveMarketCodeFromHost(window.location.host),
    [],
  );
  const isResultsRoute = pathname === getMarketPath("/vysledky", marketCode);
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
    // Unmount the search tree outside the localized inventory route so it starts clean on re-entry.
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
            replace(nextUrl, { scroll: false });
          });
          urlSyncDebounceRef.current = null;
        }, URL_SYNC_DEBOUNCE_MS);
      }}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure
        hitsPerPage={isTypingSearch ? 12 : 24}
        filters={getAlgoliaMarketFilter(marketCode)}
        typoTolerance={isTypingSearch ? "min" : true}
      />
      <EnsureSearchBootstrapped />
      <RouteQueryStateSync routeQuery={routeQuery} />

      <main id="main-content" className="min-h-screen bg-background-muted pb-16">
        <h1 className="sr-only">{t("title")}</h1>
        <div className="border-b border-border-subtle bg-background-secondary">
          <div className="container-main hidden py-4 lg:flex lg:items-center lg:gap-4 xl:max-w-[100rem]">
            <div className="min-w-0 flex-1">
              <SearchResultsSearchBox onTypingStateChange={setIsTypingSearch} />
            </div>
            <SaveSearchButton queryString={routeQuery} />
          </div>
        </div>

        <div className="container-main pt-3 lg:pt-5 xl:max-w-[100rem]">
          <div className="hidden min-h-4 lg:block"><SearchLiveFeedback /></div>

          <MobileResultsControls
            sortOption={sortOption}
            setSortOption={setSortOption}
            showMobileFilters={showMobileFilters}
            setShowMobileFilters={setShowMobileFilters}
          />

          <MobileFilterSheet
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
          />

          <div className="grid items-start gap-6 lg:grid-cols-[292px_minmax(0,1fr)]">
            <aside className="order-1 hidden lg:block lg:self-start">
              <div className="sticky top-4 overflow-hidden border border-border-subtle bg-background-secondary shadow-sm">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 lg:shrink-0">
                  <h2 className="!text-base font-semibold leading-none tracking-tight text-text-primary">
                    {t("filters")}
                  </h2>
                </div>
                <div className="p-4">
                  <FilterSidebar idScope="desktop-filters" />
                </div>
              </div>
            </aside>
            <section id="results-grid" className="order-2 min-w-0 scroll-mt-6 lg:order-2">
              <div className="relative z-20 mb-4 hidden flex-wrap items-center justify-between gap-3 overflow-visible border-b border-border-strong bg-transparent pb-3 isolate lg:flex">
                <ResultsToolbarSummary />
                <div className="flex w-full justify-end sm:w-auto items-center gap-2">
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
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-border-subtle bg-background-secondary">
        <SearchIcon className="size-8 text-text-tertiary" />
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
        <main className="min-h-screen pb-16 pt-5 sm:pt-6">
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
