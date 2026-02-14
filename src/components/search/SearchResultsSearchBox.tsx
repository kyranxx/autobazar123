"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useSearchBox, useRefinementList } from "react-instantsearch";
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

interface FacetSuggestion {
  value: string;
  count: number;
}

interface SearchResultsSearchBoxProps {
  autoFocus?: boolean;
}

export function SearchResultsSearchBox({
  autoFocus = false,
}: SearchResultsSearchBoxProps) {
  const { query, refine: refineQuery } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("search");

  const { refine: refineBrand } = useRefinementList({
    attribute: "brand",
  });
  const { refine: refineModel } = useRefinementList({
    attribute: "model",
  });

  const [querySuggestions, setQuerySuggestions] = useState<
    { query: string; count?: number }[]
  >([]);
  const [brandAutosuggests, setBrandAutosuggests] = useState<FacetSuggestion[]>(
    [],
  );
  const [modelAutosuggests, setModelAutosuggests] = useState<FacetSuggestion[]>(
    [],
  );

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const trimmedValue = inputValue.trim();

    if (trimmedValue.length < MIN_SUGGESTION_LENGTH) {
      return;
    }

    const timeout = setTimeout(() => {
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
            ((queryResponse.results[0] as {
              hits?: { query?: string }[];
            })?.hits || []) as { query?: string }[]
          )
            .map((hit) => ({ query: (hit.query || "").trim() }))
            .filter((hit) => hit.query.length > 0);

          setQuerySuggestions(queryHits);
          setBrandAutosuggests(
            ((brandResponse.facetHits || []) as {
              value: string;
              count: number;
            }[])
              .slice(0, BRAND_MODEL_SUGGEST_LIMIT)
              .map(({ value, count }) => ({ value, count })),
          );
          setModelAutosuggests(
            ((modelResponse.facetHits || []) as {
              value: string;
              count: number;
            }[])
              .slice(0, BRAND_MODEL_SUGGEST_LIMIT)
              .map(({ value, count }) => ({ value, count })),
          );
        } catch {
          setQuerySuggestions([]);
          setBrandAutosuggests([]);
          setModelAutosuggests([]);
        }
      };

      fetchSuggestions();
    }, SUGGESTION_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [inputValue]);

  const suggestions = useMemo(() => {
    if (inputValue.trim().length < MIN_SUGGESTION_LENGTH) return [];

    const brandSuggs = brandAutosuggests.map((item) => ({
      type: "brand" as const,
      value: item.value,
      count: item.count,
    }));

    const modelSuggs = modelAutosuggests.map((item) => ({
      type: "model" as const,
      value: item.value,
      count: item.count,
    }));

    const querySuggs = querySuggestions
      .filter(
        (s) =>
          !brandSuggs.some(
            (b) => b.value.toLowerCase() === s.query.toLowerCase(),
          ) &&
          !modelSuggs.some(
            (m) => m.value.toLowerCase() === s.query.toLowerCase(),
          ),
      )
      .slice(0, QUERY_SUGGEST_LIMIT)
      .map((s) => ({
        type: "query" as const,
        value: s.query,
        count: undefined,
      }));

    return [...brandSuggs, ...modelSuggs, ...querySuggs];
  }, [
    inputValue,
    brandAutosuggests,
    modelAutosuggests,
    querySuggestions,
  ]);

  const handleSuggestionClick = (suggestion: {
    type: "brand" | "model" | "query";
    value: string;
  }) => {
    if (suggestion.type === "brand") {
      refineBrand(suggestion.value);
    } else if (suggestion.type === "model") {
      refineModel(suggestion.value);
    }
    setInputValue(suggestion.value);
    refineQuery(suggestion.value);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    refineQuery(value);

    if (value.trim().length < MIN_SUGGESTION_LENGTH) {
      setQuerySuggestions([]);
      setBrandAutosuggests([]);
      setModelAutosuggests([]);
    }

    setShowSuggestions(value.trim().length >= MIN_SUGGESTION_LENGTH);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const clearInput = () => {
    setInputValue("");
    refineQuery("");
    setQuerySuggestions([]);
    setBrandAutosuggests([]);
    setModelAutosuggests([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

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
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            inputValue.trim().length >= MIN_SUGGESTION_LENGTH &&
            suggestions.length > 0 &&
            setShowSuggestions(true)
          }
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={t("placeholder") || "Hľadajte značku alebo model"}
          className={cn(
            "h-auto border-none bg-transparent p-0 text-base text-text-primary shadow-none",
            "placeholder:text-text-muted focus-visible:ring-0",
          )}
        />
        {inputValue && (
          <Button
            type="button"
            onClick={clearInput}
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 rounded-full text-text-tertiary hover:text-text-primary"
            aria-label="Clear search"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-2 z-[100]",
            "bg-background-secondary rounded-xl border border-border-subtle",
            "shadow-lg overflow-hidden",
            "animate-in fade-in slide-in-from-top-2 duration-200",
          )}
        >
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.type}-${suggestion.value}`}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-2.5",
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
                        suggestion.type === "brand" &&
                          "bg-accent/10 text-accent",
                        suggestion.type === "model" &&
                          "bg-success/10 text-success",
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
                          ? "Vyhľadávanie"
                          : suggestion.type === "brand"
                            ? "Značka"
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
      )}
    </div>
  );
}
