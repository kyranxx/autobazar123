"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { useRefinementList, useSearchBox } from "react-instantsearch";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { SearchIcon, XIcon, CarIcon, TagIcon } from "@/components/ui/Icons";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { HOME_BRANDS, HOME_MODELS } from "@/components/home/theme";

const MIN_SUGGESTION_LENGTH = 2;
const RESULTS_DEBOUNCE_MS = 90;
const FULL_QUALITY_IDLE_MS = 160;
const BRAND_MODEL_SUGGEST_LIMIT = 5;
const FREQUENT_SEARCH_THRESHOLD = 6;
const SEARCH_INTERACTION_KEY = "ab123_search_interactions";

interface SearchResultsSearchBoxProps {
  autoFocus?: boolean;
  onTypingStateChange?: (isTyping: boolean) => void;
}

type SuggestionType = "brand" | "model";

interface SuggestionItem {
  type: SuggestionType;
  label: string;
  value: string;
  facetValue?: string;
  brandValue?: string;
  count?: number;
}

interface SearchBoxState {
  inputValue: string;
  showSuggestions: boolean;
  highlightedIndex: number;
  isComposing: boolean;
  disableSuggestionAnimation: boolean;
}

type SearchBoxAction =
  | { type: "inputChanged"; value: string }
  | { type: "setComposing"; value: boolean }
  | { type: "disableSuggestionAnimation" }
  | { type: "setHighlightedIndex"; value: number }
  | { type: "closeSuggestions" }
  | { type: "openSuggestions" }
  | { type: "applyBrandSelection"; value: string }
  | { type: "applySuggestionSelection"; value: string }
  | { type: "clearInput" };

function normalizeInputValue(value: string): string {
  return value
    .replace(/\u3000/g, " ")
    .replace(/[;,|/]+/g, " ")
    .replace(/\s+/g, " ")
    .trimStart();
}

function getBrandScopedModelQuery(inputValue: string, selectedBrand: string | null): string {
  const trimmedValue = inputValue.trim();
  if (!selectedBrand) {
    return trimmedValue;
  }

  const normalizedInput = trimmedValue.toLowerCase();
  const normalizedBrand = selectedBrand.toLowerCase();

  if (normalizedInput === normalizedBrand) {
    return "";
  }

  if (normalizedInput.startsWith(`${normalizedBrand} `)) {
    return trimmedValue.slice(selectedBrand.length).trim();
  }

  return trimmedValue;
}

function uniqueCaseInsensitive(values: string[]): string[] {
  return values.filter(
    (value, index) =>
      values.findIndex(
        (candidate) => candidate.toLowerCase() === value.toLowerCase(),
      ) === index,
  );
}

