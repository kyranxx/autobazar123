"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { useRefinementList, useSearchBox } from "react-instantsearch";
import { useTranslations } from "next-intl";
import { getSearchClient, CARS_INDEX } from "@/lib/algolia";
import { cn } from "@/utils/cn";
import { SearchIcon, XIcon, CarIcon, TagIcon } from "@/components/ui/Icons";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";

const MIN_SUGGESTION_LENGTH = 3;
const SUGGESTION_DEBOUNCE_MS = 500;
const BRAND_MODEL_SUGGEST_LIMIT = 4;
const QUERY_SUGGEST_LIMIT = 3;
const FREQUENT_SEARCH_THRESHOLD = 6;
const SEARCH_INTERACTION_KEY = "ab123_search_interactions";

interface FacetSuggestion {
  value: string;
  count: number;
}

interface SearchResultsSearchBoxProps {
  autoFocus?: boolean;
}

interface QuerySuggestion {
  query: string;
  count?: number;
}

type SuggestionType = "brand" | "model" | "query";

interface SuggestionItem {
  type: SuggestionType;
  value: string;
  count?: number;
}

interface SearchBoxState {
  inputValue: string;
  showSuggestions: boolean;
  highlightedIndex: number;
  isComposing: boolean;
  disableSuggestionAnimation: boolean;
  querySuggestions: QuerySuggestion[];
  brandAutosuggests: FacetSuggestion[];
  modelAutosuggests: FacetSuggestion[];
}

type SearchBoxAction =
  | { type: "inputChanged"; value: string }
  | { type: "setComposing"; value: boolean }
  | { type: "disableSuggestionAnimation" }
  | {
      type: "setFetchedSuggestions";
      querySuggestions: QuerySuggestion[];
      brandAutosuggests: FacetSuggestion[];
      modelAutosuggests: FacetSuggestion[];
    }
  | { type: "setHighlightedIndex"; value: number }
  | { type: "closeSuggestions" }
  | { type: "openSuggestions" }
  | { type: "applySuggestionSelection"; value: string }
  | { type: "clearInput" };

function normalizeInputValue(value: string): string {
  return value.replace(/\u3000/g, " ").replace(/\s+/g, " ").trimStart();
}

function createInitialSearchBoxState(query: string): SearchBoxState {
  const disableSuggestionAnimation =
    typeof window !== "undefined" &&
    Number(window.localStorage.getItem(SEARCH_INTERACTION_KEY) || "0") >=
      FREQUENT_SEARCH_THRESHOLD;

  return {
    inputValue: query,
    showSuggestions: false,
    highlightedIndex: -1,
    isComposing: false,
    disableSuggestionAnimation,
    querySuggestions: [],
    brandAutosuggests: [],
    modelAutosuggests: [],
  };
}

function searchBoxReducer(
  state: SearchBoxState,
  action: SearchBoxAction,
): SearchBoxState {
  switch (action.type) {
    case "inputChanged": {
      const trimmedValueLength = action.value.trim().length;
      const shouldShowSuggestions = trimmedValueLength >= MIN_SUGGESTION_LENGTH;

      return {
        ...state,
        inputValue: action.value,
        showSuggestions: shouldShowSuggestions,
        highlightedIndex: -1,
        querySuggestions: shouldShowSuggestions ? state.querySuggestions : [],
        brandAutosuggests: shouldShowSuggestions ? state.brandAutosuggests : [],
        modelAutosuggests: shouldShowSuggestions ? state.modelAutosuggests : [],
      };
    }
    case "setComposing":
      return {
        ...state,
        isComposing: action.value,
      };
    case "disableSuggestionAnimation":
      return {
        ...state,
        disableSuggestionAnimation: true,
      };
    case "setFetchedSuggestions":
      return {
        ...state,
        querySuggestions: action.querySuggestions,
        brandAutosuggests: action.brandAutosuggests,
        modelAutosuggests: action.modelAutosuggests,
      };
    case "setHighlightedIndex":
      return {
        ...state,
        highlightedIndex: action.value,
      };
    case "closeSuggestions":
      return {
        ...state,
        showSuggestions: false,
        highlightedIndex: -1,
      };
    case "openSuggestions":
      return {
        ...state,
        showSuggestions: true,
      };
    case "applySuggestionSelection":
      return {
        ...state,
        inputValue: action.value,
        showSuggestions: false,
        highlightedIndex: -1,
      };
    case "clearInput":
      return {
        ...state,
        inputValue: "",
        showSuggestions: false,
        highlightedIndex: -1,
        querySuggestions: [],
        brandAutosuggests: [],
        modelAutosuggests: [],
      };
    default:
      return state;
  }
}

