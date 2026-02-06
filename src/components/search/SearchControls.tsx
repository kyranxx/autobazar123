"use client";

import { useTranslations } from "next-intl";
import { Stats, Pagination, useInstantSearch } from "react-instantsearch";
import CustomSelect from "@/components/ui/CustomSelect";
import { cn } from "@/utils/cn";

export function SearchStats() {
    return (
        <Stats
            classNames={{
                root: "text-sm font-medium text-text-secondary",
            }}
            translations={{
                rootElementText({ nbHits }) {
                    return `${nbHits.toLocaleString("sk-SK")} vozidiel`;
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
        <div className="w-44">
            <CustomSelect
                value={value}
                onChange={(val) => onChange(val as SortOption)}
                options={options}
                className="text-sm"
            />
        </div>
    );
}

export function SearchPagination() {
    return (
        <Pagination
            padding={1}
            showFirst={false}
            showLast={false}
            classNames={{
                root: "flex items-center justify-center",
                list: "flex items-center gap-1",
                item: cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "text-sm font-medium text-text-secondary",
                    "hover:bg-background-secondary hover:text-text-primary",
                    "transition-all duration-200"
                ),
                selectedItem: cn(
                    "!bg-accent !text-white shadow-sm",
                    "hover:!bg-accent-hover"
                ),
                link: "w-full h-full flex items-center justify-center",
                disabledItem: "opacity-30 pointer-events-none",
                pageItem: "",
                previousPageItem: "mr-2",
                nextPageItem: "ml-2",
            }}
            translations={{
                previousPageItemText: "←",
                nextPageItemText: "→",
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

    if (status === 'loading' || status === 'stalled') {
        return <>{children}</>;
    }

    if (!(results as { __isArtificial?: boolean }).__isArtificial && results.nbHits === 0) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