function findBrandFromInput(
  inputValue: string,
  brandPool: string[],
): string | null {
  const normalizedInput = inputValue.trim().toLowerCase();

  return (
    brandPool.find((candidate) => {
      const normalizedCandidate = candidate.toLowerCase();
      return (
        normalizedInput === normalizedCandidate ||
        normalizedInput.startsWith(`${normalizedCandidate} `)
      );
    }) ?? null
  );
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
    case "applyBrandSelection":
      return {
        ...state,
        inputValue: action.value,
        showSuggestions: true,
        highlightedIndex: -1,
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
                  )}
                >
                  {suggestion.type === "brand" ? (
                    <CarIcon className="w-4 h-4" />
                  ) : (
                    <TagIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-text-primary block truncate">
                    {suggestion.label}
                  </span>
                  <span className="text-xs text-text-muted">
                    {suggestion.type === "brand" ? "Znacka" : "Model"}
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

function useSearchResultsSearchBox(
  autoFocus: boolean,
  onTypingStateChange?: (isTyping: boolean) => void,
) {
  const { query, refine: refineQuery } = useSearchBox(
    {},
    { skipSuspense: true },
  );
  const [state, dispatch] = useReducer(
    searchBoxReducer,
    query,
    createInitialSearchBoxState,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = useTranslations("search");
  const { items: brandItems, refine: refineBrand } = useRefinementList(
    {
      attribute: "brand",
    },
    { skipSuspense: true },
  );
  const { items: modelItems, refine: refineModel } = useRefinementList({
    attribute: "model",
  }, { skipSuspense: true });

  const refineDebounceRef = useRef<number | null>(null);
  const qualityIdleRef = useRef<number | null>(null);

  const clearRefineDebounce = () => {
    if (refineDebounceRef.current !== null) {
      window.clearTimeout(refineDebounceRef.current);
      refineDebounceRef.current = null;
    }
  };

  const clearQualityIdleTimer = () => {
    if (qualityIdleRef.current !== null) {
      window.clearTimeout(qualityIdleRef.current);
      qualityIdleRef.current = null;
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
      clearQualityIdleTimer();
    };
  }, []);

  const liveBrandPool = useMemo(
    () =>
      uniqueCaseInsensitive([
        ...HOME_BRANDS,
        ...brandItems.map((item) => item.label),
      ]),
    [brandItems],
  );
  const selectedBrand = useMemo(
    () => brandItems.find((item) => item.isRefined)?.label ?? null,
    [brandItems],
  );
  const selectedModel = useMemo(
    () => modelItems.find((item) => item.isRefined)?.label ?? null,
    [modelItems],
  );

  const suggestions = useMemo(() => {
    const trimmedValue = state.inputValue.trim();
    if (trimmedValue.length < MIN_SUGGESTION_LENGTH) return [];

    const brandFromInput = findBrandFromInput(trimmedValue, liveBrandPool);
    const selectedBrandMatchesInput =
      selectedBrand &&
      (trimmedValue.toLowerCase() === selectedBrand.toLowerCase() ||
        trimmedValue.toLowerCase().startsWith(`${selectedBrand.toLowerCase()} `));
    const activeBrand = selectedBrandMatchesInput ? selectedBrand : brandFromInput;
    const normalizedNeedle = trimmedValue.toLowerCase();
    const brandSuggestions = activeBrand
      ? []
      : liveBrandPool
          .filter((brand) => brand.toLowerCase().includes(normalizedNeedle))
          .slice(0, BRAND_MODEL_SUGGEST_LIMIT)
          .map((brand) => ({
            type: "brand" as const,
            label: brand,
            value: brand,
            count: brandItems.find(
              (item) => item.label.toLowerCase() === brand.toLowerCase(),
            )?.count,
          }));
    const brandScopedNeedle = getBrandScopedModelQuery(trimmedValue, activeBrand);
    const modelNeedle = brandScopedNeedle.toLowerCase();
    const localModelEntries = activeBrand
      ? (HOME_MODELS[activeBrand] ?? []).map((model) => ({
          brand: activeBrand,
          model,
        }))
      : Object.entries(HOME_MODELS).flatMap(([brand, models]) =>
          models.map((model) => ({ brand, model })),
        );
    const liveModelEntries = activeBrand
      ? modelItems
          .map((item) => item.label)
          .filter((model) => model.length > 0)
          .map((model) => ({ brand: activeBrand, model }))
      : [];
    const modelSuggestions = uniqueCaseInsensitive(
      [...liveModelEntries, ...localModelEntries].map(
        (entry) => `${entry.brand}:::${entry.model}`,
      ),
    )
      .map((entry) => {
        const [brand, model] = entry.split(":::");
        return { brand, model };
      })
      .filter(({ model }) =>
        modelNeedle ? model.toLowerCase().includes(modelNeedle) : true,
      )
      .slice(0, BRAND_MODEL_SUGGEST_LIMIT)
      .map(({ brand, model }) => ({
        type: "model" as const,
        label: activeBrand ? model : `${brand} ${model}`,
        value: activeBrand ? `${brand} ${model}` : `${brand} ${model}`,
        facetValue: model,
        brandValue: brand,
        count: modelItems.find(
          (item) => item.label.toLowerCase() === model.toLowerCase(),
        )?.count,
      }));

    return [...brandSuggestions, ...modelSuggestions];
  }, [brandItems, liveBrandPool, modelItems, selectedBrand, state.inputValue]);

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    trackSearchInteraction();
    clearRefineDebounce();
    clearQualityIdleTimer();
    onTypingStateChange?.(false);

    if (suggestion.type === "brand") {
      if (selectedModel) {
        refineModel(selectedModel);
      }
      if (
        selectedBrand &&
        selectedBrand.toLowerCase() !== suggestion.value.toLowerCase()
      ) {
        refineBrand(selectedBrand);
      }
      if (
        !selectedBrand ||
        selectedBrand.toLowerCase() !== suggestion.value.toLowerCase()
      ) {
        refineBrand(suggestion.value);
      }

      refineQuery(suggestion.value);
      dispatch({ type: "applyBrandSelection", value: `${suggestion.value} ` });
      inputRef.current?.focus();
      return;
    }

    if (suggestion.type === "model") {
      const nextModel = suggestion.facetValue ?? suggestion.value;
      const nextBrand = suggestion.brandValue ?? selectedBrand;

      if (
        nextBrand &&
        selectedBrand &&
        selectedBrand.toLowerCase() !== nextBrand.toLowerCase()
      ) {
        refineBrand(selectedBrand);
      }
      if (
        nextBrand &&
        (!selectedBrand || selectedBrand.toLowerCase() !== nextBrand.toLowerCase())
      ) {
        refineBrand(nextBrand);
      }

      if (
        selectedModel &&
        selectedModel.toLowerCase() !== nextModel.toLowerCase()
      ) {
        refineModel(selectedModel);
      }
      if (
        !selectedModel ||
        selectedModel.toLowerCase() !== nextModel.toLowerCase()
      ) {
        refineModel(nextModel);
      }
    }

    refineQuery(suggestion.value);
    dispatch({ type: "applySuggestionSelection", value: suggestion.value });
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeInputValue(e.target.value);
    dispatch({ type: "inputChanged", value });

    const trimmed = value.trim();
    const normalizedTrimmed = trimmed.toLowerCase();
    clearRefineDebounce();

    if (
      selectedBrand &&
      trimmed &&
      normalizedTrimmed !== selectedBrand.toLowerCase() &&
      !normalizedTrimmed.startsWith(`${selectedBrand.toLowerCase()} `)
    ) {
      if (selectedModel) {
        refineModel(selectedModel);
      }
      refineBrand(selectedBrand);
    }

    if (!trimmed) {
      clearQualityIdleTimer();
      onTypingStateChange?.(false);
      if (selectedModel) {
        refineModel(selectedModel);
      }
      if (selectedBrand) {
        refineBrand(selectedBrand);
      }
      refineQuery("");
      return;
    }

    onTypingStateChange?.(true);
    clearQualityIdleTimer();
    qualityIdleRef.current = window.setTimeout(() => {
      onTypingStateChange?.(false);
      qualityIdleRef.current = null;
    }, FULL_QUALITY_IDLE_MS);

    refineDebounceRef.current = window.setTimeout(() => {
      refineQuery(trimmed);
      refineDebounceRef.current = null;
    }, RESULTS_DEBOUNCE_MS);
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
        clearQualityIdleTimer();
        onTypingStateChange?.(false);
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
    clearQualityIdleTimer();
    onTypingStateChange?.(false);
    if (selectedModel) {
      refineModel(selectedModel);
    }
    if (selectedBrand) {
      refineBrand(selectedBrand);
    }
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
    if (normalized.trim().length > 0) {
      onTypingStateChange?.(true);
      clearQualityIdleTimer();
      qualityIdleRef.current = window.setTimeout(() => {
        onTypingStateChange?.(false);
        qualityIdleRef.current = null;
      }, FULL_QUALITY_IDLE_MS);
      refineDebounceRef.current = window.setTimeout(() => {
        refineQuery(normalized.trim());
        refineDebounceRef.current = null;
      }, RESULTS_DEBOUNCE_MS);
    } else {
      clearQualityIdleTimer();
      onTypingStateChange?.(false);
      if (selectedModel) {
        refineModel(selectedModel);
      }
      if (selectedBrand) {
        refineBrand(selectedBrand);
      }
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
    clearQualityIdleTimer();
    onTypingStateChange?.(false);
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
  onTypingStateChange,
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
  } = useSearchResultsSearchBox(autoFocus, onTypingStateChange);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 px-5 py-4",
          "border-accent/35 bg-background shadow-xl shadow-accent/10",
          "transition-all duration-200",
          "focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 focus-within:shadow-2xl",
        )}
      >
        <SearchIcon className="h-6 w-6 shrink-0 text-accent" />
        <Input
          ref={inputRef}
          id="search-results-query"
          name="q"
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
          placeholder={t("placeholder") || "Znacka, model alebo mesto"}
          className={cn(
            "h-auto border-none bg-transparent p-0 text-lg font-medium text-text-primary shadow-none",
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
