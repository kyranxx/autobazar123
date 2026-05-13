"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRefinementList, useSearchBox, useStats } from "react-instantsearch";
import { useLocale, useTranslations } from "next-intl";
import { SEARCH_RESULTS_CONFIG } from "@/config/config";
import { Button } from "@/components/ui/shadcn/button";
import { CarIcon, SearchIcon, TagIcon, XIcon } from "@/components/ui/Icons";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import {
  getCarsIndexName,
  searchSingleIndex,
  type AlgoliaCarRecord,
} from "@/lib/algolia";
import { usePublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/client";
import { cn } from "@/utils/cn";

interface SearchResultsSearchBoxProps {
  autoFocus?: boolean;
  onTypingStateChange?: (isTyping: boolean) => void;
}

type SearchSuggestionKind = "brand" | "model";
type SearchLocale = "sk" | "en" | "hu";

interface SearchSuggestion {
  type: SearchSuggestionKind;
  label: string;
  value: string;
  facetValue?: string;
  brandValue?: string;
  count?: number;
}

interface SearchBoxViewState {
  inputValue: string;
  highlightedIndex: number;
  isComposing: boolean;
  showSuggestions: boolean;
  shouldAnimateSuggestions: boolean;
}

type SearchBoxAction =
  | { type: "applyExternalQuery"; value: string }
  | { type: "applyInput"; value: string }
  | { type: "applySuggestion"; value: string; keepSuggestionsOpen: boolean }
  | { type: "clearInput" }
  | { type: "closeSuggestions" }
  | { type: "disableSuggestionAnimation" }
  | { type: "openSuggestions" }
  | { type: "setComposing"; value: boolean }
  | { type: "setHighlightedIndex"; value: number };

function normalizeSearchInput(rawValue: string): string {
  // Normalize mixed separators so keyboard input, paste input, and URL state converge.
  return rawValue
    .replace(/\u3000/g, " ")
    .replace(/[;,|/]+/g, " ")
    .replace(/\s+/g, " ")
    .trimStart();
}

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

function containsNormalizedMatch(value: string, normalizedNeedle: string): boolean {
  return normalizeForMatch(value).includes(normalizedNeedle);
}

function containsNormalizedValue(normalizedValue: string, normalizedNeedle: string): boolean {
  return normalizedValue.includes(normalizedNeedle);
}

function getSearchInteractionCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    return Number(
      window.localStorage.getItem(SEARCH_RESULTS_CONFIG.interactionStorageKey) || "0",
    );
  } catch {
    return 0;
  }
}

function createInitialSearchBoxState(query: string): SearchBoxViewState {
  return {
    inputValue: query,
    highlightedIndex: -1,
    isComposing: false,
    showSuggestions: false,
    shouldAnimateSuggestions:
      getSearchInteractionCount() < SEARCH_RESULTS_CONFIG.frequentSearchThreshold,
  };
}

function searchBoxReducer(
  state: SearchBoxViewState,
  action: SearchBoxAction,
): SearchBoxViewState {
  switch (action.type) {
    case "applyExternalQuery":
      return {
        ...state,
        inputValue: action.value,
        highlightedIndex: -1,
        showSuggestions:
          action.value.trim().length >= SEARCH_RESULTS_CONFIG.minSuggestionLength,
      };
    case "applyInput":
      return {
        ...state,
        inputValue: action.value,
        highlightedIndex: -1,
        showSuggestions:
          action.value.trim().length >= SEARCH_RESULTS_CONFIG.minSuggestionLength,
      };
    case "applySuggestion":
      return {
        ...state,
        inputValue: action.value,
        highlightedIndex: -1,
        showSuggestions: action.keepSuggestionsOpen,
      };
    case "clearInput":
      return {
        ...state,
        inputValue: "",
        highlightedIndex: -1,
        showSuggestions: false,
      };
    case "closeSuggestions":
      return { ...state, highlightedIndex: -1, showSuggestions: false };
    case "disableSuggestionAnimation":
      return { ...state, shouldAnimateSuggestions: false };
    case "openSuggestions":
      return { ...state, showSuggestions: true };
    case "setComposing":
      return { ...state, isComposing: action.value };
    case "setHighlightedIndex":
      return { ...state, highlightedIndex: action.value };
    default:
      return state;
  }
}

