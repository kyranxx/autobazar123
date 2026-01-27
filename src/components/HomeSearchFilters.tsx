"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { searchWithFilters } from '@/lib/algolia/search';
import { cn } from '@/utils/cn';

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
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [query, selectedBrand, selectedModel, selectedFuel, selectedTransmission, selectedBody,
        priceFrom, priceTo, yearFrom, yearTo, mileageFrom, mileageTo]);

    useEffect(() => {
        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    useEffect(() => {
        setSelectedModel('');
    }, [selectedBrand]);

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
        window.location.href = `/auta${params.toString() ? `?${params.toString()}` : ''}`;
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
        <div className="bg-white">
            {/* Quick Keyword/Query */}
            <div className="mb-8">
                <div className="relative group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary transition-colors group-focus-within:text-primary" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={tSearch('placeholder')}
                        className="w-full pl-14 pr-6 py-5 rounded-2xl bg-surface border-transparent focus:border-primary/10 focus:bg-white focus:shadow-sm transition-all outline-none text-base font-medium placeholder:text-secondary/40"
                    />
                </div>
            </div>

            {/* Grid Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <FilterSelect label="Značka" value={selectedBrand} onChange={setSelectedBrand} options={brands} placeholder="Všetky značky" />
                <FilterSelect label="Model" value={selectedModel} onChange={setSelectedModel} options={models} placeholder="Všetky modely" disabled={!selectedBrand} />
                <FilterRange label="Cena od - do" fromValue={priceFrom} toValue={priceTo} onFromChange={setPriceFrom} onToChange={setPriceTo} />
                <FilterRange label="Rok výroby" fromValue={yearFrom} toValue={yearTo} onFromChange={setYearFrom} onToChange={setYearTo} />
            </div>

            {/* Advanced & Clear */}
            <div className="flex items-center justify-between mb-8 border-t border-border/40 pt-8">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2.5 text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest"
                >
                    <FilterIcon className="w-4 h-4" />
                    {showAdvanced ? "Skryť filtre" : "Viac filtrov"}
                </button>

                {hasFilters && (
                    <button onClick={handleClear} className="text-xs font-bold text-error hover:opacity-70 transition-colors uppercase tracking-widest">
                        Vymazať filtre
                    </button>
                )}
            </div>

            {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <FilterSelect label="Palivo" value={selectedFuel} onChange={setSelectedFuel} options={fuels} placeholder="Všetky" />
                    <FilterSelect label="Prevodovka" value={selectedTransmission} onChange={setSelectedTransmission} options={transmissions} placeholder="Všetky" />
                    <FilterSelect label="Karoséria" value={selectedBody} onChange={setSelectedBody} options={bodyStyles} placeholder="Všetky" />
                    <FilterRange label="Kilometre" fromValue={mileageFrom} toValue={mileageTo} onFromChange={setMileageFrom} onToChange={setMileageTo} />
                </div>
            )}

            {/* Search Button - Floating Center */}
            <div className="flex justify-center -mb-10 mt-4">
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="h-16 px-14 rounded-full bg-primary text-white flex items-center justify-center gap-4 text-sm font-bold shadow-2xl hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>Zobraziť ponuku</span>
                            <span className="opacity-40 italic font-medium px-2 border-x border-white/20 ml-2">{resultCount} áut</span>
                            <ArrowRightIcon className="w-5 h-5 ml-1" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function FilterSelect({ label, value, onChange, options, placeholder, disabled }: {
    label: string; value: string; onChange: (v: string) => void; options: FacetItem[]; placeholder: string; disabled?: boolean;
}) {
    return (
        <div className="space-y-2.5">
            <span className="block text-[11px] font-bold text-secondary/50 uppercase tracking-widest ml-1">{label}</span>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full pl-5 pr-10 py-4 rounded-xl bg-surface border-transparent focus:border-primary/10 focus:bg-white transition-all outline-none text-[13px] font-bold appearance-none disabled:opacity-30"
                >
                    <option value="">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.value} ({opt.count})</option>
                    ))}
                </select>
                <ChevronIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
            </div>
        </div>
    );
}

function FilterRange({ label, fromValue, toValue, onFromChange, onToChange }: {
    label: string; fromValue: string; toValue: string; onFromChange: (v: string) => void; onToChange: (v: string) => void;
}) {
    return (
        <div className="space-y-2.5">
            <span className="block text-[11px] font-bold text-secondary/50 uppercase tracking-widest ml-1">{label}</span>
            <div className="flex items-center gap-3">
                <input
                    type="number"
                    value={fromValue}
                    onChange={(e) => onFromChange(e.target.value)}
                    placeholder="Od"
                    className="w-full px-5 py-4 rounded-xl bg-surface border-transparent focus:border-primary/10 focus:bg-white transition-all outline-none text-[13px] font-bold"
                />
                <input
                    type="number"
                    value={toValue}
                    onChange={(e) => onToChange(e.target.value)}
                    placeholder="Do"
                    className="w-full px-5 py-4 rounded-xl bg-surface border-transparent focus:border-primary/10 focus:bg-white transition-all outline-none text-[13px] font-bold"
                />
            </div>
        </div>
    );
}

function SearchIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}

function FilterIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
}

function ChevronIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
}

function ArrowRightIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
}
