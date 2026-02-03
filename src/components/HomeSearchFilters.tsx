"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { searchWithFilters } from '@/lib/algolia/search';
import { cn } from '@/utils/cn';
import CustomSelect from '@/components/ui/CustomSelect';

interface FacetItem {
    value: string;
    count: number;
}

export default function HomeSearchFilters() {
    const t = useTranslations('filters');
    const tSearch = useTranslations('search');

    const [query, setQuery] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedFuel, setSelectedFuel] = useState('');
    const [selectedTransmission, setSelectedTransmission] = useState('');
    const [selectedBody, setSelectedBody] = useState('');
    const [mileageFrom, setMileageFrom] = useState('');
    const [mileageTo, setMileageTo] = useState('');

    const [brands, setBrands] = useState<FacetItem[]>([]);
    const [models, setModels] = useState<FacetItem[]>([]);
    const [fuels, setFuels] = useState<FacetItem[]>([]);
    const [transmissions, setTransmissions] = useState<FacetItem[]>([]);
    const [bodyStyles, setBodyStyles] = useState<FacetItem[]>([]);
    const [resultCount, setResultCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasRedirected, setHasRedirected] = useState(false);

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

            if (selectedBrand) {
                setModels(result.facets.models);
            } else {
                setModels([]);
            }

            // Auto-redirect to /vysledky when user types 3+ characters and Algolia responds with results
            if (query.length >= 3 && result.count > 0 && !hasRedirected) {
                setHasRedirected(true);
                window.location.href = `/vysledky?q=${encodeURIComponent(query)}`;
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [query, selectedBrand, selectedModel, selectedFuel, selectedTransmission, selectedBody,
        priceFrom, priceTo, yearFrom, yearTo, mileageFrom, mileageTo, hasRedirected]);

    // Fast reaction - 100ms debounce
    useEffect(() => {
        const timer = setTimeout(fetchData, 100);
        return () => clearTimeout(timer);
    }, [fetchData]);

    useEffect(() => {
        setSelectedModel('');
    }, [selectedBrand]);

    // Reset redirect flag when query clears
    useEffect(() => {
        if (query.length === 0) {
            setHasRedirected(false);
        }
    }, [query]);

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
        window.location.href = `/vysledky${params.toString() ? `?${params.toString()}` : ''}`;
    };

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

    return (
        <div>
            {/* Search input - premium style for Dark Mode */}
            <div className="mb-6">
                <div className="relative group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/50 group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={tSearch('placeholder')}
                        className="w-full pl-16 pr-6 py-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 focus:border-accent focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all text-lg text-white placeholder:text-white/30 shadow-inner"
                    />
                </div>
            </div>

            {/* Grid Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <FilterSelect label="Značka" value={selectedBrand} onChange={setSelectedBrand} options={brands} placeholder="Všetky značky" />
                <FilterSelect label="Model" value={selectedModel} onChange={setSelectedModel} options={models} placeholder="Všetky modely" disabled={!selectedBrand} />
                <FilterRange label="Cena" fromValue={priceFrom} toValue={priceTo} onFromChange={setPriceFrom} onToChange={setPriceTo} unit="€" />
                <FilterRange label="Rok výroby" fromValue={yearFrom} toValue={yearTo} onFromChange={setYearFrom} onToChange={setYearTo} />
            </div>

            {/* Advanced toggle & clear */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                    <FilterIcon className="w-4 h-4" />
                    <span>{showAdvanced ? "Skryť filtre" : "Viac filtrov"}</span>
                    <ChevronIcon className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                </button>

                {hasFilters && (
                    <button onClick={handleClear} className="text-sm font-medium text-white/60 hover:text-white transition-colors flex items-center gap-1 hover:bg-white/10 px-3 py-1.5 rounded-lg">
                        <CloseIcon className="w-3.5 h-3.5" />
                        Vymazať
                    </button>
                )}
            </div>

            {/* Advanced filters */}
            {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 animate-fade-in border-t border-white/10 pt-6">
                    <FilterSelect label="Palivo" value={selectedFuel} onChange={setSelectedFuel} options={fuels} placeholder="Všetky" />
                    <FilterSelect label="Prevodovka" value={selectedTransmission} onChange={setSelectedTransmission} options={transmissions} placeholder="Všetky" />
                    <FilterSelect label="Karoséria" value={selectedBody} onChange={setSelectedBody} options={bodyStyles} placeholder="Všetky" />
                    <FilterRange label="Najazdené km" fromValue={mileageFrom} toValue={mileageTo} onFromChange={setMileageFrom} onToChange={setMileageTo} unit="km" />
                </div>
            )}

            {/* Search Button - premium orange */}
            <div className="flex justify-center pt-2">
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="btn btn-accent w-full py-4 text-base font-bold shadow-glow-accent hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <SearchIcon className="w-5 h-5" />
                            <span>{tSearch('search')} {resultCount > 0 ? `(${resultCount} áut)` : ''}</span>
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}

function FilterSelect({ label, value, onChange, options, placeholder, disabled }: {
    label: string; value: string; onChange: (v: string) => void; options: FacetItem[]; placeholder: string; disabled?: boolean;
}) {
    // Transform FacetItem[] to SelectOption[]
    const selectOptions = options.map(opt => ({
        value: opt.value,
        label: opt.value,
        count: opt.count
    }));

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider pl-1">{label}</label>
            <CustomSelect
                value={value}
                onChange={onChange}
                options={selectOptions}
                placeholder={placeholder}
                disabled={disabled}
            />
        </div>
    );
}

function FilterRange({ label, fromValue, toValue, onFromChange, onToChange, unit }: {
    label: string; fromValue: string; toValue: string; onFromChange: (v: string) => void; onToChange: (v: string) => void; unit?: string;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider pl-1">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={fromValue}
                    onChange={(e) => onFromChange(e.target.value)}
                    placeholder="Od"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-accent focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all text-sm text-white placeholder:text-white/20"
                />
                <span className="text-white/40 font-medium">–</span>
                <input
                    type="number"
                    value={toValue}
                    onChange={(e) => onToChange(e.target.value)}
                    placeholder="Do"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-accent focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all text-sm text-white placeholder:text-white/20"
                />
                {unit && <span className="text-xs font-medium text-white/40 w-6 flex-shrink-0">{unit}</span>}
            </div>
        </div>
    );
}

function SearchIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}

function FilterIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
}

function ChevronIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
}

function CloseIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
