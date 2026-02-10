"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useSearchBox, useRefinementList } from "react-instantsearch";
import { useTranslations } from "next-intl";
import { getSearchClient } from "@/lib/algolia";
import { cn } from "@/utils/cn";
import { SearchIcon, XIcon, CarIcon, TagIcon } from "@/components/ui/Icons";

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

  const { items: brandItems, refine: refineBrand } = useRefinementList({
    attribute: "brand",
  });
  const { items: modelItems, refine: refineModel } = useRefinementList({
    attribute: "model",
  });

  const [querySuggestions, setQuerySuggestions] = useState<
    { query: string; count?: number }[]
  >([]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputValue.length < 2) {
        setQuerySuggestions([]);
        return;
      }

      const fetchSuggestions = async () => {
        const client = getSearchClient();
        if (!client) return;
        try {
          const response = await client.searchForHits({
            requests: [
              {
                indexName: "ads_query_suggestions",
                query: inputValue,
                hitsPerPage: 5,
              },
            ],
          });
          const hits = ((response.results[0] as { hits?: { query?: string }[] })
            ?.hits || []) as { query?: string }[];
          setQuerySuggestions(hits.map((h) => ({ query: h.query || "" })));
        } catch {
          setQuerySuggestions([]);
        }
      };

      fetchSuggestions();
    }, 150);

    return () => clearTimeout(timeout);
  }, [inputValue]);

  const suggestions = useMemo(() => {
    if (inputValue.length < 2) return [];
    const queryLower = inputValue.toLowerCase();

    const brandSuggs = brandItems
      .filter(
        (item) =>
          item.value.toLowerCase().includes(queryLower) && !item.isRefined,
      )
      .slice(0, 4)
      .map((item) => ({
        type: "brand" as const,
        value: item.value,
        count: item.count,
      }));

    const modelSuggs = modelItems
      .filter(
        (item) =>
          item.value.toLowerCase().includes(queryLower) && !item.isRefined,
      )
      .slice(0, 4)
      .map((item) => ({
        type: "model" as const,
        value: item.value,
        count: item.count,
      }));

    const querySuggs = querySuggestions
      .filter(
        (s) =>
          !brandSuggs.some(
            (b) => b.value.toLowerCase() === s.query.toLowerCase(),
          ),
      )
      .slice(0, 3)
      .map((s) => ({
        type: "query" as const,
        value: s.query,
        count: undefined,
      }));

    return [...brandSuggs, ...modelSuggs, ...querySuggs];
  }, [inputValue, brandItems, modelItems, querySuggestions]);

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
    setShowSuggestions(value.length >= 2);
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
        <input
          ref={inputRef}
          type="search"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            inputValue.length >= 2 &&
            suggestions.length > 0 &&
            setShowSuggestions(true)
          }
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={t("placeholder") || "Hľadať značku, model..."}
          className={cn(
            "w-full text-base text-text-primary bg-transparent",
            "placeholder:text-text-muted",
            "focus:outline-none",
          )}
        />
        {inputValue && (
          <button
            onClick={clearInput}
            className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-background-tertiary transition-colors"
            aria-label="Clear search"
          >
            <XIcon className="w-4 h-4" />
          </button>
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