function getScopedModelQuery(inputValue: string, activeBrand: string | null): string {
  const trimmedValue = inputValue.trim();
  if (!activeBrand) {
    return trimmedValue;
  }

  const normalizedInput = normalizeForMatch(trimmedValue);
  const normalizedBrand = normalizeForMatch(activeBrand);

  if (normalizedInput === normalizedBrand) {
    return "";
  }

  if (normalizedInput.startsWith(`${normalizedBrand} `)) {
    return trimmedValue.slice(activeBrand.length).trim();
  }

  return trimmedValue;
}

function uniqueCaseInsensitive(values: string[]): string[] {
  return values.filter(
    (value, index) =>
      values.findIndex((candidate) => normalizeForMatch(candidate) === normalizeForMatch(value)) ===
      index,
  );
}

function findTypedBrand(inputValue: string, brandPool: string[]): string | null {
  const normalizedInput = normalizeForMatch(inputValue);

  return (
    brandPool.find((candidate) => {
      const normalizedCandidate = normalizeForMatch(candidate);
      return (
        normalizedInput === normalizedCandidate ||
        normalizedInput.startsWith(`${normalizedCandidate} `)
      );
    }) ?? null
  );
}

function dedupeSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
  return suggestions.filter(
    (suggestion, index) =>
      suggestions.findIndex((candidate) => {
        return (
          candidate.type === suggestion.type &&
          normalizeForMatch(candidate.value) === normalizeForMatch(suggestion.value) &&
          normalizeForMatch(candidate.brandValue ?? "") ===
            normalizeForMatch(suggestion.brandValue ?? "")
        );
      }) === index,
  );
}

async function fetchRemoteSuggestions(
  inputValue: string,
  selectedBrand: string | null,
  liveBrandPool: string[],
): Promise<SearchSuggestion[]> {
  const trimmedValue = inputValue.trim();
  if (trimmedValue.length < SEARCH_RESULTS_CONFIG.minSuggestionLength) {
    return [];
  }

  const typedBrand = findTypedBrand(trimmedValue, liveBrandPool);
  const normalizedInput = normalizeForMatch(trimmedValue);
  const selectedBrandMatchesInput =
    selectedBrand &&
    (normalizedInput === normalizeForMatch(selectedBrand) ||
      normalizedInput.startsWith(`${normalizeForMatch(selectedBrand)} `));
  const activeBrand = selectedBrandMatchesInput ? selectedBrand : typedBrand;
  const modelNeedle = normalizeForMatch(getScopedModelQuery(trimmedValue, activeBrand));

  try {
    const results = await searchSingleIndex<AlgoliaCarRecord>({
      indexName: getCarsIndexName(),
      searchParams: {
        query: trimmedValue,
        hitsPerPage: SEARCH_RESULTS_CONFIG.remoteSuggestionLimit * 2,
        facets: ["brand", "model"],
        maxValuesPerFacet: SEARCH_RESULTS_CONFIG.remoteSuggestionLimit,
        optionalFilters: [SEARCH_RESULTS_CONFIG.topAdOptionalFilter],
        ...(activeBrand ? { facetFilters: [`brand:${activeBrand}`] } : {}),
      },
    });

    const brandFacet = results.facets?.brand ?? {};
    const modelFacet = results.facets?.model ?? {};
    const hits = (results.hits ?? []) as AlgoliaCarRecord[];

    const matchingBrandFacets: Array<[string, number]> = [];
    if (!activeBrand) {
      for (const entry of Object.entries(brandFacet)) {
        if (containsNormalizedMatch(entry[0], normalizedInput)) {
          matchingBrandFacets.push(entry);
        }
      }
    }
    matchingBrandFacets.sort((left, right) => right[1] - left[1]);
    const brandSuggestions: SearchSuggestion[] = matchingBrandFacets
      .slice(0, SEARCH_RESULTS_CONFIG.brandModelSuggestionLimit)
      .map(([brand, count]) => ({
        type: "brand",
        label: brand,
        value: brand,
        count,
      }));

    const matchingModelEntries: Array<{ brand: string; model: string }> = [];
    const normalizedActiveBrand = activeBrand ? normalizeForMatch(activeBrand) : "";
    for (const hit of hits) {
      const hitBrand = typeof hit.brand === "string" ? hit.brand : "";
      const hitModel = typeof hit.model === "string" ? hit.model : "";
      if (hitBrand.length === 0 || hitModel.length === 0) {
        continue;
      }
      if (activeBrand && normalizeForMatch(hitBrand) !== normalizedActiveBrand) {
        continue;
      }
      if (modelNeedle && !containsNormalizedMatch(hitModel, modelNeedle)) {
        continue;
      }
      matchingModelEntries.push({ brand: hitBrand, model: hitModel });
    }
    const modelSuggestions: SearchSuggestion[] = matchingModelEntries
      .slice(0, SEARCH_RESULTS_CONFIG.brandModelSuggestionLimit)
      .map((entry) => ({
        type: "model",
        label: activeBrand ? entry.model : `${entry.brand} ${entry.model}`,
        value: `${entry.brand} ${entry.model}`,
        facetValue: entry.model,
        brandValue: entry.brand,
        count: modelFacet[entry.model],
      }));

    return dedupeSuggestions([...brandSuggestions, ...modelSuggestions]).slice(
      0,
      SEARCH_RESULTS_CONFIG.remoteSuggestionLimit,
    );
  } catch {
    return [];
  }
}

