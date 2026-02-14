"use client";

import { useState, useMemo, useEffect, ReactNode } from "react";
import {
  RefinementList,
  RangeInput,
  CurrentRefinements,
  ToggleRefinement,
  useRefinementList,
  useClearRefinements,
} from "react-instantsearch";
import { useTranslations } from "next-intl";
import { getSearchClient, CARS_INDEX } from "@/lib/algolia";
import { cn } from "@/utils/cn";
import { ChevronIcon, SearchIcon } from "@/components/ui/Icons";

export function FilterSidebar() {
  const t = useTranslations("filters");
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBodyType = useTranslations("bodyType");
  const { canRefine: hasActiveFilters, refine: clearAll } =
    useClearRefinements();

  return (
    <div className="space-y-1">
      {/* Active Filters */}
      <ActiveFiltersSection
        hasActiveFilters={hasActiveFilters}
        clearAll={clearAll}
        t={t}
      />

      {/* Filter Sections */}
      <CollapsibleFilterSection title="Značka" defaultOpen>
        <AllBrandsRefinementList />
      </CollapsibleFilterSection>

      <CollapsibleFilterSection title="Model">
        <CustomRefinementList attribute="model" />
      </CollapsibleFilterSection>

      <CollapsibleFilterSection title="Lokalita">
        <CustomRefinementList attribute="location_city" />
      </CollapsibleFilterSection>

      <CollapsibleFilterSection title="Cena" defaultOpen>
        <PriceRangeInput attribute="price_eur" />
      </CollapsibleFilterSection>

      <CollapsibleFilterSection title="Rok výroby">
        <CustomRangeInput attribute="year" />
      </CollapsibleFilterSection>

       <CollapsibleFilterSection title="Palivo">
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
       </CollapsibleFilterSection>

       <CollapsibleFilterSection title="Prevodovka">
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
       </CollapsibleFilterSection>

       <CollapsibleFilterSection title="Karoséria">
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
       </CollapsibleFilterSection>

      <CollapsibleFilterSection title="Ostatné">
        <div className="space-y-3">
          <CustomToggle attribute="has_service_book" label="Servisná knižka" />
          <CustomToggle attribute="not_crashed" label="Nehavarované" />
          <CustomToggle attribute="is_bought_in_sk" label="Kúpené v SR" />
        </div>
      </CollapsibleFilterSection>
    </div>
  );
}

function ActiveFiltersSection({
  hasActiveFilters,
  clearAll,
  t,
}: {
  hasActiveFilters: boolean;
  clearAll: () => void;
  t: ReturnType<typeof useTranslations<"filters">>;
}) {
  if (!hasActiveFilters) return null;

  return (
    <div className="pb-4 mb-4 border-b border-border-subtle">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Aktívne filtre
        </span>
        <button
          onClick={() => clearAll()}
          className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          {t("clearAll")}
        </button>
      </div>
      <CurrentRefinements
        classNames={{
          root: "flex flex-wrap gap-2",
          item: "contents",
          label: "hidden",
          category:
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/10 border border-accent/20 rounded-lg text-xs font-medium text-accent",
          delete: "ml-1 hover:text-accent-hover transition-colors",
        }}
      />
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

function CollapsibleFilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left group"
      >
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        <ChevronIcon
          className={cn(
            "w-4 h-4 text-text-tertiary transition-transform duration-200 group-hover:text-text-secondary",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[500px] pb-4 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function PriceRangeInput({ attribute }: { attribute: string }) {
  return (
    <div className="space-y-3">
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
        translations={{ separatorElementText: "—", submitButtonText: "OK" }}
      />
      {/* Quick price buttons */}
      <div className="flex flex-wrap gap-1.5">
        {[5000, 10000, 20000, 50000].map((price) => (
          <button
            key={price}
            type="button"
            className="px-2.5 py-1 text-xs font-medium text-text-secondary bg-background border border-border-subtle rounded-md hover:border-accent hover:text-accent transition-colors"
          >
            do {(price / 1000).toFixed(0)}k €
          </button>
        ))}
      </div>
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
        input:
          "w-full px-3 py-2.5 bg-background border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all",
        separator: "text-text-muted font-medium",
        submit:
          "px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors shadow-sm",
      }}
      translations={{ separatorElementText: "—", submitButtonText: "OK" }}
    />
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
  });
  const [allBrands, setAllBrands] = useState<
    { value: string; count: number }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBrands = async () => {
      const client = getSearchClient();
      if (!client) return;
      const res = (await client.search([
        {
          indexName: CARS_INDEX,
          params: { facets: ["brand"], hitsPerPage: 0 },
        },
      ])) as { results: { facets?: Record<string, Record<string, number>> }[] };
      const brandFacets = res.results?.[0]?.facets?.brand || {};
      setAllBrands(
        Object.entries(brandFacets)
          .map(([value, count]) => ({ value, count: count as number }))
          .sort((a, b) => b.count - a.count),
      );
    };
    fetchBrands();
  }, []);

  const mergedItems = useMemo(() => {
    const refined = new Set(
      currentItems.filter((i) => i.isRefined).map((i) => i.value),
    );
    return allBrands
      .map((b) => ({
        value: b.value,
        label: b.value,
        isRefined: refined.has(b.value),
        count: b.count,
      }))
      .filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [allBrands, currentItems, searchQuery]);

  return (
    <div className="space-y-3">
      {/* Search input for brands */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hľadať značku..."
          className="w-full pl-9 pr-3 py-2 bg-background border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
      </div>
      <ul className="space-y-1 max-h-52 overflow-y-auto scrollbar-thin">
        {mergedItems.map((item) => (
          <li key={item.value}>
            <label className="flex items-center gap-3 py-1.5 cursor-pointer group">
              <input
                type="checkbox"
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
        ))}
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
    <ul className="space-y-1 max-h-52 overflow-y-auto scrollbar-thin">
      {items
        .sort((a, b) => b.count - a.count)
        .map((item) => (
          <li key={item.value}>
            <label className="flex items-center gap-3 py-1.5 cursor-pointer group">
              <input
                type="checkbox"
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
        ))}
    </ul>
  );
}
