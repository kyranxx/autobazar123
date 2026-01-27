"use client";

import { useTranslations } from "next-intl";
import { Stats, Pagination, useInstantSearch } from "react-instantsearch";

export function SearchStats() {
    return (
        <Stats
            classNames={{
                root: "text-xs font-bold text-secondary uppercase tracking-widest",
            }}
            translations={{
                rootElementText({ nbHits }) {
                    return `${nbHits.toLocaleString("sk-SK")} áut v ponuke`;
                },
            }}
        />
    );
}

export type SortOption = "newest" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc";

export function SearchSortBy({
    value,
    onChange,
}: {
    value: SortOption;
    onChange: (option: SortOption) => void;
}) {
    const t = useTranslations("sort");

    const options: { label: string; value: SortOption }[] = [
        { label: t("newest"), value: "newest" },
        { label: t("priceAsc"), value: "price_asc" },
        { label: t("priceDesc"), value: "price_desc" },
        { label: t("yearDesc"), value: "year_desc" },
        { label: t("mileageAsc"), value: "mileage_asc" },
    ];

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as SortOption)}
            className="px-6 py-2.5 rounded-full border border-border/40 bg-white text-[11px] font-bold uppercase tracking-widest text-primary focus:border-primary/10 transition-all outline-none cursor-pointer"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

export function SearchPagination() {
    return (
        <Pagination
            padding={1}
            showFirst={false}
            showLast={false}
            classNames={{
                root: "flex items-center justify-center gap-3",
                list: "flex items-center gap-3",
                item: "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                selectedItem: "bg-primary text-white",
                link: "w-full h-full flex items-center justify-center text-xs font-bold",
                disabledItem: "opacity-20 pointer-events-none",
            }}
        />
    );
}

export function NoResultsBoundary({
    children,
    fallback,
}: {
    children: React.ReactNode;
    fallback: React.ReactNode;
}) {
    const { results, status } = useInstantSearch();
    if (status === 'loading' || status === 'stalled') return <>{children}</>;
    if (!(results as { __isArtificial?: boolean }).__isArtificial && results.nbHits === 0) return <>{fallback}</>;
    return <>{children}</>;
}
