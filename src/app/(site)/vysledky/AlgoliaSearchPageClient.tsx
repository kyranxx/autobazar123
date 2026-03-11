"use client";

import {
  Suspense,
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
  FilterSidebar,
  SearchResultsSearchBox,
  CarHit,
  SearchStats,
  SearchSortBy,
  SearchPagination,
} from "@/components/search";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { Button } from "@/components/ui/shadcn/button";
import { GridIcon, ListIcon, SearchIcon } from "@/components/ui/Icons";

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

function LoadingGrid({ count = 6 }: { count?: number }) {
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
  sortOption,
  usesReplicaSort,
  emptyState,
}: {
  viewMode: "grid" | "list";
  sortOption: SearchSortOption;
  usesReplicaSort: boolean;
  emptyState?: ReactNode;
}) {
  const { items } = useHits<AlgoliaCarRecord>();
  const { status, results } = useInstantSearch();
  const sortedItems =
    usesReplicaSort || sortOption === "newest"
      ? items
      : [...items].sort((leftItem, rightItem) => {
          switch (sortOption) {
            case "price_asc":
              return (leftItem.price_eur || 0) - (rightItem.price_eur || 0);
            case "price_desc":
              return (rightItem.price_eur || 0) - (leftItem.price_eur || 0);
            case "year_desc":
              return (rightItem.year || 0) - (leftItem.year || 0);
            case "mileage_asc":
              return (leftItem.mileage_km || 0) - (rightItem.mileage_km || 0);
            default:
              return 0;
          }
        });

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
            priorityImage={index < 2}
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

function AlgoliaSearchContent() {
  const t = useTranslations("searchPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<SearchSortOption>("newest");
  const [isTypingSearch, setIsTypingSearch] = useState(false);
  const searchClient = useMemo(() => getSearchClient(), []);
  const indexName = useMemo(() => getCarsSortIndexName(sortOption), [sortOption]);
  const usesReplicaSort = indexName !== CARS_INDEX;
  const searchParamsSnapshot = searchParams.toString();
  const lastSyncedQueryRef = useRef(searchParamsSnapshot);
  const urlSyncDebounceRef = useRef<number | null>(null);
  const pendingUrlQueryRef = useRef<string | null>(null);
  const initialIndexUiState = useMemo(
    () => routeParamsToIndexUiState(new URLSearchParams(searchParamsSnapshot)),
    [searchParamsSnapshot],
  );
  const initialUiState = useMemo(() => {
    return {
      [indexName || CARS_INDEX]: initialIndexUiState,
    };
  }, [indexName, initialIndexUiState]);

  useEffect(() => {
    lastSyncedQueryRef.current = searchParamsSnapshot;
  }, [searchParamsSnapshot]);

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
          router.replace(nextUrl, { scroll: false });
          urlSyncDebounceRef.current = null;
        }, URL_SYNC_DEBOUNCE_MS);
      }}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure
        hitsPerPage={isTypingSearch ? 12 : 24}
        optionalFilters={["is_top_ad:true<score=10>"]}
        typoTolerance={isTypingSearch ? "min" : undefined}
      />
      <EnsureSearchBootstrapped />

      <main id="main-content" className="min-h-screen bg-background pb-16 pt-10 sm:pt-12">
        <h1 className="sr-only">{t("srHeading")}</h1>
        <div className="container-main">
          <div className="z-30 mb-5 rounded-2xl border border-border-strong bg-background-secondary/95 p-4 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background-secondary/85 lg:sticky lg:top-[5.5rem] lg:mb-6">
            <div className="flex flex-col gap-3">
              <div className="w-full">
                <SearchResultsSearchBox onTypingStateChange={setIsTypingSearch} />
              </div>
              <div className="flex min-h-6 items-center justify-between gap-2 text-sm text-text-secondary">
                <p className="text-xs font-medium text-text-muted">{t("subtitle")}</p>
                <SearchLiveFeedback />
              </div>
            </div>
          </div>

          <div className="grid gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="order-1 lg:order-1">
              <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-secondary shadow-sm">
                <div className="border-b border-border-subtle px-6 py-5 lg:shrink-0">
                  <h2 className="!text-2xl font-black leading-none tracking-tight text-text-primary">
                    {t("filters")}
                  </h2>
                </div>
                <div className="p-6">
                  <FilterSidebar />
                </div>
              </div>
            </aside>

            <section id="results-grid" className="order-2 min-w-0 scroll-mt-6 lg:order-2">
              <div className="z-20 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-background/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:sticky lg:top-[11.5rem]">
                <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-text-secondary">
                  <SearchStats />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-text-muted sm:inline">
                      {t("sortBy")}
                    </span>
                    <SearchSortBy value={sortOption} onChange={setSortOption} />
                  </div>

                  <div className="hidden items-center rounded-lg border border-border-subtle bg-background-secondary p-1 sm:flex">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200",
                        viewMode === "grid"
                          ? "bg-background text-text-primary shadow-sm"
                          : "text-text-tertiary hover:text-text-secondary",
                      )}
                      aria-label={t("gridView")}
                    >
                      <GridIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200",
                        viewMode === "list"
                          ? "bg-background text-text-primary shadow-sm"
                          : "text-text-tertiary hover:text-text-secondary",
                      )}
                      aria-label={t("listView")}
                    >
                      <ListIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <SearchStateNotice />
              <SortedHits
                viewMode={viewMode}
                sortOption={sortOption}
                usesReplicaSort={usesReplicaSort}
                emptyState={<NoResults />}
              />

              <div className="mt-12 border-t border-border-subtle pt-8">
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
