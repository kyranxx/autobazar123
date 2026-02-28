"use client";

import { useState, useMemo, useEffect, useRef, ReactNode } from "react";
import {
  RefinementList,
  RangeInput,
  ToggleRefinement,
  useRange,
  useRefinementList,
} from "react-instantsearch";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { SearchIcon } from "@/components/ui/Icons";

function toFieldId(prefix: string, value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${prefix}-${slug || "item"}`;
}

function applyRangeInputMetadata(root: HTMLElement | null, attribute: string): void {
  if (!root) return;

  const inputs = root.querySelectorAll<HTMLInputElement>("input.ais-RangeInput-input");
  inputs.forEach((input, index) => {
    const suffix =
      input.classList.contains("ais-RangeInput-input--min") || index === 0
        ? "min"
        : "max";
    const fieldId = `${attribute}-range-${suffix}`;

    if (!input.id) input.id = fieldId;
    if (!input.name) input.name = fieldId;
  });
}

export function FilterSidebar() {
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBodyType = useTranslations("bodyType");

  return (
    <div className="space-y-6">
      <FilterSection title="Značka">
        <AllBrandsRefinementList />
      </FilterSection>

      <FilterSection title="Model">
        <CustomRefinementList attribute="model" />
      </FilterSection>

      <FilterSection title="Lokalita">
        <CustomRefinementList attribute="location_city" />
      </FilterSection>

      <FilterSection title="Cena">
        <PriceRangeInput attribute="price_eur" />
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
              label: item.label
                ? tFuel(item.label.toLowerCase() as Parameters<typeof tFuel>[0])
                : item.label,
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
              label: item.label
                ? tTransmission(
                    item.label.toLowerCase() as Parameters<typeof tTransmission>[0],
                  )
                : item.label,
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
              label: item.label
                ? tBodyType(
                    item.label.toLowerCase() as Parameters<typeof tBodyType>[0],
                  )
                : item.label,
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
  list: "space-y-1",
  item: "flex items-center",
  label: "flex items-center gap-3 w-full cursor-pointer group py-1.5 min-w-0",
  checkbox:
    "w-4 h-4 rounded border-2 border-border-strong text-accent focus:ring-accent focus:ring-offset-0 transition-colors",
  labelText:
    "text-sm text-text-secondary group-hover:text-text-primary transition-colors truncate flex-1",
  count: "text-xs text-text-muted tabular-nums",
};

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border-subtle pb-5 last:border-b-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">{title}</h3>
      {children}
    </section>
  );
}

export function PriceRangeInput({ attribute }: { attribute: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { canRefine, range, refine, start } = useRange({ attribute });

  useEffect(() => {
    applyRangeInputMetadata(rootRef.current, attribute);
  }, [attribute]);

  return (
    <div ref={rootRef} className="space-y-3">
      <RangeInput
        attribute={attribute}
        classNames={{
          root: "space-y-3",
          form: "flex items-center gap-2",
          input:
            "w-full px-3 py-2.5 bg-background border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all",
          separator: "text-text-muted font-medium",
          submit:
            "px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors shadow-sm",
        }}
        translations={{ separatorElementText: "-", submitButtonText: "OK" }}
      />
      <div className="flex flex-wrap gap-1.5">
        {[5000, 10000, 20000, 50000].map((price) => (
          <button
            key={price}
            type="button"
            onClick={() =>
              refine([
                typeof range.min === "number" ? range.min : undefined,
                price,
              ])
            }
            disabled={!canRefine}
            aria-pressed={
              typeof start[1] === "number" && Math.round(start[1]) === price
            }
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              !canRefine
                ? "cursor-not-allowed border-border-subtle bg-background text-text-muted"
                : typeof start[1] === "number" && Math.round(start[1]) === price
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-subtle bg-background text-text-secondary hover:border-accent hover:text-accent",
            )}
          >
            do {(price / 1000).toFixed(0)}k EUR
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomRangeInput({ attribute }: { attribute: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyRangeInputMetadata(rootRef.current, attribute);
  }, [attribute]);

  return (
    <div ref={rootRef}>
      <RangeInput
        attribute={attribute}
        classNames={{
          root: "space-y-3",
          form: "flex items-center gap-2",
          input:
            "w-full px-3 py-2.5 bg-background border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all",
          separator: "text-text-muted font-medium",
          submit:
            "px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors shadow-sm",
        }}
        translations={{ separatorElementText: "-", submitButtonText: "OK" }}
      />
    </div>
  );
}

function CustomToggle({
  attribute,
  label,
}: {
  attribute: string;
  label: string;
}) {
  return (
    <ToggleRefinement
      attribute={attribute}
      label={label}
      classNames={{
        root: "",
        label: "flex items-center gap-3 w-full cursor-pointer group py-1",
        checkbox:
          "w-4 h-4 rounded border-2 border-border-strong text-accent focus:ring-accent focus:ring-offset-0 transition-colors",
        labelText:
          "text-sm text-text-secondary group-hover:text-text-primary transition-colors",
      }}
    />
  );
}

function AllBrandsRefinementList() {
  const { items: currentItems, refine } = useRefinementList({
    attribute: "brand",
    limit: 100,
    sortBy: ["count:desc", "name:asc"],
  });
  const [searchQuery, setSearchQuery] = useState("");

  const mergedItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return currentItems;
    }

    return currentItems.filter((item) =>
      item.label.toLowerCase().includes(normalizedQuery),
    );
  }, [currentItems, searchQuery]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          id="brand-filter-search"
          name="brand-filter-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hľadať značku..."
          className="w-full pl-9 pr-3 py-2 bg-background border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
      </div>
      <ul className="space-y-1">
        {mergedItems.map((item) => {
          const checkboxId = toFieldId("brand-filter", item.value);
          return (
            <li key={item.value}>
              <label
                htmlFor={checkboxId}
                className="flex items-center gap-3 py-1.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  id={checkboxId}
                  name="brand-filter"
                  checked={item.isRefined}
                  onChange={() => refine(item.value)}
                  className="w-4 h-4 rounded border-2 border-border-strong text-accent focus:ring-accent focus:ring-offset-0 transition-colors"
                />
                <span
                  className={cn(
                    "text-sm flex-1 truncate transition-colors",
                    item.isRefined
                      ? "text-text-primary font-medium"
                      : "text-text-secondary group-hover:text-text-primary",
                  )}
                >
                  {item.label}
                </span>
                <span className="text-xs text-text-muted tabular-nums">
                  {item.count}
                </span>
              </label>
            </li>
          );
        })}
        {mergedItems.length === 0 && (
          <li className="py-3 text-center text-sm text-text-muted">
            Žiadne výsledky
          </li>
        )}
      </ul>
    </div>
  );
}

function CustomRefinementList({ attribute }: { attribute: string }) {
  const { items, refine } = useRefinementList({ attribute, limit: 100 });

  if (items.length === 0) {
    return (
      <p className="text-sm text-text-muted py-2">Najprv vyberte značku</p>
    );
  }

  return (
    <ul className="space-y-1">
      {[...items]
        .sort((a, b) => b.count - a.count)
        .map((item) => {
          const checkboxId = toFieldId(`${attribute}-filter`, item.value);
          return (
            <li key={item.value}>
              <label
                htmlFor={checkboxId}
                className="flex items-center gap-3 py-1.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  id={checkboxId}
                  name={`${attribute}-filter`}
                  checked={item.isRefined}
                  onChange={() => refine(item.value)}
                  className="w-4 h-4 rounded border-2 border-border-strong text-accent focus:ring-accent focus:ring-offset-0 transition-colors"
                />
                <span
                  className={cn(
                    "text-sm flex-1 truncate transition-colors",
                    item.isRefined
                      ? "text-text-primary font-medium"
                      : "text-text-secondary group-hover:text-text-primary",
                  )}
                >
                  {item.label}
                </span>
                <span className="text-xs text-text-muted tabular-nums">
                  {item.count}
                </span>
              </label>
            </li>
          );
        })}
    </ul>
  );
}