function SuggestionDropdown({
  suggestions,
  highlightedIndex,
  disableSuggestionAnimation,
  onSuggestionClick,
  onSuggestionHover,
}: {
  suggestions: SuggestionItem[];
  highlightedIndex: number;
  disableSuggestionAnimation: boolean;
  onSuggestionClick: (suggestion: SuggestionItem) => void;
  onSuggestionHover: (index: number) => void;
}) {
  return (
    <div
      className={cn(
        "absolute top-full left-0 right-0 mt-2 z-[100]",
        "bg-background-secondary rounded-xl border border-border-subtle",
        "shadow-lg overflow-hidden",
        !disableSuggestionAnimation &&
          "animate-in fade-in slide-in-from-top-2 duration-200",
      )}
    >
      <ul className="fade-edge-y max-h-80 overflow-y-auto py-2 scrollbar-thin overscroll-y-contain">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.type}-${suggestion.value}`}>
            <button
              data-suggestion-index={index}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => onSuggestionClick(suggestion)}
              onMouseEnter={() => onSuggestionHover(index)}
              className={cn(
                "flex min-h-11 items-center justify-between w-full px-4 py-2.5",
                "text-left transition-colors",
                highlightedIndex === index
                  ? "bg-accent/10"
                  : "hover:bg-background-tertiary",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    suggestion.type === "brand" && "bg-accent/10 text-accent",
                    suggestion.type === "model" && "bg-success/10 text-success",
                    suggestion.type === "query" &&
                      "bg-background-tertiary text-text-muted",
                  )}
                >
                  {suggestion.type === "query" ? (
                    <SearchIcon className="w-4 h-4" />
                  ) : suggestion.type === "brand" ? (
                    <CarIcon className="w-4 h-4" />
                  ) : (
                    <TagIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-text-primary block truncate">
                    {suggestion.value}
                  </span>
                  <span className="text-xs text-text-muted">
                    {suggestion.type === "query"
                      ? "Search"
                      : suggestion.type === "brand"
                        ? "Brand"
                        : "Model"}
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

function useSearchResultsSearchBox(autoFocus: boolean) {
  const { query, refine: refineQuery } = useSearchBox();
  const [state, dispatch] = useReducer(
    searchBoxReducer,
    query,
    createInitialSearchBoxState,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = useTranslations("search");
  const { refine: refineBrand } = useRefinementList({
    attribute: "brand",
  });
  const { refine: refineModel } = useRefinementList({
    attribute: "model",
  });

  const refineDebounceRef = useRef<number | null>(null);
  const suggestDebounceRef = useRef<number | null>(null);

  const clearRefineDebounce = () => {
    if (refineDebounceRef.current !== null) {
      window.clearTimeout(refineDebounceRef.current);
      refineDebounceRef.current = null;
    }
  };

  const clearSuggestDebounce = () => {
    if (suggestDebounceRef.current !== null) {
      window.clearTimeout(suggestDebounceRef.current);
      suggestDebounceRef.current = null;
    }
  };

  const trackSearchInteraction = () => {
    const nextCount =
      Number(window.localStorage.getItem(SEARCH_INTERACTION_KEY) || "0") + 1;
    window.localStorage.setItem(SEARCH_INTERACTION_KEY, String(nextCount));
    if (nextCount >= FREQUENT_SEARCH_THRESHOLD) {
      dispatch({ type: "disableSuggestionAnimation" });
    }
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      clearRefineDebounce();
      clearSuggestDebounce();
    };
  }, []);

  useEffect(() => {
    const trimmedValue = state.inputValue.trim();

    if (trimmedValue.length < MIN_SUGGESTION_LENGTH) {
      clearSuggestDebounce();
      dispatch({
        type: "setFetchedSuggestions",
        querySuggestions: [],
        brandAutosuggests: [],
        modelAutosuggests: [],
      });
      return;
    }

    clearSuggestDebounce();
    let cancelled = false;

    suggestDebounceRef.current = window.setTimeout(() => {
      const fetchSuggestions = async () => {
        const client = getSearchClient();
        if (!client) return;

        try {
          const [queryResponse, brandResponse, modelResponse] =
            await Promise.all([
              client.searchForHits({
                requests: [
                  {
                    indexName: "ads_query_suggestions",
                    query: trimmedValue,
                    hitsPerPage: 5,
                  },
                ],
              }),
              client.searchForFacetValues({
                indexName: CARS_INDEX,
                facetName: "brand",
                searchForFacetValuesRequest: {
                  facetQuery: trimmedValue,
                  maxFacetHits: BRAND_MODEL_SUGGEST_LIMIT,
                },
              }),
              client.searchForFacetValues({
                indexName: CARS_INDEX,
                facetName: "model",
                searchForFacetValuesRequest: {
                  facetQuery: trimmedValue,
                  maxFacetHits: BRAND_MODEL_SUGGEST_LIMIT,
                },
              }),
            ]);

          const queryHits = (
            ((queryResponse.results[0] as { hits?: { query?: string }[] })?.hits ||
              []) as { query?: string }[]
          )
            .map((hit) => ({ query: (hit.query || "").trim() }))
            .filter((hit) => hit.query.length > 0);

          if (cancelled) return;

          dispatch({
            type: "setFetchedSuggestions",
            querySuggestions: queryHits,
            brandAutosuggests: ((brandResponse.facetHits || []) as {
              value: string;
              count: number;
            }[])
              .slice(0, BRAND_MODEL_SUGGEST_LIMIT)
              .map(({ value, count }) => ({ value, count })),
            modelAutosuggests: ((modelResponse.facetHits || []) as {
              value: string;
              count: number;
            }[])
              .slice(0, BRAND_MODEL_SUGGEST_LIMIT)
              .map(({ value, count }) => ({ value, count })),
          });
        } catch {
          if (cancelled) return;
          dispatch({
            type: "setFetchedSuggestions",
            querySuggestions: [],
            brandAutosuggests: [],
            modelAutosuggests: [],
          });
        }
      };

      fetchSuggestions();
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearSuggestDebounce();
    };
  }, [state.inputValue]);

  const suggestions = useMemo(() => {
    if (state.inputValue.trim().length < MIN_SUGGESTION_LENGTH) return [];

    const brandSuggs = state.brandAutosuggests.map((item) => ({
      type: "brand" as const,
      value: item.value,
      count: item.count,
    }));

    const modelSuggs = state.modelAutosuggests.map((item) => ({
      type: "model" as const,
      value: item.value,
      count: item.count,
    }));

    const querySuggs = state.querySuggestions
      .filter(
        (s) =>
          !brandSuggs.some((b) => b.value.toLowerCase() === s.query.toLowerCase()) &&
          !modelSuggs.some((m) => m.value.toLowerCase() === s.query.toLowerCase()),
      )
      .slice(0, QUERY_SUGGEST_LIMIT)
      .map((s) => ({
        type: "query" as const,
        value: s.query,
        count: undefined,
      }));

    return [...brandSuggs, ...modelSuggs, ...querySuggs];
  }, [
    state.inputValue,
    state.brandAutosuggests,
    state.modelAutosuggests,
    state.querySuggestions,
  ]);

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    trackSearchInteraction();
    clearRefineDebounce();

    if (suggestion.type === "brand") {
      refineBrand(suggestion.value);
    } else if (suggestion.type === "model") {
      refineModel(suggestion.value);
    }

    refineQuery(suggestion.value);
    dispatch({ type: "applySuggestionSelection", value: suggestion.value });
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeInputValue(e.target.value);
    dispatch({ type: "inputChanged", value });

    const trimmed = value.trim();
    clearRefineDebounce();

    if (!trimmed) {
      refineQuery("");
      return;
    }

    if (trimmed.length < MIN_SUGGESTION_LENGTH) {
      refineQuery("");
      return;
    }

    refineDebounceRef.current = window.setTimeout(() => {
      refineQuery(trimmed);
      refineDebounceRef.current = null;
    }, SUGGESTION_DEBOUNCE_MS);
  };

  useEffect(() => {
    if (!state.showSuggestions || state.highlightedIndex < 0) return;

    const target = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-suggestion-index="${state.highlightedIndex}"]`,
    );
    target?.scrollIntoView({ block: "nearest" });
  }, [state.highlightedIndex, state.showSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (state.isComposing || e.nativeEvent.isComposing) return;

    if (e.key === "Enter") {
      const trimmed = state.inputValue.trim();

      if (
        state.showSuggestions &&
        state.highlightedIndex >= 0 &&
        suggestions.length > 0
      ) {
        e.preventDefault();
        handleSuggestionClick(suggestions[state.highlightedIndex]);
        return;
      }

      if (trimmed.length >= MIN_SUGGESTION_LENGTH) {
        e.preventDefault();
        trackSearchInteraction();
        clearRefineDebounce();
        refineQuery(trimmed);
        dispatch({ type: "closeSuggestions" });
      }
      return;
    }

    if (!state.showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      dispatch({
        type: "setHighlightedIndex",
        value:
          state.highlightedIndex < suggestions.length - 1
            ? state.highlightedIndex + 1
            : state.highlightedIndex,
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      dispatch({
        type: "setHighlightedIndex",
        value: state.highlightedIndex > 0 ? state.highlightedIndex - 1 : -1,
      });
    } else if (e.key === "Escape") {
      dispatch({ type: "closeSuggestions" });
    }
  };

  const clearInput = () => {
    clearRefineDebounce();
    refineQuery("");
    dispatch({ type: "clearInput" });
    inputRef.current?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text");
    if (!pastedText) return;

    event.preventDefault();
    const normalized = normalizeInputValue(pastedText);
    dispatch({ type: "inputChanged", value: normalized });

    clearRefineDebounce();
    if (normalized.trim().length >= MIN_SUGGESTION_LENGTH) {
      refineDebounceRef.current = window.setTimeout(() => {
        refineQuery(normalized.trim());
        refineDebounceRef.current = null;
      }, SUGGESTION_DEBOUNCE_MS);
    } else {
      refineQuery("");
    }
  };

  const handleFocus = () => {
    if (
      state.inputValue.trim().length >= MIN_SUGGESTION_LENGTH &&
      suggestions.length > 0
    ) {
      dispatch({ type: "openSuggestions" });
    }
  };

  const handleBlur = () => {
    clearRefineDebounce();
    clearSuggestDebounce();
    dispatch({ type: "closeSuggestions" });
  };

  return {
    state,
    t,
    suggestions,
    containerRef,
    inputRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleFocus,
    handleBlur,
    clearInput,
    setComposing: (value: boolean) => dispatch({ type: "setComposing", value }),
    setHighlightedIndex: (value: number) =>
      dispatch({ type: "setHighlightedIndex", value }),
    handleSuggestionClick,
  };
}

export function SearchResultsSearchBox({
  autoFocus = false,
}: SearchResultsSearchBoxProps) {
  const {
    state,
    t,
    suggestions,
    containerRef,
    inputRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleFocus,
    handleBlur,
    clearInput,
    setComposing,
    setHighlightedIndex,
    handleSuggestionClick,
  } = useSearchResultsSearchBox(autoFocus);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3.5",
          "bg-background-secondary border border-border-subtle rounded-xl",
          "shadow-sm transition-all duration-200",
          "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 focus-within:shadow-md",
        )}
      >
        <SearchIcon className="w-5 h-5 text-text-muted shrink-0" />
        <Input
          ref={inputRef}
          type="search"
          value={state.inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          enterKeyHint="search"
          placeholder={t("placeholder") || "Search by brand or model"}
          className={cn(
            "h-auto border-none bg-transparent p-0 text-base text-text-primary shadow-none",
            "placeholder:text-text-muted focus-visible:ring-0",
          )}
        />
        {state.inputValue && (
          <Button
            type="button"
            onClick={clearInput}
            variant="ghost"
            size="icon-sm"
            className="h-11 w-11 rounded-full text-text-tertiary hover:text-text-primary"
            aria-label="Clear search"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>

      {state.showSuggestions && suggestions.length > 0 && (
        <SuggestionDropdown
          suggestions={suggestions}
          highlightedIndex={state.highlightedIndex}
          disableSuggestionAnimation={state.disableSuggestionAnimation}
          onSuggestionClick={handleSuggestionClick}
          onSuggestionHover={setHighlightedIndex}
        />
      )}
    </div>
  );
}
