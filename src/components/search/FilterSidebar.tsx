"use client";

import { useState, useMemo, useEffect, ReactNode } from "react";
import {
    RefinementList,
    RangeInput,
    ClearRefinements,
    CurrentRefinements,
    ToggleRefinement,
    useRefinementList,
    useRange
} from "react-instantsearch";
import { useTranslations } from "next-intl";
import { searchClient, CARS_INDEX } from "@/lib/algolia";
import { GeoDistanceFilter } from "./GeoDistanceFilter";
import { ChevronIcon, SearchIconSmall } from "@/components/ui/Icons";

export function FilterSidebar() {
    const t = useTranslations("filters");
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");
    const tBodyType = useTranslations("bodyType");
    const tAddListing = useTranslations("addListing");

    return (
        <div className="space-y-3">
            {/* Clear all refinements - Enhanced */}
            <ClearRefinements
                translations={{
                    resetButtonText: t("clearAll"),
                }}
                classNames={{
                    button:
                        "w-full px-4 py-2.5 rounded-xl bg-error/10 text-error text-sm font-semibold hover:bg-error/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2",
                }}
            />

            {/* Current refinements - Premium pill style */}
            <div className="active-filters-scroll">
                <CurrentRefinements
                    classNames={{
                        root: "flex flex-wrap gap-2",
                        item: "inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-gradient-to-r from-accent/15 to-accent/10 text-accent text-sm font-medium border border-accent/20 shadow-sm hover:shadow-md transition-all",
                        label: "text-xs text-secondary mr-1",
                        delete: "w-5 h-5 flex items-center justify-center rounded-full bg-accent/20 hover:bg-error/80 hover:text-white text-accent/70 transition-all duration-200 cursor-pointer",
                    }}
                />
            </div>

            {/* Brand and Model filter */}
            <FilterSectionWithCount title={t("brandAndModel")} attribute="brand">
                <AllBrandsRefinementList
                    searchable
                    searchPlaceholder="Hľadať značku..."
                />
                <div className="h-4" />
                <CustomRefinementList
                    attribute="model"
                    searchable
                    searchPlaceholder="Hľadať model..."
                />
            </FilterSectionWithCount>


            {/* Location filter */}
            <FilterSectionWithCount title={tAddListing("location") || "Lokalita"} attribute="location_city">
                <CustomRefinementList
                    attribute="location_city"
                    searchable
                    searchPlaceholder="Hľadať mesto..."
                />
            </FilterSectionWithCount>

            {/* Distance from city filter */}
            <div className="px-4 py-3 bg-surface/80 border border-border rounded-xl shadow-sm">
                <h4 className="text-sm font-semibold text-primary mb-3">📍 Vzdialenosť od mesta</h4>
                <GeoDistanceFilter />
            </div>

            {/* Price range */}
            <FilterSectionWithRange title={t("priceTitle")} attribute="price_eur">
                <RangeInput
                    attribute="price_eur"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input:
                            "w-24 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary font-medium",
                        submit:
                            "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors",
                    }}
                    translations={{
                        separatorElementText: "–",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSectionWithRange>

            {/* Year range */}
            <FilterSectionWithRange title={t("yearTitle")} attribute="year">
                <RangeInput
                    attribute="year"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input:
                            "w-20 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary font-medium",
                        submit:
                            "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors",
                    }}
                    translations={{
                        separatorElementText: "–",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSectionWithRange>

            {/* Mileage range */}
            <FilterSectionWithRange title={t("mileageTitle") || "Najazdené km"} attribute="mileage_km">
                <RangeInput
                    attribute="mileage_km"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input: "w-24 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary font-medium",
                        submit: "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors",
                    }}
                    translations={{
                        separatorElementText: "–",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSectionWithRange>

            {/* Power range */}
            <FilterSectionWithRange title={t("powerTitle") || "Výkon"} attribute="power_kw">
                <RangeInput
                    attribute="power_kw"
                    classNames={{
                        root: "flex items-center gap-2",
                        form: "flex items-center gap-2",
                        input: "w-20 px-3 py-2 rounded-lg border border-border text-sm focus:border-accent focus:ring-1 focus:ring-accent",
                        separator: "text-secondary font-medium",
                        submit: "px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors",
                    }}
                    translations={{
                        separatorElementText: "–",
                        submitButtonText: "OK",
                    }}
                />
            </FilterSectionWithRange>

            {/* Fuel type */}
            <FilterSectionWithCount title={t("fuelTitle")} attribute="fuel">
                <RefinementList
                    attribute="fuel"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label: tFuel(item.label as keyof typeof tFuel) || item.label,
                        }))
                    }
                    classNames={{
                        root: "space-y-1",
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox:
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                    }}
                />
            </FilterSectionWithCount>

            {/* Transmission */}
            <FilterSectionWithCount title={t("transmissionTitle")} attribute="transmission">
                <RefinementList
                    attribute="transmission"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label:
                                tTransmission(item.label as keyof typeof tTransmission) ||
                                item.label,
                        }))
                    }
                    classNames={{
                        root: "space-y-1",
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox:
                            "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count:
                            "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                    }}
                />
            </FilterSectionWithCount>

            {/* Body Style */}
            <FilterSectionWithCount title={t("bodyTypeTitle") || "Typ karosérie"} attribute="body_style">
                <RefinementList
                    attribute="body_style"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label: tBodyType(item.label.toLowerCase() as keyof typeof tBodyType) || item.label,
                        }))
                    }
                    classNames={{
                        root: "space-y-1",
                        list: "space-y-1",
                        item: "flex items-center gap-2",
                        checkbox: "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                        label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        count: "ml-auto px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium",
                        showMore: "mt-2 text-sm text-accent hover:underline font-medium",
                    }}
                />
            </FilterSectionWithCount>

            {/* Trust signals */}
            <FilterSectionToggle title={t("trustTitle")}>
                <div className="space-y-2">
                    <ToggleRefinement
                        attribute="has_service_book"
                        label={t("serviceBook")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                            label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        }}
                    />
                    <ToggleRefinement
                        attribute="not_crashed"
                        label={t("notCrashed")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                            label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        }}
                    />
                    <ToggleRefinement
                        attribute="is_bought_in_sk"
                        label={t("boughtInSK")}
                        classNames={{
                            root: "flex items-center gap-2",
                            checkbox:
                                "w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent",
                            label: "text-sm text-primary cursor-pointer hover:text-accent transition-colors",
                        }}
                    />
                </div>
            </FilterSectionToggle>
        </div>
    );
}

