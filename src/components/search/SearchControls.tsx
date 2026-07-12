"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePagination } from "react-instantsearch";
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
          "market-field flex h-10 w-full items-center justify-between bg-background-secondary px-3 text-sm font-semibold text-text-primary outline-none transition-colors hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent/20",
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
          className="absolute left-0 right-0 top-full z-[120] mt-1 overflow-hidden rounded-xl border border-border-subtle bg-background shadow-xl"
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
      className="market-icon-button flex size-10 items-center justify-center text-text-secondary hover:text-text-primary"
    >
      {nextView === "grid" ? <GridIcon className="size-4" /> : <ListIcon className="size-4" />}
    </button>
  );
}

export function SearchPagination() {
  const t = useTranslations("searchPage");
  const {
    pages,
    currentRefinement,
    isFirstPage,
    isLastPage,
    nbPages,
    refine,
  } = usePagination({ padding: 3 });

  if (nbPages <= 1) {
    return null;
  }

  const paginationLabel = t("paginationHint");
  const paginationItems = [
    {
      key: "previous",
      page: Math.max(currentRefinement - 1, 0),
      label: "<",
      ariaLabel: `${paginationLabel}: < ${Math.max(currentRefinement, 1)}`,
      disabled: isFirstPage,
    },
    ...pages.map((page) => ({
      key: `page-${page}`,
      page,
      label: String(page + 1),
      ariaLabel: `${paginationLabel}: ${page + 1}`,
      disabled: false,
    })),
    {
      key: "next",
      page: Math.min(currentRefinement + 1, nbPages - 1),
      label: ">",
      ariaLabel: `${paginationLabel}: > ${Math.min(currentRefinement + 2, nbPages)}`,
      disabled: isLastPage,
    },
  ];

  return (
    <nav className="flex items-center justify-center" aria-label={paginationLabel}>
      <ol className="flex flex-wrap items-center justify-center gap-1.5">
        {paginationItems.map((item) => {
          const isCurrent = item.page === currentRefinement && item.key.startsWith("page-");

          return (
            <li key={item.key}>
              <button
                type="button"
                aria-label={item.ariaLabel}
                aria-current={isCurrent ? "page" : undefined}
                disabled={item.disabled}
                onClick={() => refine(item.page)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-colors duration-200 sm:size-10",
                  isCurrent
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-secondary hover:bg-black/12 hover:text-text-primary",
                  item.disabled && "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-text-secondary",
                )}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