function SuggestionDropdown({
  suggestions,
  highlightedIndex,
  shouldAnimate,
  onSuggestionClick,
  onSuggestionHover,
}: {
  suggestions: SearchSuggestion[];
  highlightedIndex: number;
  shouldAnimate: boolean;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  onSuggestionHover: (index: number) => void;
}) {
  const t = useTranslations("homeSearch");

  return (
    <div
      className={cn(
        "absolute top-full left-0 right-0 mt-2 z-[100]",
        "bg-background-secondary rounded-xl border border-border-subtle",
        "shadow-lg overflow-hidden",
        shouldAnimate && "animate-in fade-in slide-in-from-top-2 duration-200",
      )}
    >
      <ul className="fade-edge-y max-h-80 overflow-y-auto py-2 scrollbar-thin overscroll-y-contain">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.type}-${suggestion.brandValue ?? ""}-${suggestion.value}`}>
            <button
              data-suggestion-index={index}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSuggestionClick(suggestion)}
              onMouseEnter={() => onSuggestionHover(index)}
              className={cn(
                "flex min-h-11 items-center justify-between w-full px-4 py-2.5",
                "text-left transition-colors",
                highlightedIndex === index ? "bg-accent/10" : "hover:bg-background-tertiary",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center shrink-0",
                    suggestion.type === "brand" && "bg-accent/10 text-accent",
                    suggestion.type === "model" && "bg-success/10 text-success",
                  )}
                >
                  {suggestion.type === "brand" ? (
                    <CarIcon className="size-4" />
                  ) : (
                    <TagIcon className="size-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-text-primary block truncate">
                    {suggestion.label}
                  </span>
                  <span className="text-xs text-text-muted">
                    {suggestion.type === "brand" ? t("suggestionBrand") : t("suggestionModel")}
                  </span>
                </div>
              </div>
              {suggestion.count !== undefined && (
                <span className="text-xs text-text-muted tabular-nums shrink-0 ml-2">
                  {suggestion.count}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function useSearchResultsController(
  autoFocus: boolean,
  onTypingStateChange?: (isTyping: boolean) => void,
) {
  const { brandNames, modelsByBrandName } = usePublicVehicleTaxonomy();
  const locale = useLocale() as SearchLocale;
  const t = useTranslations("search");
  const { query, refine: refineQuery } = useSearchBox({}, { skipSuspense: true });
  const { nbHits } = useStats();
  const { items: brandItems, refine: refineBrand } = useRefinementList(
    { attribute: "brand" },
    { skipSuspense: true },
  );
  const { items: modelItems, refine: refineModel } = useRefinementList(
    { attribute: "model" },
    { skipSuspense: true },
  );

  const [state, dispatch] = useReducer(searchBoxReducer, query, createInitialSearchBoxState);
  const [remoteSuggestions, setRemoteSuggestions] = useState<SearchSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const refineDebounceRef = useRef<number | null>(null);
  const typingIdleRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const clearRefineDebounce = useCallback(() => {
    if (refineDebounceRef.current !== null) {
      window.clearTimeout(refineDebounceRef.current);
      refineDebounceRef.current = null;
    }
  }, []);

  const clearTypingIdleTimer = useCallback(() => {
    if (typingIdleRef.current !== null) {
      window.clearTimeout(typingIdleRef.current);
      typingIdleRef.current = null;
    }
  }, []);

  const setTypingState = useCallback(
    (isTyping: boolean) => {
      onTypingStateChange?.(isTyping);
    },
    [onTypingStateChange],
  );

  const selectedBrand = useMemo(
    () => brandItems.find((item) => item.isRefined)?.label ?? null,
    [brandItems],
  );
  const selectedModel = useMemo(
    () => modelItems.find((item) => item.isRefined)?.label ?? null,
    [modelItems],
  );

  const clearAllRefinements = useCallback(() => {
    if (selectedModel) {
      refineModel(selectedModel);
    }
    if (selectedBrand) {
      refineBrand(selectedBrand);
    }
  }, [refineBrand, refineModel, selectedBrand, selectedModel]);

  const scheduleTypingIdleReset = useCallback(() => {
    clearTypingIdleTimer();
    typingIdleRef.current = window.setTimeout(() => {
      setTypingState(false);
      typingIdleRef.current = null;
    }, SEARCH_RESULTS_CONFIG.typingIdleMs);
  }, [clearTypingIdleTimer, setTypingState]);

  const scheduleQueryRefine = useCallback(
    (nextQuery: string) => {
      clearRefineDebounce();
      refineDebounceRef.current = window.setTimeout(() => {
        refineQuery(nextQuery);
        refineDebounceRef.current = null;
      }, SEARCH_RESULTS_CONFIG.refineDebounceMs);
    },
    [clearRefineDebounce, refineQuery],
  );

  const recordSearchInteraction = useCallback(() => {
    try {
      const nextCount = getSearchInteractionCount() + 1;
      window.localStorage.setItem(
        SEARCH_RESULTS_CONFIG.interactionStorageKey,
        String(nextCount),
      );

      if (nextCount >= SEARCH_RESULTS_CONFIG.frequentSearchThreshold) {
        dispatch({ type: "disableSuggestionAnimation" });
      }
    } catch {
      // Suggestion animation is progressive enhancement only.
    }
  }, []);

  const setSearchInputElement = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (autoFocus && node) {
      node.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      clearRefineDebounce();
      clearTypingIdleTimer();
    };
  }, [clearRefineDebounce, clearTypingIdleTimer]);

  useEffect(() => {
    const normalizedQuery = normalizeSearchInput(query);
    if (normalizedQuery === state.inputValue) {
      return;
    }

    // Keep browser back/forward state aligned with the visible input.
    dispatch({ type: "applyExternalQuery", value: normalizedQuery });
  }, [query, state.inputValue]);

  const liveBrandPool = useMemo(
    () => uniqueCaseInsensitive([...brandNames, ...brandItems.map((item) => item.label)]),
    [brandItems, brandNames],
  );

  const fallbackSuggestions = useMemo(() => {
    const trimmedValue = state.inputValue.trim();
    if (trimmedValue.length < SEARCH_RESULTS_CONFIG.minSuggestionLength) {
      return [];
    }

    const typedBrand = findTypedBrand(trimmedValue, liveBrandPool);
    const selectedBrandMatchesInput =
      selectedBrand &&
      (normalizeForMatch(trimmedValue) === normalizeForMatch(selectedBrand) ||
        normalizeForMatch(trimmedValue).startsWith(`${normalizeForMatch(selectedBrand)} `));
    const activeBrand = selectedBrandMatchesInput ? selectedBrand : typedBrand;
    const normalizedNeedle = normalizeForMatch(trimmedValue);
    const modelNeedle = normalizeForMatch(getScopedModelQuery(trimmedValue, activeBrand));
    const brandItemCountByLabel = new Map(
      brandItems.map((item) => [normalizeForMatch(item.label), item.count]),
    );
    const modelItemCountByLabel = new Map(
      modelItems.map((item) => [normalizeForMatch(item.label), item.count]),
    );

    const brandSuggestions: SearchSuggestion[] = [];
    if (!activeBrand) {
      for (const brand of liveBrandPool) {
        const normalizedBrand = normalizeForMatch(brand);
        if (!containsNormalizedValue(normalizedBrand, normalizedNeedle)) {
          continue;
        }
        brandSuggestions.push({
          type: "brand",
          label: brand,
          value: brand,
          count: brandItemCountByLabel.get(normalizedBrand),
        });
        if (brandSuggestions.length >= SEARCH_RESULTS_CONFIG.brandModelSuggestionLimit) {
          break;
        }
      }
    }

    const modelEntryKeys: string[] = [];
    if (activeBrand) {
      for (const item of modelItems) {
        if (item.label.length > 0) {
          modelEntryKeys.push(`${activeBrand}:::${item.label}`);
        }
      }
      for (const model of modelsByBrandName[activeBrand] ?? []) {
        modelEntryKeys.push(`${activeBrand}:::${model}`);
      }
    } else {
      for (const [brand, models] of Object.entries(modelsByBrandName)) {
        for (const model of models) {
          modelEntryKeys.push(`${brand}:::${model}`);
        }
      }
    }

    const filteredModelEntries: Array<{ brand: string; model: string }> = [];
    for (const entry of uniqueCaseInsensitive(modelEntryKeys)) {
      const [brand, model] = entry.split(":::");
      if (!modelNeedle || containsNormalizedMatch(model, modelNeedle)) {
        filteredModelEntries.push({ brand, model });
      }
    }

    const modelSuggestions = filteredModelEntries
      .slice(0, SEARCH_RESULTS_CONFIG.brandModelSuggestionLimit)
      .map(({ brand, model }) => {
        return {
          type: "model" as const,
          label: activeBrand ? model : `${brand} ${model}`,
          value: `${brand} ${model}`,
          facetValue: model,
          brandValue: brand,
          count: modelItemCountByLabel.get(normalizeForMatch(model)),
        };
      });

    return dedupeSuggestions([...brandSuggestions, ...modelSuggestions]);
  }, [brandItems, liveBrandPool, modelItems, modelsByBrandName, selectedBrand, state.inputValue]);

  const suggestions = useMemo(() => {
    if (state.inputValue.trim().length < SEARCH_RESULTS_CONFIG.minSuggestionLength) {
      return [];
    }

    return remoteSuggestions.length > 0 ? remoteSuggestions : fallbackSuggestions;
  }, [fallbackSuggestions, remoteSuggestions, state.inputValue]);

  useEffect(() => {
    const trimmedValue = state.inputValue.trim();
    if (trimmedValue.length < SEARCH_RESULTS_CONFIG.minSuggestionLength) {
      requestIdRef.current += 1;
      return;
    }

    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    const timeoutId = window.setTimeout(async () => {
      if (requestIdRef.current !== nextRequestId) {
        return;
      }

      const nextSuggestions = await fetchRemoteSuggestions(
        trimmedValue,
        selectedBrand,
        liveBrandPool,
      );

      // Ignore stale responses so older keystrokes never overwrite newer state.
      if (requestIdRef.current === nextRequestId) {
        setRemoteSuggestions(nextSuggestions);
      }
    }, SEARCH_RESULTS_CONFIG.remoteSuggestionDebounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [liveBrandPool, selectedBrand, state.inputValue]);

  useEffect(() => {
    if (!state.showSuggestions || state.highlightedIndex < 0) {
      return;
    }

    const target = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-suggestion-index="${state.highlightedIndex}"]`,
    );
    target?.scrollIntoView({ block: "nearest" });
  }, [state.highlightedIndex, state.showSuggestions]);

  const clearSearchInput = useCallback(() => {
    clearRefineDebounce();
    clearTypingIdleTimer();
    setTypingState(false);
    clearAllRefinements();
    refineQuery("");
    dispatch({ type: "clearInput" });
    inputRef.current?.focus();
  }, [
    clearAllRefinements,
    clearRefineDebounce,
    clearTypingIdleTimer,
    refineQuery,
    setTypingState,
  ]);

  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      recordSearchInteraction();
      clearRefineDebounce();
      clearTypingIdleTimer();
      setTypingState(false);

      if (suggestion.type === "brand") {
        if (selectedModel) {
          refineModel(selectedModel);
        }
        if (
          selectedBrand &&
          normalizeForMatch(selectedBrand) !== normalizeForMatch(suggestion.value)
        ) {
          refineBrand(selectedBrand);
        }
        if (
          !selectedBrand ||
          normalizeForMatch(selectedBrand) !== normalizeForMatch(suggestion.value)
        ) {
          refineBrand(suggestion.value);
        }

        refineQuery(suggestion.value);
        dispatch({
          type: "applySuggestion",
          value: `${suggestion.value} `,
          keepSuggestionsOpen: true,
        });
        inputRef.current?.focus();
        return;
      }

      const nextModel = suggestion.facetValue ?? suggestion.value;
      const nextBrand = suggestion.brandValue ?? selectedBrand;

      if (
        nextBrand &&
        selectedBrand &&
        normalizeForMatch(selectedBrand) !== normalizeForMatch(nextBrand)
      ) {
        refineBrand(selectedBrand);
      }
      if (
        nextBrand &&
        (!selectedBrand || normalizeForMatch(selectedBrand) !== normalizeForMatch(nextBrand))
      ) {
        refineBrand(nextBrand);
      }
      if (
        selectedModel &&
        normalizeForMatch(selectedModel) !== normalizeForMatch(nextModel)
      ) {
        refineModel(selectedModel);
      }
      if (
        !selectedModel ||
        normalizeForMatch(selectedModel) !== normalizeForMatch(nextModel)
      ) {
        refineModel(nextModel);
      }

      refineQuery(suggestion.value);
      dispatch({
        type: "applySuggestion",
        value: suggestion.value,
        keepSuggestionsOpen: false,
      });
      inputRef.current?.focus();
    },
    [
      clearRefineDebounce,
      clearTypingIdleTimer,
      recordSearchInteraction,
      refineBrand,
      refineModel,
      refineQuery,
      selectedBrand,
      selectedModel,
      setTypingState,
    ],
  );

  const handleTextInput = useCallback(
    (nextValue: string) => {
      const normalizedValue = normalizeSearchInput(nextValue);
      dispatch({ type: "applyInput", value: normalizedValue });

      const trimmedValue = normalizedValue.trim();
      const normalizedTrimmed = normalizeForMatch(trimmedValue);
      clearRefineDebounce();

      // Drop stale brand/model facets before refining free text into a different brand scope.
      if (
        selectedBrand &&
        trimmedValue &&
        normalizedTrimmed !== normalizeForMatch(selectedBrand) &&
        !normalizedTrimmed.startsWith(`${normalizeForMatch(selectedBrand)} `)
      ) {
        if (selectedModel) {
          refineModel(selectedModel);
        }
        refineBrand(selectedBrand);
      }

      if (!trimmedValue) {
        clearTypingIdleTimer();
        setTypingState(false);
        clearAllRefinements();
        refineQuery("");
        return;
      }

      setTypingState(true);
      scheduleTypingIdleReset();
      scheduleQueryRefine(trimmedValue);
    },
    [
      clearAllRefinements,
      clearRefineDebounce,
      clearTypingIdleTimer,
      refineBrand,
      refineModel,
      refineQuery,
      scheduleQueryRefine,
      scheduleTypingIdleReset,
      selectedBrand,
      selectedModel,
      setTypingState,
    ],
  );

  const updateSearchText = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleTextInput(event.target.value);
    },
    [handleTextInput],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      const pastedText = event.clipboardData.getData("text");
      if (!pastedText) {
        return;
      }

      event.preventDefault();
      handleTextInput(pastedText);
    },
    [handleTextInput],
  );

  const openSuggestionsForFocusedInput = useCallback(() => {
    if (
      state.inputValue.trim().length >= SEARCH_RESULTS_CONFIG.minSuggestionLength &&
      suggestions.length > 0
    ) {
      dispatch({ type: "openSuggestions" });
    }
  }, [state.inputValue, suggestions.length]);

  const closeSuggestionsAfterInputBlur = useCallback(() => {
    clearRefineDebounce();
    clearTypingIdleTimer();
    setTypingState(false);
    dispatch({ type: "closeSuggestions" });
  }, [clearRefineDebounce, clearTypingIdleTimer, setTypingState]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (state.isComposing || event.nativeEvent.isComposing) {
        return;
      }

      if (event.key === "Enter") {
        const trimmedValue = state.inputValue.trim();

        if (
          state.showSuggestions &&
          state.highlightedIndex >= 0 &&
          suggestions.length > 0
        ) {
          event.preventDefault();
          handleSuggestionClick(suggestions[state.highlightedIndex]);
          return;
        }

        if (trimmedValue.length >= SEARCH_RESULTS_CONFIG.minSuggestionLength) {
          event.preventDefault();
          recordSearchInteraction();
          clearRefineDebounce();
          clearTypingIdleTimer();
          setTypingState(false);
          trackAnalyticsEvent("search_query_submitted", {
            query: trimmedValue,
            filtersCount: [Boolean(selectedBrand), Boolean(selectedModel)].filter(Boolean)
              .length,
            resultCount: typeof nbHits === "number" ? nbHits : undefined,
            locale,
          });
          refineQuery(trimmedValue);
          dispatch({ type: "closeSuggestions" });
        }

        return;
      }

      if (!state.showSuggestions || suggestions.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        dispatch({
          type: "setHighlightedIndex",
          value:
            state.highlightedIndex < suggestions.length - 1
              ? state.highlightedIndex + 1
              : state.highlightedIndex,
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        dispatch({
          type: "setHighlightedIndex",
          value: state.highlightedIndex > 0 ? state.highlightedIndex - 1 : -1,
        });
        return;
      }

      if (event.key === "Escape") {
        dispatch({ type: "closeSuggestions" });
      }
    },
    [
      clearRefineDebounce,
      clearTypingIdleTimer,
      handleSuggestionClick,
      locale,
      nbHits,
      recordSearchInteraction,
      refineQuery,
      selectedBrand,
      selectedModel,
      setTypingState,
      state.highlightedIndex,
      state.inputValue,
      state.isComposing,
      state.showSuggestions,
      suggestions,
    ],
  );

  return {
    containerRef,
    inputRef: setSearchInputElement,
    state,
    suggestions,
    t,
    clearSearchInput,
    closeSuggestionsAfterInputBlur,
    openSuggestionsForFocusedInput,
    updateSearchText,
    handleKeyDown,
    handlePaste,
    handleSuggestionClick,
    setComposing: (value: boolean) => dispatch({ type: "setComposing", value }),
    setHighlightedIndex: (value: number) =>
      dispatch({ type: "setHighlightedIndex", value }),
  };
}

