"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
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

function RefinementToggleButton({
  item,
  prefix,
  onToggle,
  label,
}: {
  item: { value: string; isRefined: boolean; count: number };
  prefix: string;
  onToggle: () => void;
  label: string;
}) {
  const controlId = toFieldId(prefix, item.value);

  return (
    <button
      type="button"
      id={controlId}
      aria-pressed={item.isRefined}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
        item.isRefined ? "bg-accent/8" : "hover:bg-background-tertiary",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
          item.isRefined
            ? "border-accent bg-accent text-white"
            : "border-border-strong bg-background",
        )}
        aria-hidden="true"
      >
        {item.isRefined ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm transition-colors",
          item.isRefined ? "font-medium text-text-primary" : "text-text-secondary",
        )}
      >
        {label}
      </span>
      <span className="shrink-0 text-xs text-text-muted tabular-nums">{item.count}</span>
    </button>
  );
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
        <CustomRefinementList attribute="model" emptyLabel="Najprv vyberte značku" />
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
        <CustomRefinementList
          attribute="fuel"
          labelFormatter={(value) =>
            tFuel(value.toLowerCase() as Parameters<typeof tFuel>[0]) || value
          }
        />
      </FilterSection>

      <FilterSection title="Prevodovka">
        <CustomRefinementList
          attribute="transmission"
          labelFormatter={(value) =>
            tTransmission(value.toLowerCase() as Parameters<typeof tTransmission>[0]) ||
            value
          }
        />
      </FilterSection>

      <FilterSection title="Karoséria">
        <CustomRefinementList
          attribute="body_style"
          labelFormatter={(value) =>
            tBodyType(value.toLowerCase() as Parameters<typeof tBodyType>[0]) || value
          }
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
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          id="brand-filter-search"
          name="brand-filter-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Hľadať značku..."
          className="w-full rounded-lg border border-border-subtle bg-background py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
      </div>
      <div className="max-h-72 overflow-y-auto pr-1">
        <ul className="space-y-1">
          {mergedItems.map((item) => (
            <li key={item.value}>
              <RefinementToggleButton
                item={item}
                prefix="brand-filter"
                label={item.label}
                onToggle={() => refine(item.value)}
              />
            </li>
          ))}
          {mergedItems.length === 0 ? (
            <li className="py-3 text-center text-sm text-text-muted">Žiadne výsledky</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function CustomRefinementList({
  attribute,
  labelFormatter,
  emptyLabel = "Žiadne výsledky",
}: {
  attribute: string;
  labelFormatter?: (value: string) => string;
  emptyLabel?: string;
}) {
  const { items, refine } = useRefinementList({
    attribute,
    limit: 100,
    sortBy: ["count:desc", "name:asc"],
  });

  if (items.length === 0) {
    return <p className="py-2 text-sm text-text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="max-h-64 overflow-y-auto pr-1">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.value}>
            <RefinementToggleButton
              item={item}
              prefix={`${attribute}-filter`}
              label={labelFormatter ? labelFormatter(item.label) : item.label}
              onToggle={() => refine(item.value)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
