"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchBox, useRefinementList } from "react-instantsearch";
import { useTranslations } from "next-intl";
import { searchClient } from "@/lib/algolia";
import { findBrandInQuery, findModelInQuery } from "@/utils/search";
import { SearchIcon, XIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

export function SearchResultsSearchBox() {
    const { query, refine: refineQuery } = useSearchBox();
    const [inputValue, setInputValue] = useState(query);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations("search");

    const { items: brandItems, refine: refineBrand } = useRefinementList({ attribute: 'brand' });
    const { items: modelItems, refine: refineModel } = useRefinementList({ attribute: 'model' });

    const [autoAppliedBrand, setAutoAppliedBrand] = useState<string | null>(null);
    const [autoAppliedModel, setAutoAppliedModel] = useState<string | null>(null);

    // Sync input with external query changes if needed, but safer
    // Sync input with external query changes if needed, but safer
    // useEffect(() => {
    //     if (query !== inputValue) {
    //         setInputValue(query);
    //     }
    // }, [query]);

    const [querySuggestions, setQuerySuggestions] = useState<{ query: string; count?: number }[]>([]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (inputValue.length < 2) {
                setQuerySuggestions([]);
                return;
            }

            const fetchSuggestions = async () => {
                try {
                    const response = await searchClient.searchForHits({
                        requests: [{ indexName: 'ads_query_suggestions', query: inputValue, hitsPerPage: 5 }]
                    });
                    const hits = (response.results[0]?.hits || []) as any[];
                    setQuerySuggestions(hits.map((h: { query?: string }) => ({ query: h.query || '' })));
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
            setAutoAppliedBrand(suggestion.value);
        } else if (suggestion.type === 'model') {
            refineModel(suggestion.value);
            setAutoAppliedModel(suggestion.value);
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
            <div className="flex items-center gap-5 px-8 py-5 bg-white border border-border/40 rounded-full shadow-premium focus-within:border-primary/10 transition-all">
                <SearchIcon className="w-6 h-6 text-secondary opacity-40 shrink-0" />
                <input
                    ref={inputRef}
                    type="search"
                    value={inputValue}
                    onChange={handleChange}
                    onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder={t("placeholder") || "Hľadať autá..."}
                    className="w-full text-base font-bold text-primary placeholder:text-secondary/40 bg-transparent focus:outline-none"
                />
                {inputValue && (
                    <button onClick={() => { setInputValue(""); refineQuery(""); }} className="p-2 text-secondary opacity-40 hover:opacity-100 transition-opacity">
                        <XIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[32px] border border-border/40 shadow-premium z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <ul className="py-4">
                        {suggestions.map((suggestion, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="flex items-center justify-between w-full px-8 py-4 hover:bg-surface transition-colors text-left"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center">
                                            <SearchIcon className="w-4 h-4 text-secondary opacity-60" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-primary block leading-none mb-1">{suggestion.value}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-40">
                                                {suggestion.type === 'query' ? 'Vyhľadávanie' : suggestion.type === 'brand' ? 'Značka' : 'Model'}
                                            </span>
                                        </div>
                                    </div>
                                    {suggestion.count !== undefined && (
                                        <span className="text-[10px] font-bold tabular-nums text-secondary opacity-40">{suggestion.count}</span>
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
