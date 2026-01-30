"use client";

import { useState, useMemo, useEffect, ReactNode } from "react";
import {
    RefinementList,
    RangeInput,
    ClearRefinements,
    CurrentRefinements,
    ToggleRefinement,
    useRefinementList,
} from "react-instantsearch";
import { useTranslations } from "next-intl";
import { searchClient, CARS_INDEX } from "@/lib/algolia";
import { cn } from "@/utils/cn";

export function FilterSidebar() {
    const t = useTranslations("filters");
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");
    const tBodyType = useTranslations("bodyType");

    return (
        <div className="space-y-6">
            <ClearRefinements
                translations={{ resetButtonText: t("clearAll") }}
                classNames={{
                    button: "w-full py-2.5 px-4 bg-background-secondary text-text-primary text-sm font-medium rounded-md hover:bg-background-tertiary transition-colors disabled:opacity-30",
                }}
            />

            <div className="space-y-3">
                <h4 className="text-xs text-text-tertiary">Aktívne filtre</h4>
                <CurrentRefinements
                    classNames={{
                        root: "flex flex-wrap gap-2",
                        item: "inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-subtle border border-accent/20 rounded-md text-xs text-accent font-medium",
                        label: "opacity-70",
                        delete: "hover:opacity-70 transition-opacity",
                    }}
                />
            </div>

            <FilterSection title="Značka a model">
                <AllBrandsRefinementList />
                <div className="h-3" />
                <CustomRefinementList attribute="model" />
            </FilterSection>

            <FilterSection title="Lokalita">
                <CustomRefinementList attribute="location_city" />
            </FilterSection>

            <FilterSection title="Cena">
                <CustomRangeInput attribute="price_eur" />
            </FilterSection>

            <FilterSection title="Rok výroby">
                <CustomRangeInput attribute="year" />
            </FilterSection>

            <FilterSection title="Palivo">
                <RefinementList
                    attribute="fuel"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label: tFuel((item.label as any) || item.label),
                        }))
                    }
                    classNames={refinementListClasses}
                />
            </FilterSection>

            <FilterSection title="Prevodovka">
                <RefinementList
                    attribute="transmission"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label: tTransmission((item.label as any) || item.label),
                        }))
                    }
                    classNames={refinementListClasses}
                />
            </FilterSection>

            <FilterSection title="Karoséria">
                <RefinementList
                    attribute="body_style"
                    transformItems={(items) =>
                        items.map((item) => ({
                            ...item,
                            label: tBodyType((item.label.toLowerCase() as any) || item.label),
                        }))
                    }
                    classNames={refinementListClasses}
                />
            </FilterSection>

            <FilterSection title="Ostatné">
                <div className="space-y-3">
                    <CustomToggle attribute="has_service_book" label="Servisná knižka" />
                    <CustomToggle attribute="not_crashed" label="Nehavarované" />
                    <CustomToggle attribute="is_bought_in_sk" label="Kúpené v SR" />
                </div>
            </FilterSection>
        </div>
    );
}

const refinementListClasses = {
    list: "space-y-2",
    item: "flex items-center",
    label: "flex items-center gap-2.5 w-full cursor-pointer group",
    checkbox: "w-4 h-4 rounded border-border text-text-primary focus:ring-text-primary transition-colors",
    labelText: "text-sm text-text-secondary group-hover:text-text-primary transition-colors",
    count: "ml-auto text-xs text-text-tertiary",
};

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">{title}</h3>
            <div>{children}</div>
        </div>
    );
}

function CustomRangeInput({ attribute }: { attribute: string }) {
    return (
        <RangeInput
            attribute={attribute}
            classNames={{
                root: "space-y-3",
                form: "flex items-center gap-2",
                input: "w-full px-3 py-2 bg-white border border-border rounded-md text-sm focus:border-text-primary focus:ring-0 transition-colors",
                separator: "text-text-muted",
                submit: "px-4 py-2 bg-text-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover transition-colors",
            }}
            translations={{ separatorElementText: "—", submitButtonText: "OK" }}
        />
    );
}

function CustomToggle({ attribute, label }: { attribute: string; label: string }) {
    return (
        <ToggleRefinement
            attribute={attribute}
            label={label}
            classNames={{
                label: "flex items-center gap-2.5 w-full cursor-pointer group",
                checkbox: "w-4 h-4 rounded border-border text-text-primary focus:ring-text-primary transition-colors",
                labelText: "text-sm text-text-secondary group-hover:text-text-primary transition-colors",
            }}
        />
    );
}

function AllBrandsRefinementList() {
    const { items: currentItems, refine } = useRefinementList({ attribute: 'brand', limit: 100 });
    const [allBrands, setAllBrands] = useState<{ value: string; count: number }[]>([]);

    useEffect(() => {
        const fetchBrands = async () => {
            const res = await searchClient.search([{ indexName: CARS_INDEX, params: { facets: ['brand'], hitsPerPage: 0 } }]) as any;
            const brandFacets = res.results?.[0]?.facets?.brand || {};
            setAllBrands(Object.entries(brandFacets).map(([value, count]) => ({ value, count: count as number })).sort((a, b) => b.count - a.count));
        };
        fetchBrands();
    }, []);

    const mergedItems = useMemo(() => {
        const refined = new Set(currentItems.filter(i => i.isRefined).map(i => i.value));
        return allBrands.map(b => ({ value: b.value, label: b.value, isRefined: refined.has(b.value), count: b.count }));
    }, [allBrands, currentItems]);

    return (
        <ul className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {mergedItems.map(item => (
                <li key={item.value}>
                    <label className="flex items-center gap-2.5 py-1 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={item.isRefined} 
                            onChange={() => refine(item.value)} 
                            className="w-4 h-4 rounded border-border text-text-primary focus:ring-text-primary transition-colors" 
                        />
                        <span className={cn(
                            "text-sm flex-1 truncate transition-colors",
                            item.isRefined ? 'text-text-primary font-medium' : 'text-text-secondary group-hover:text-text-primary'
                        )}>
                            {item.label}
                        </span>
                        <span className="text-xs text-text-tertiary">{item.count}</span>
                    </label>
                </li>
            ))}
        </ul>
    );
}

function CustomRefinementList({ attribute }: { attribute: string }) {
    const { items, refine } = useRefinementList({ attribute, limit: 100 });
    if (items.length === 0) return null;
    return (
        <ul className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {items.sort((a, b) => b.count - a.count).map(item => (
                <li key={item.value}>
                    <label className="flex items-center gap-2.5 py-1 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={item.isRefined} 
                            onChange={() => refine(item.value)} 
                            className="w-4 h-4 rounded border-border text-text-primary focus:ring-text-primary transition-colors" 
                        />
                        <span className={cn(
                            "text-sm flex-1 truncate transition-colors",
                            item.isRefined ? 'text-text-primary font-medium' : 'text-text-secondary group-hover:text-text-primary'
                        )}>
                            {item.label}
                        </span>
                        <span className="text-xs text-text-tertiary">{item.count}</span>
                    </label>
                </li>
            ))}
        </ul>
    );
}