// Helper Components
function FilterSectionWithCount({
    title,
    attribute,
    children,
}: {
    title: string;
    attribute: string;
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const { items } = useRefinementList({ attribute });
    const selectedCount = items.filter(item => item.isRefined).length;

    return (
        <div className={`rounded-xl border overflow-hidden bg-white transition-all ${selectedCount > 0 ? 'filter-section-active' : 'border-border'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors ${isOpen ? "bg-accent/5" : "hover:bg-surface"
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{title}</span>
                    {selectedCount > 0 && (
                        <span className="filter-count-badge">{selectedCount}</span>
                    )}
                </div>
                <ChevronIcon
                    className={`w-4 h-4 text-accent transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            {isOpen && <div className="px-4 py-3 border-t border-border">{children}</div>}
        </div>
    );
}

function FilterSectionWithRange({
    title,
    attribute,
    children,
}: {
    title: string;
    attribute: string;
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const { start, range } = useRange({ attribute });
    const hasValue = start[0] !== range.min || start[1] !== range.max;

    return (
        <div className={`rounded-xl border overflow-hidden bg-white transition-all ${hasValue ? 'filter-section-active' : 'border-border'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors ${isOpen ? "bg-accent/5" : "hover:bg-surface"
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{title}</span>
                    {hasValue && (
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                    )}
                </div>
                <ChevronIcon
                    className={`w-4 h-4 text-accent transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            {isOpen && <div className="px-4 py-3 border-t border-border">{children}</div>}
        </div>
    );
}

function FilterSectionToggle({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors ${isOpen ? "bg-accent/5" : "hover:bg-surface"
                    }`}
            >
                <span className="text-sm font-semibold text-primary">{title}</span>
                <ChevronIcon
                    className={`w-4 h-4 text-accent transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>
            {isOpen && <div className="px-4 py-3 border-t border-border">{children}</div>}
        </div>
    );
}


function AllBrandsRefinementList({
    searchable = false,
    searchPlaceholder = "Hľadať značku..."
}: {
    searchable?: boolean;
    searchPlaceholder?: string;
}) {
    const { items: currentItems, refine } = useRefinementList({
        attribute: 'brand',
        limit: 100,
    });
    const [allBrands, setAllBrands] = useState<{ value: string; count: number }[]>([]);
    const [searchValue, setSearchValue] = useState("");

    // Fetch ALL brands on mount (independent of search)
    useEffect(() => {
        const fetchAllBrands = async () => {
            try {
                const result = await searchClient.search([{
                    indexName: CARS_INDEX,
                    params: {
                        query: '',
                        facets: ['brand'],
                        hitsPerPage: 0,
                        maxValuesPerFacet: 100,
                    }
                }]);

                const facets = (result.results[0] as { facets?: { brand?: Record<string, number> } }).facets?.brand || {};
                const brands = Object.entries(facets)
                    .map(([value, count]) => ({ value, count }))
                    .sort((a, b) => b.count - a.count);
                setAllBrands(brands);
            } catch (error) {
                console.error('Failed to fetch all brands:', error);
            }
        };
        fetchAllBrands();
    }, []);

    const mergedItems = useMemo(() => {
        const refinedValues = new Set(currentItems.filter(i => i.isRefined).map(i => i.value));
        const currentCounts = new Map(currentItems.map(i => [i.value, i.count]));

        return allBrands.map(brand => ({
            value: brand.value,
            label: brand.value,
            count: currentCounts.get(brand.value) ?? 0,
            isRefined: refinedValues.has(brand.value),
            totalCount: brand.count,
        }));
    }, [allBrands, currentItems]);

    const filteredAndSortedItems = mergedItems
        .filter(item => !searchValue || item.value.toLowerCase().includes(searchValue.toLowerCase()))
        .sort((a, b) => {
            if (a.isRefined && !b.isRefined) return -1;
            if (!a.isRefined && b.isRefined) return 1;
            if (a.count !== b.count) return b.count - a.count;
            return b.totalCount - a.totalCount;
        });

    if (allBrands.length === 0) {
        return <div className="text-sm text-secondary">Načítavam značky...</div>;
    }

    return (
        <div className="space-y-2">
            {searchable && (
                <div className="relative">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface/50 focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all"
                    />
                    <SearchIconSmall className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                </div>
            )}
            <ul className="space-y-1">
                {filteredAndSortedItems.map((item) => (
                    <li key={item.value}>
                        <label className={`flex items-center gap-2 py-1 cursor-pointer hover:text-accent transition-colors group ${item.count === 0 ? 'opacity-50' : ''}`}>
                            <input
                                type="checkbox"
                                checked={item.isRefined}
                                onChange={() => refine(item.value)}
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent"
                            />
                            <span className={`text-sm flex-1 truncate ${item.isRefined ? 'text-accent font-medium' : item.count === 0 ? 'text-secondary' : 'text-primary'}`}>
                                {item.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.count > 0 ? 'bg-surface text-secondary' : 'bg-surface/50 text-secondary/50'}`}>
                                {item.count}
                            </span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function CustomRefinementList({
    attribute,
    searchable = false,
    searchPlaceholder = "Hľadať..."
}: {
    attribute: string;
    searchable?: boolean;
    searchPlaceholder?: string;
}) {
    const { items, refine } = useRefinementList({
        attribute,
        limit: 100,
    });
    const [searchValue, setSearchValue] = useState("");

    const filteredAndSortedItems = [...items]
        .filter(item =>
            !searchValue || item.value.toLowerCase().includes(searchValue.toLowerCase())
        )
        .sort((a, b) => {
            if (a.isRefined && !b.isRefined) return -1;
            if (!a.isRefined && b.isRefined) return 1;
            return b.count - a.count;
        });

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {searchable && (
                <div className="relative">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface/50 focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all"
                    />
                    <SearchIconSmall className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                </div>
            )}
            <ul className="space-y-1">
                {filteredAndSortedItems.map((item) => (
                    <li key={item.value}>
                        <label className="flex items-center gap-2 py-1 cursor-pointer hover:text-accent transition-colors group">
                            <input
                                type="checkbox"
                                checked={item.isRefined}
                                onChange={() => refine(item.value)}
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent"
                            />
                            <span className={`text-sm flex-1 truncate ${item.isRefined ? 'text-accent font-medium' : 'text-primary'}`}>
                                {item.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-surface text-secondary text-xs font-medium">
                                {item.count}
                            </span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}