export function SearchResultsSearchBox({
  autoFocus = false,
  onTypingStateChange,
}: SearchResultsSearchBoxProps) {
  const tCommon = useTranslations("common");
  const {
    containerRef,
    inputRef,
    state,
    suggestions,
    t,
    clearSearchInput,
    closeSuggestionsAfterInputBlur,
    openSuggestionsForFocusedInput,
    updateSearchText,
    handleKeyDown,
    handlePaste,
    handleSuggestionClick,
    setComposing,
    setHighlightedIndex,
  } = useSearchResultsController(autoFocus, onTypingStateChange);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          "flex min-h-[3.5rem] items-center gap-3 rounded-[1.45rem] border px-3.5 py-2.5 sm:min-h-[3.9rem] sm:px-4 sm:py-3",
          "border-border-subtle bg-background shadow-sm shadow-black/5",
          "transition-all duration-200",
          "focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/12 focus-within:shadow-md",
        )}
      >
        <SearchIcon className="size-5 shrink-0 text-text-secondary" />
        <input
          ref={inputRef}
          id="search-results-query"
          name="q"
          type="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={state.inputValue}
          onBlur={closeSuggestionsAfterInputBlur}
          onChange={updateSearchText}
          onCompositionEnd={() => setComposing(false)}
          onCompositionStart={() => setComposing(true)}
          onFocus={openSuggestionsForFocusedInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          enterKeyHint="search"
          aria-label={t("placeholder")}
          placeholder={t("placeholder")}
          className={cn(
            "min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[15px] font-semibold leading-tight text-text-primary outline-none sm:text-base",
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
            "placeholder:text-text-muted/80 focus:outline-none focus:ring-0",
          )}
        />
        {state.inputValue && (
          <Button
            type="button"
            onClick={clearSearchInput}
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0 rounded-full text-text-tertiary hover:text-text-primary sm:size-9"
            aria-label={tCommon("search")}
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>

      {state.showSuggestions && suggestions.length > 0 && (
        <SuggestionDropdown
          suggestions={suggestions}
          highlightedIndex={state.highlightedIndex}
          shouldAnimate={state.shouldAnimateSuggestions}
          onSuggestionClick={handleSuggestionClick}
          onSuggestionHover={setHighlightedIndex}
        />
      )}
    </div>
  );
}
