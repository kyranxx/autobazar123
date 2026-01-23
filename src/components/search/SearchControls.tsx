"use client";

import { useTranslations } from "next-intl";
import { Stats, Pagination, useInstantSearch } from "react-instantsearch";

// Enhanced Stats component
export function SearchStats() {
    return (
        <Stats
            classNames={{
                root: "text-sm font-medium text-secondary",
            }}
            translations={{
                rootElementText({ nbHits, processingTimeMS }) {
                    return `${nbHits.toLocaleString("sk-SK")} výsledkov (${processingTimeMS}ms)`;
                },
            }}
        />
    );
}

// Sort options type
export type SortOption = "newest" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc";

// Enhanced Sort by component - uses Configure widget to modify ranking
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
            className="px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

// Enhanced Pagination component
export function SearchPagination() {
    return (
        <Pagination
            padding={2}
            showFirst={false}
            showLast={false}
            classNames={{
                root: "flex items-center justify-center gap-2",
                list: "flex items-center gap-2",
                item: "text-sm font-medium",
                selectedItem: "font-bold",
                link: "pagination-item",
                disabledItem: "pagination-item disabled",
            }}
        />
    );
}

// Enhanced No results component
export function NoResultsBoundary({
    children,
    fallback,
}: {
    children: React.ReactNode;
    fallback: React.ReactNode;
}) {
    const { results, status } = useInstantSearch();

    // Don't show no results while loading
    if (status === 'loading' || status === 'stalled') {
        return <>{children}</>;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(results as any).__isArtificial && results.nbHits === 0) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
