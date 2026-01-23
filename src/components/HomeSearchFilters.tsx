"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { searchWithFilters } from '@/lib/algolia/search';

interface FacetItem {
    value: string;
    count: number;
}

export default function HomeSearchFilters() {
    const t = useTranslations('filters');
    const tSearch = useTranslations('search');

    // Local state for filters
    const [query, setQuery] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');

    // Advanced filters
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedFuel, setSelectedFuel] = useState('');
    const [selectedTransmission, setSelectedTransmission] = useState('');
    const [selectedBody, setSelectedBody] = useState('');
    const [mileageFrom, setMileageFrom] = useState('');
    const [mileageTo, setMileageTo] = useState('');

    // Facet data from Algolia
    const [brands, setBrands] = useState<FacetItem[]>([]);
    const [models, setModels] = useState<FacetItem[]>([]);
    const [fuels, setFuels] = useState<FacetItem[]>([]);
    const [transmissions, setTransmissions] = useState<FacetItem[]>([]);
    const [bodyStyles, setBodyStyles] = useState<FacetItem[]>([]);
    const [resultCount, setResultCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch data from Algolia based on current filters
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await searchWithFilters({
                query,
                brand: selectedBrand || undefined,
                model: selectedModel || undefined,
                fuel: selectedFuel || undefined,
                transmission: selectedTransmission || undefined,
                bodyStyle: selectedBody || undefined,
                priceFrom: priceFrom ? Number(priceFrom) : undefined,
                priceTo: priceTo ? Number(priceTo) : undefined,
                yearFrom: yearFrom ? Number(yearFrom) : undefined,
                yearTo: yearTo ? Number(yearTo) : undefined,
                mileageFrom: mileageFrom ? Number(mileageFrom) : undefined,
                mileageTo: mileageTo ? Number(mileageTo) : undefined,
            });

            setResultCount(result.count);
            setBrands(result.facets.brands);
            setFuels(result.facets.fuels);
            setTransmissions(result.facets.transmissions);
            setBodyStyles(result.facets.bodyStyles);

            // Only update models if brand is selected (for dependent dropdown)
            if (selectedBrand) {
                setModels(result.facets.models);
            } else {
                setModels([]);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [query, selectedBrand, selectedModel, selectedFuel, selectedTransmission, selectedBody,
        priceFrom, priceTo, yearFrom, yearTo, mileageFrom, mileageTo]);

    // Debounce the filter/count search (300ms)
    useEffect(() => {
        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    // Auto-navigate to /auta when typing 3+ chars (500ms debounce)
    useEffect(() => {
        if (query.length < 3) {
            return;
        }

        const timer = setTimeout(() => {
            // Navigate to /auta with the query
            window.location.href = `/auta?q=${encodeURIComponent(query)}`;
        }, 800);

        return () => clearTimeout(timer);
    }, [query]);

    // Reset model when brand changes
    useEffect(() => {
        setSelectedModel('');
    }, [selectedBrand]);

    // Navigate to results page
    const handleSearch = () => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (selectedBrand) params.set('brand', selectedBrand);
        if (selectedModel) params.set('model', selectedModel);
        if (priceFrom) params.set('priceFrom', priceFrom);
        if (priceTo) params.set('priceTo', priceTo);
        if (yearFrom) params.set('yearFrom', yearFrom);
        if (yearTo) params.set('yearTo', yearTo);
        if (selectedFuel) params.set('fuel', selectedFuel);
        if (selectedTransmission) params.set('transmission', selectedTransmission);
        if (selectedBody) params.set('body', selectedBody);
        if (mileageFrom) params.set('mileageFrom', mileageFrom);
        if (mileageTo) params.set('mileageTo', mileageTo);
        // Use hard navigation to ensure URL params are properly read by /auta page
        window.location.href = `/auta${params.toString() ? `?${params.toString()}` : ''}`;
    };

    // Clear all filters
    const handleClear = () => {
        setQuery('');
        setSelectedBrand('');
        setSelectedModel('');
        setPriceFrom('');
        setPriceTo('');
        setYearFrom('');
        setYearTo('');
        setSelectedFuel('');
        setSelectedTransmission('');
        setSelectedBody('');
        setMileageFrom('');
        setMileageTo('');
    };

    const hasFilters = query || selectedBrand || selectedModel || priceFrom || priceTo ||
        yearFrom || yearTo || selectedFuel || selectedTransmission || selectedBody ||
        mileageFrom || mileageTo;

    // Result count text with proper pluralization
    const getResultText = () => {
        if (resultCount === 1) return `${resultCount} auto`;
        if (resultCount >= 2 && resultCount <= 4) return `${resultCount} autá`;
        return `${resultCount} áut`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-border/50 p-5 sm:p-6">
            {/* Search Input with Instant Results */}
            <div className="mb-5">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={tSearch('placeholder')}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-border text-base font-medium focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    />
                    {query.length > 0 && query.length < 3 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-secondary">
                            {3 - query.length} znaky
                        </span>
                    )}
                </div>
            </div>

            {/* Main Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {/* Brand */}
                <FilterSelect
                    label={t('brandAndModel').split(' ')[0]}
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                    options={brands}
                    placeholder={t('allBrands')}
                />

                {/* Model */}
                <FilterSelect
                    label="Model"
                    value={selectedModel}
                    onChange={setSelectedModel}
                    options={models}
                    placeholder={t('allModels')}
                    disabled={!selectedBrand}
                />

                {/* Price Range */}
                <FilterRange
                    label={`${t('priceTitle')} (€)`}
                    fromValue={priceFrom}
                    toValue={priceTo}
                    onFromChange={setPriceFrom}
                    onToChange={setPriceTo}
                />

                {/* Year Range */}
                <FilterRange
                    label={t('yearTitle')}
                    fromValue={yearFrom}
                    toValue={yearTo}
                    onFromChange={setYearFrom}
                    onToChange={setYearTo}
                />
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-accent transition-colors"
                >
                    <FilterIcon className="w-4 h-4" />
                    {t('advancedSearch')}
                    <ChevronIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {hasFilters && (
                    <button
                        onClick={handleClear}
                        className="text-sm font-medium text-error hover:text-error/80 transition-colors"
                    >
                        × {t('clear')}
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pt-3 border-t border-border/50">
                    <FilterSelect
                        label={t('fuelTitle')}
                        value={selectedFuel}
                        onChange={setSelectedFuel}
                        options={fuels}
                        placeholder="Všetky"
                    />
                    <FilterSelect
                        label={t('transmissionTitle')}
                        value={selectedTransmission}
                        onChange={setSelectedTransmission}
                        options={transmissions}
                        placeholder="Všetky"
                    />
                    <FilterSelect
                        label={t('bodyTypeTitle')}
                        value={selectedBody}
                        onChange={setSelectedBody}
                        options={bodyStyles}
                        placeholder="Všetky"
                    />
                    <FilterRange
                        label={t('mileageTitle')}
                        fromValue={mileageFrom}
                        toValue={mileageTo}
                        onFromChange={setMileageFrom}
                        onToChange={setMileageTo}
                    />
                </div>
            )}

            {/* Search Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-accent text-white font-semibold text-base hover:bg-accent-hover transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-accent/25"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner />
                            Hľadám...
                        </>
                    ) : (
                        <>
                            {t('showResults')}
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-white/20 text-sm font-bold">
                                {resultCount}
                            </span>
                            {getResultText().split(' ')[1]}
                            <ArrowRightIcon className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// Sub-components
function FilterSelect({ label, value, onChange, options, placeholder, disabled }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: FacetItem[];
    placeholder: string;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wide ml-1">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.value} ({opt.count})
                    </option>
                ))}
            </select>
        </div>
    );
}

function FilterRange({ label, fromValue, toValue, onFromChange, onToChange }: {
    label: string;
    fromValue: string;
    toValue: string;
    onFromChange: (v: string) => void;
    onToChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wide ml-1">
                {label}
            </label>
            <div className="flex items-center gap-1.5">
                <input
                    type="number"
                    value={fromValue}
                    onChange={(e) => onFromChange(e.target.value)}
                    placeholder="Od"
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                />
                <span className="text-secondary text-sm">–</span>
                <input
                    type="number"
                    value={toValue}
                    onChange={(e) => onToChange(e.target.value)}
                    placeholder="Do"
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                />
            </div>
        </div>
    );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function FilterIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
    );
}

function ChevronIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    );
}

function LoadingSpinner() {
    return (
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}

function CarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-2-4H7L5 9M5 9l-2 3v5a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-5l-2-3M5 9h14M7 13h.01M17 13h.01" />
        </svg>
    );
}
