"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchBox, useRefinementList } from "react-instantsearch";
import { useTranslations } from "next-intl";
import { searchClient } from "@/lib/algolia";
import { findBrandInQuery, findModelInQuery } from "@/utils/search";
import { SearchIcon, XIcon } from "@/components/ui/Icons";

export function SearchResultsSearchBox() {
    const { query, refine: refineQuery } = useSearchBox();
    const [inputValue, setInputValue] = useState(query);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations("search");

    // Get brand and model refinement lists
    const { items: brandItems, refine: refineBrand } = useRefinementList({ attribute: 'brand' });
    const { items: modelItems, refine: refineModel } = useRefinementList({ attribute: 'model' });

    // Track which refinements we've auto-applied
    const [autoAppliedBrand, setAutoAppliedBrand] = useState<string | null>(null);
    const [autoAppliedModel, setAutoAppliedModel] = useState<string | null>(null);

    useEffect(() => {
        setInputValue(query);
        // Position cursor at end of input after value is synced
        if (inputRef.current && query) {
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    const len = query.length;
                    inputRef.current.setSelectionRange(len, len);
                }
            });
        }
    }, [query]);

    // Generate suggestions from facets (brand/model) and query suggestions
    const [querySuggestions, setQuerySuggestions] = useState<{ query: string; count?: number }[]>([]);

    // Fetch query suggestions from Algolia Query Suggestions index
    useEffect(() => {
        if (inputValue.length < 2) {
            setQuerySuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const response = await searchClient.searchForHits({
                    requests: [{
                        indexName: 'ads_query_suggestions',
                        query: inputValue,
                        hitsPerPage: 5
                    }]
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const hits = (response.results[0]?.hits || []) as any[];
                setQuerySuggestions(hits.map((h: { query?: string }) => ({ query: h.query || '' })));
            } catch {
                // Fallback to empty if index doesn't exist yet
                setQuerySuggestions([]);
            }
        };

        const timeout = setTimeout(fetchSuggestions, 150);
        return () => clearTimeout(timeout);
    }, [inputValue]);

    // Combine facet suggestions with query suggestions
    const suggestions = useMemo(() => {
        if (inputValue.length < 2) return [];

        const queryLower = inputValue.toLowerCase();

        // Brand suggestions
        const brandSuggestions = brandItems
            .filter(item => item.value.toLowerCase().includes(queryLower) && !item.isRefined)
            .slice(0, 4)
            .map(item => ({ type: 'brand' as const, value: item.value, count: item.count }));

        // Model suggestions
        const modelSuggestions = modelItems
            .filter(item => item.value.toLowerCase().includes(queryLower) && !item.isRefined)
            .slice(0, 4)
            .map(item => ({ type: 'model' as const, value: item.value, count: item.count }));

        // Query suggestions (popular searches)
        const querySuggestionsFormatted = querySuggestions
            .filter(s => !brandSuggestions.some(b => b.value.toLowerCase() === s.query.toLowerCase()))
            .slice(0, 3)
            .map(s => ({ type: 'query' as const, value: s.query, count: undefined }));

        return [...brandSuggestions, ...modelSuggestions, ...querySuggestionsFormatted];
    }, [inputValue, brandItems, modelItems, querySuggestions]);

    // Calculate inline suggestion (typeahead) - finds best match that STARTS WITH user input
    // Smart: if user typed a brand already, suggest models
    const inlineSuggestion = useMemo(() => {
        if (inputValue.length < 2) return null;

        const inputLower = inputValue.toLowerCase().trim();
        const words = inputLower.split(/\s+/);

        // Check if the first word matches a brand
        const matchedBrand = brandItems.find(item =>
            item.value.toLowerCase() === words[0] ||
            item.value.toLowerCase().startsWith(words[0])
        );

        // If we have a brand match AND there are more words, suggest models
        if (matchedBrand && words.length > 1) {
            const modelSearchTerm = words.slice(1).join(' ');
            const matchingModel = modelItems.find(item =>
                item.value.toLowerCase().startsWith(modelSearchTerm) && !item.isRefined
            );
            if (matchingModel) {
                // Return full suggestion: "Brand Model"
                return `${matchedBrand.value} ${matchingModel.value}`;
            }
        }

        // Otherwise try to match brand that starts with input
        const matchingBrand = brandItems.find(item =>
            item.value.toLowerCase().startsWith(inputLower) && !item.isRefined
        );
        if (matchingBrand) {
            return matchingBrand.value;
        }

        // Then try models that start with input
        const matchingModel = modelItems.find(item =>
            item.value.toLowerCase().startsWith(inputLower) && !item.isRefined
        );
        if (matchingModel) {
            return matchingModel.value;
        }

        return null;
    }, [inputValue, brandItems, modelItems]);

    // Click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSuggestionClick = (suggestion: { type: 'brand' | 'model' | 'query'; value: string }) => {
        if (suggestion.type === 'brand') {
            refineBrand(suggestion.value);
            setAutoAppliedBrand(suggestion.value);
            setInputValue(suggestion.value);
            refineQuery(suggestion.value);
        } else if (suggestion.type === 'model') {
            refineModel(suggestion.value);
            setAutoAppliedModel(suggestion.value);
            setInputValue(suggestion.value);
            refineQuery(suggestion.value);
        } else {
            // Query suggestion - just search
            setInputValue(suggestion.value);
            refineQuery(suggestion.value);
        }
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    // Auto-apply refinements based on search query
    const applySmartRefinements = useCallback((searchValue: string) => {
        const availableBrands = brandItems.map(item => item.value);
        const availableModels = modelItems.map(item => item.value);

        // Find brand in query
        const detectedBrand = findBrandInQuery(searchValue, availableBrands);

        // Handle brand refinement
        if (detectedBrand) {
            // Check if this brand is already refined
            const brandItem = brandItems.find(item => item.value === detectedBrand);
            if (brandItem && !brandItem.isRefined) {
                // Clear previous auto-applied brand if different
                if (autoAppliedBrand && autoAppliedBrand !== detectedBrand) {
                    const prevBrandItem = brandItems.find(item => item.value === autoAppliedBrand);
                    if (prevBrandItem?.isRefined) {
                        refineBrand(autoAppliedBrand);
                    }
                }
                refineBrand(detectedBrand);
                setAutoAppliedBrand(detectedBrand);
            }
        } else if (autoAppliedBrand) {
            // No brand detected, clear auto-applied brand
            const prevBrandItem = brandItems.find(item => item.value === autoAppliedBrand);
            if (prevBrandItem?.isRefined) {
                refineBrand(autoAppliedBrand);
            }
            setAutoAppliedBrand(null);
        }

        // Find model in query
        const detectedModel = findModelInQuery(searchValue, availableModels, detectedBrand || undefined);

        // Handle model refinement
        if (detectedModel) {
            const modelItem = modelItems.find(item => item.value === detectedModel);
            if (modelItem && !modelItem.isRefined) {
                // Clear previous auto-applied model if different
                if (autoAppliedModel && autoAppliedModel !== detectedModel) {
                    const prevModelItem = modelItems.find(item => item.value === autoAppliedModel);
                    if (prevModelItem?.isRefined) {
                        refineModel(autoAppliedModel);
                    }
                }
                refineModel(detectedModel);
                setAutoAppliedModel(detectedModel);
            }
        } else if (autoAppliedModel) {
            // No model detected, clear auto-applied model
            const prevModelItem = modelItems.find(item => item.value === autoAppliedModel);
            if (prevModelItem?.isRefined) {
                refineModel(autoAppliedModel);
            }
            setAutoAppliedModel(null);
        }
    }, [brandItems, modelItems, refineBrand, refineModel, autoAppliedBrand, autoAppliedModel]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        refineQuery(value);
        // Auto-apply brand/model refinements based on search text
        applySmartRefinements(value);
        // Show suggestions when typing 2+ chars
        setShowSuggestions(value.length >= 2);
    };

    const handleClear = () => {
        setInputValue("");
        refineQuery("");
        // Clear auto-applied refinements
        if (autoAppliedBrand) {
            const brandItem = brandItems.find(item => item.value === autoAppliedBrand);
            if (brandItem?.isRefined) {
                refineBrand(autoAppliedBrand);
            }
            setAutoAppliedBrand(null);
        }
        if (autoAppliedModel) {
            const modelItem = modelItems.find(item => item.value === autoAppliedModel);
            if (modelItem?.isRefined) {
                refineModel(autoAppliedModel);
            }
            setAutoAppliedModel(null);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border bg-white shadow-lg focus-within:border-accent focus-within:shadow-accent/10 transition-all">
                <SearchIcon className="w-6 h-6 text-accent" />
                {/* Inline autocomplete container */}
                <div className="flex-1 relative">
                    {/* Inline suggestion overlay - shows grayed completion after user's input */}
                    {inlineSuggestion && inputValue && (
                        <div
                            className="absolute inset-0 flex items-center pointer-events-none text-lg font-medium"
                            aria-hidden="true"
                        >
                            <span className="invisible">{inputValue}</span>
                            <span className="text-secondary/40">{inlineSuggestion.slice(inputValue.length)}</span>
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        id="search-results-input"
                        name="q"
                        type="search"
                        value={inputValue}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            // Tab or Right arrow accepts inline suggestion
                            if ((e.key === 'Tab' || e.key === 'ArrowRight') && inlineSuggestion) {
                                e.preventDefault();
                                setInputValue(inlineSuggestion);
                                refineQuery(inlineSuggestion);
                            }
                        }}
                        onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                        autoFocus
                        placeholder={t("placeholder") || "Hľadať autá..."}
                        className="w-full text-lg font-medium text-primary placeholder:text-secondary/60 bg-transparent focus:outline-none"
                    />
                </div>
                {inputValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 rounded-full hover:bg-surface transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-secondary" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 py-2 rounded-2xl border border-border bg-white shadow-xl z-50">
                    <ul className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {suggestions.map((suggestion, index) => (
                            <li key={`${suggestion.type}-${suggestion.value}-${index}`}>
                                <button
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="flex items-center justify-between w-full px-4 py-3 hover:bg-surface transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface text-secondary group-hover:bg-white group-hover:text-accent group-hover:shadow-sm transition-all">
                                            <SearchIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-primary block">
                                                {suggestion.value}
                                            </span>
                                            <span className="text-xs text-secondary capitalize">
                                                {suggestion.type === 'query' ? 'Vyhľadávanie' : suggestion.type === 'brand' ? 'Značka' : 'Model'}
                                            </span>
                                        </div>
                                    </div>
                                    {suggestion.count !== undefined && (
                                        <span className="px-2 py-0.5 rounded-full bg-surface text-xs font-semibold text-secondary">
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
