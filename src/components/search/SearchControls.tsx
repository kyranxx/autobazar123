"use client";

import { useLocale, useTranslations } from "next-intl";
import { Stats, Pagination } from "react-instantsearch";
import { cn } from "@/utils/cn";
import type { SearchSortOption } from "@/lib/algolia/sort-indices";

export function SearchStats() {
  const t = useTranslations("searchPage");
  const locale = useLocale();

  return (
    <Stats
      classNames={{
        root: "text-sm font-semibold text-text-primary",
      }}
      translations={{
        rootElementText({ nbHits }) {
          const pluralCategory = new Intl.PluralRules(locale).select(nbHits);
          if (pluralCategory === "one") {
            return t("vehicleFound", { count: nbHits.toLocaleString(locale) });
          }
          if (pluralCategory === "few") {
            return t("vehiclesFoundFew", { count: nbHits.toLocaleString(locale) });
          }
          return t("vehiclesFound", { count: nbHits.toLocaleString(locale) });
        },
      }}
    />
  );
}

type SortOption = SearchSortOption;

export function SearchSortBy({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (option: SortOption) => void;
}) {
  const t = useTranslations("sort");
  const tSearchPage = useTranslations("searchPage");

  const options: { label: string; value: SortOption }[] = [
    { label: t("newest"), value: "newest" },
    { label: t("priceAsc"), value: "price_asc" },
    { label: t("priceDesc"), value: "price_desc" },
    { label: t("yearDesc"), value: "year_desc" },
    { label: t("mileageAsc"), value: "mileage_asc" },
  ];

  return (
    <div className="w-52">
      <select
        id="search-results-sort-order"
        name="sortOrder"
        aria-label={tSearchPage("sortBy")}
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="flex h-11 w-full rounded-lg border border-border-strong bg-background-secondary px-3 text-sm font-medium text-text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
          "transition-all duration-200",
        ),
        selectedItem: cn(
          "!bg-accent !text-white shadow-sm",
          "hover:!bg-accent-hover",
        ),
        link: "w-full h-full flex items-center justify-center",
        disabledItem: "opacity-30 pointer-events-none",
        pageItem: "",
        previousPageItem: "mr-2",
        nextPageItem: "ml-2",
      }}
      translations={{
        previousPageItemText: "<",
        nextPageItemText: ">",
      }}
    />
  );
}
