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
import { GeoDistanceFilter } from "./GeoDistanceFilter";
import { cn } from "@/utils/cn";

export function FilterSidebar() {
    const t = useTranslations("filters");
    const tFuel = useTranslations("fuel");
    const tTransmission = useTranslations("transmission");
    const tBodyType = useTranslations("bodyType");
    const tAddListing = useTranslations("location") || "Lokalita";

    return (
        <div className="space-y-8 pb-12">
            <ClearRefinements
                translations={{ resetButtonText: t("clearAll") }}
                classNames={{
                    button: "w-full h-12 bg-surface text-primary text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-surface-hover transition-all disabled:opacity-20",
                }}
            />

            <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary opacity-40 ml-1">Aktívne filtre</h4>
                <CurrentRefinements
                    classNames={{
                        root: "flex flex-wrap gap-2",
                        item: "inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-full text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm",
                        label: "opacity-40",
                        delete: "w-4 h-4 flex items-center justify-center opacity-40 hover:opacity-100 transition-all",
                    }}
                />
            </div>

            <FilterSection title="Značka a model">
                <AllBrandsRefinementList />
                <div className="h-4" />
                <CustomRefinementList attribute="model" />
            </FilterSection>

            <FilterSection title="Lokalita">
                <CustomRefinementList attribute="location_city" />
                <div className="mt-6 pt-6 border-t border-border/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-40 mb-4">Vzdialenosť</p>
                    <GeoDistanceFilter />
                </div>
            </FilterSection>

            <FilterSection title="Cenové rozpätie">
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

            <FilterSection title="Typ karosérie">
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
                <div className="space-y-4">
                    <CustomToggle attribute="has_service_book" label="Servisná knižka" />
                    <CustomToggle attribute="not_crashed" label="Nehavarované" />
                    <CustomToggle attribute="is_bought_in_sk" label="Kúpené v SR" />
                </div>
            </FilterSection>
        </div>
    );
}

const refinementListClasses = {
    list: "space-y-3",
    item: "flex items-center",
    label: "flex items-center gap-3 w-full cursor-pointer group",
    checkbox: "w-5 h-5 rounded-md border-border bg-surface checked:bg-primary checked:border-primary transition-all cursor-pointer",
    labelText: "text-[11px] font-bold uppercase tracking-tight text-primary opacity-60 group-hover:opacity-100 transition-opacity",
    count: "ml-auto text-[10px] font-bold tabular-nums text-secondary opacity-40",
};

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="space-y-6">
            <h3 className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] border-b border-border/40 pb-4">{title}</h3>
            <div className="px-1">{children}</div>
        </div>
    );
}

function CustomRangeInput({ attribute }: { attribute: string }) {
    return (
        <RangeInput
            attribute={attribute}
            classNames={{
                root: "space-y-4",
                form: "flex items-center gap-2",
                input: "w-full h-11 px-4 bg-surface border-transparent rounded-xl text-xs font-bold tabular-nums focus:bg-white focus:border-primary/10 transition-all outline-none",
                separator: "opacity-20",
                submit: "h-11 px-5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase hover:bg-black transition-all",
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
                label: "flex items-center gap-3 w-full cursor-pointer group",
                checkbox: "w-5 h-5 rounded-md border-border bg-surface checked:bg-primary checked:border-primary transition-all cursor-pointer",
                labelText: "text-[11px] font-bold uppercase tracking-tight text-primary opacity-60 group-hover:opacity-100 transition-opacity",
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
        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
            {mergedItems.map(item => (
                <li key={item.value}>
                    <label className="flex items-center gap-3 py-1 cursor-pointer group">
                        <input type="checkbox" checked={item.isRefined} onChange={() => refine(item.value)} className="w-5 h-5 rounded-md border-border bg-surface checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                        <span className={cn("text-[11px] font-bold uppercase tracking-tight flex-1 truncate", item.isRefined ? 'text-primary' : 'text-primary opacity-60 group-hover:opacity-100')}>{item.label}</span>
                        <span className="text-[10px] font-bold tabular-nums text-secondary opacity-40">{item.count}</span>
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
        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
            {items.sort((a, b) => b.count - a.count).map(item => (
                <li key={item.value}>
                    <label className="flex items-center gap-3 py-1 cursor-pointer group">
                        <input type="checkbox" checked={item.isRefined} onChange={() => refine(item.value)} className="w-5 h-5 rounded-md border-border bg-surface checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                        <span className={cn("text-[11px] font-bold uppercase tracking-tight flex-1 truncate", item.isRefined ? 'text-primary' : 'text-primary opacity-60 group-hover:opacity-100')}>{item.label}</span>
                        <span className="text-[10px] font-bold tabular-nums text-secondary opacity-40">{item.count}</span>
                    </label>
                </li>
            ))}
        </ul>
    );
}
