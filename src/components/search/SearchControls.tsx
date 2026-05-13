"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Pagination } from "react-instantsearch";
import { cn } from "@/utils/cn";
import type { SearchSortOption } from "@/lib/algolia/sort-indices";
import { ChevronDownIcon, GridIcon, ListIcon } from "@/components/ui/Icons";

type SortOption = SearchSortOption;

export function SearchSortBy({
  value,
  onChange,
  className,
  buttonClassName,
}: {
  value: SortOption;
  onChange: (option: SortOption) => void;
  className?: string;
  buttonClassName?: string;
}) {
  const t = useTranslations("sort");
  const tSearchPage = useTranslations("searchPage");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options: { label: string; value: SortOption }[] = useMemo(
    () => [
      { label: t("newest"), value: "newest" },
      { label: t("priceAsc"), value: "price_asc" },
      { label: t("priceDesc"), value: "price_desc" },
      { label: t("yearDesc"), value: "year_desc" },
      { label: t("mileageAsc"), value: "mileage_asc" },
    ],
    [t],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div
      ref={containerRef}
      className={cn("relative z-[95] w-[150px] sm:w-[170px]", className)}
    >
      <button
        type="button"
        aria-label={tSearchPage("sortBy")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xl border border-border-strong bg-background-secondary px-3 text-sm font-semibold text-text-primary outline-none transition-colors hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent/20",
          buttonClassName,
        )}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDownIcon
          className={cn("size-4 text-text-muted transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-[120] overflow-hidden rounded-xl border border-border-subtle bg-background shadow-xl"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                option.value === value
                  ? "bg-background-secondary text-text-primary"
                  : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
              )}
            >
              <span>{option.label}</span>
              {option.value === value ? (
                <span className="text-xs font-bold text-accent">•</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SearchViewToggle({
  viewMode,
  onToggle,
}: {
  viewMode: "grid" | "list";
  onToggle: () => void;
}) {
  const t = useTranslations("searchPage");
  const nextView = viewMode === "grid" ? "list" : "grid";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={nextView === "grid" ? t("gridView") : t("listView")}
      className="flex size-9 items-center justify-center rounded-xl border border-border-subtle bg-background-secondary text-text-secondary transition-colors hover:bg-background hover:text-text-primary hover:shadow-sm"
    >
      {nextView === "grid" ? <GridIcon className="size-4" /> : <ListIcon className="size-4" />}
    </button>
  );
}

export function SearchPagination() {
  return (
    <Pagination
      padding={3}
      showFirst={false}
      showLast={false}
      classNames={{
        root: "flex items-center justify-center",
        list: "flex flex-wrap items-center justify-center gap-1.5",
        item: cn(
          "flex size-9 items-center justify-center overflow-hidden rounded-lg sm:h-10 sm:w-10",
          "border border-transparent text-sm font-medium text-text-secondary",
          "transition-colors duration-200",
          "hover:bg-black/12 hover:text-text-primary",
        ),
        selectedItem: cn("!bg-accent !text-white shadow-sm hover:!bg-accent [&_.ais-Pagination-link]:!bg-transparent [&_.ais-Pagination-link:hover]:!bg-transparent"),
        pageItem: "overflow-hidden rounded-lg",
        link: "flex size-full items-center justify-center rounded-lg",
        disabledItem: "pointer-events-none opacity-30",
        previousPageItem: "mr-1",
        nextPageItem: "ml-1",
      }}
      translations={{
        previousPageItemText: "<",
        nextPageItemText: ">",
      }}
    />
  );
}
