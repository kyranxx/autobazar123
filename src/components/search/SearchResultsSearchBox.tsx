"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchBox, useRefinementList } from "react-instantsearch";
import { useTranslations } from "next-intl";
import { getSearchClient } from "@/lib/algolia";
import { cn } from "@/utils/cn";

interface SearchResultsSearchBoxProps {
    autoFocus?: boolean;
}

export function SearchResultsSearchBox({ autoFocus = false }: SearchResultsSearchBoxProps) {
    const { query, refine: refineQuery } = useSearchBox();
    const [inputValue, setInputValue] = useState(query);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations("search");

    const { items: brandItems, refine: refineBrand } = useRefinementList({ attribute: 'brand' });
    const { items: modelItems, refine: refineModel } = useRefinementList({ attribute: 'model' });

    const [querySuggestions, setQuerySuggestions] = useState<{ query: string; count?: number }[]>([]);

    // Auto-focus effect
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
                        requests: [{ indexName: 'ads_query_suggestions', query: inputValue, hitsPerPage: 5 }]
                    });
                    const hits = ((response.results[0] as { hits?: { query?: string }[] })?.hits || []) as { query?: string }[];
                    setQuerySuggestions(hits.map((h) => ({ query: h.query || '' })));
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
            .filter(item => item.value.toLowerCase().includes(queryLower) && !item.isRefined)
            .slice(0, 4)
            .map(item => ({ type: 'brand' as const, value: item.value, count: item.count }));

        const modelSuggs = modelItems
            .filter(item => item.value.toLowerCase().includes(queryLower) && !item.isRefined)
            .slice(0, 4)
            .map(item => ({ type: 'model' as const, value: item.value, count: item.count }));

        const querySuggs = querySuggestions
            .filter(s => !brandSuggs.some(b => b.value.toLowerCase() === s.query.toLowerCase()))
            .slice(0, 3)
            .map(s => ({ type: 'query' as const, value: s.query, count: undefined }));

        return [...brandSuggs, ...modelSuggs, ...querySuggs];
    }, [inputValue, brandItems, modelItems, querySuggestions]);

    const handleSuggestionClick = (suggestion: { type: 'brand' | 'model' | 'query'; value: string }) => {
        if (suggestion.type === 'brand') {
            refineBrand(suggestion.value);
        } else if (suggestion.type === 'model') {
            refineModel(suggestion.value);
        }
        setInputValue(suggestion.value);
        refineQuery(suggestion.value);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        refineQuery(value);
        setShowSuggestions(value.length >= 2);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-3 px-4 py-3 bg-background-secondary border border-border rounded-lg focus-within:border-text-primary transition-colors">
                <SearchIcon className="w-5 h-5 text-text-tertiary shrink-0" />
                <input
                    ref={inputRef}
                    type="search"
                    value={inputValue}
                    onChange={handleChange}
                    onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={t("placeholder") || "Hľadať autá..."}
                    className="w-full text-base text-text-primary placeholder:text-text-muted bg-transparent focus:outline-none"
                />
                {inputValue && (
                    <button
                        onClick={() => { setInputValue(""); refineQuery(""); }}
                        className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary rounded-lg border border-border shadow-lg z-[100] overflow-hidden">
                    <ul className="py-1">
                        {suggestions.map((suggestion, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-background-secondary transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <SearchIcon className="w-4 h-4 text-text-tertiary" />
                                        <div>
                                            <span className="text-sm font-medium text-text-primary">{suggestion.value}</span>
                                            <span className="text-xs text-text-tertiary ml-2">
                                                {suggestion.type === 'query' ? 'vyhľadávanie' : suggestion.type === 'brand' ? 'značka' : 'model'}
                                            </span>
                                        </div>
                                    </div>
                                    {suggestion.count !== undefined && (
                                        <span className="text-xs text-text-tertiary">{suggestion.count}</span>
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

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
