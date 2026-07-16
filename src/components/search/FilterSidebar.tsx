"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ToggleRefinement,
  useClearRefinements,
  useCurrentRefinements,
  useRange,
  useRefinementList,
  useStats,
} from "react-instantsearch";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import {
  ChevronDownIcon,
  SearchIcon,
  XIcon,
} from "@/components/ui/Icons";
import { usePublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/client";
import { getResultCountMessageKey } from "@/lib/search/result-count-copy";

type RefinementOption = {
  value: string;
  label: string;
  count: number;
  isRefined: boolean;
};

function toFieldId(prefix: string, value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${prefix}-${slug || "item"}`;
}

function normalizeRefinementKey(value: string): string {
  return value.trim().toLocaleLowerCase("sk");
}

function normalizeComparableText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("sk")
    .replace(/[^a-z0-9]+/g, "");
}

function getKnownModelsForBrand(
  brand: string,
  brandNames: string[],
  modelsByBrandName: Record<string, string[]>,
): string[] {
  const normalizedBrand = normalizeComparableText(brand);
  const directBrandModels =
    Object.entries(modelsByBrandName).find(
      ([brandName]) => normalizeComparableText(brandName) === normalizedBrand,
    )?.[1] ?? [];

  if (directBrandModels.length > 0) {
    return directBrandModels;
  }

  return brandNames.includes(brand) ? modelsByBrandName[brand] ?? [] : [];
}

function sortRefinementOptions(left: RefinementOption, right: RefinementOption): number {
  if (left.isRefined !== right.isRefined) {
    return left.isRefined ? -1 : 1;
  }

  if (left.count !== right.count) {
    return right.count - left.count;
  }

  return left.label.localeCompare(right.label, "sk");
}

export function mergePersistentRefinementOptions(
  persistedOptions: RefinementOption[],
  liveOptions: RefinementOption[],
  selectedLabels: string[] = [],
): RefinementOption[] {
  const mergedByKey = new Map<string, RefinementOption>();

  for (const option of persistedOptions) {
    mergedByKey.set(normalizeRefinementKey(option.value), option);
  }

  for (const option of liveOptions) {
    mergedByKey.set(normalizeRefinementKey(option.value), option);
  }

  for (const label of selectedLabels) {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      continue;
    }

    const key = normalizeRefinementKey(trimmedLabel);
    const existing = mergedByKey.get(key);
    mergedByKey.set(key, {
      value: existing?.value ?? trimmedLabel,
      label: existing?.label ?? trimmedLabel,
      count: existing?.count ?? 0,
      isRefined: true,
    });
  }

  return Array.from(mergedByKey.values()).sort(sortRefinementOptions);
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
        "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors",
        item.isRefined ? "bg-primary/5" : "hover:bg-background-tertiary",
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
          item.isRefined
            ? "border-primary bg-primary text-white"
            : "border-border-strong bg-background",
        )}
        aria-hidden="true"
      >
        {item.isRefined ? <span className="size-1.5 rounded-full bg-white" /> : null}
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

export function FilterSidebar({ idScope = "filters" }: { idScope?: string } = {}) {
  const tFilters = useTranslations("filters");
  const tHomeSearch = useTranslations("homeSearch");
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBodyType = useTranslations("bodyType");
  const { items: activeRefinementGroups } = useCurrentRefinements();
  const { canRefine: canClearFilters, refine: clearFilters } = useClearRefinements();

  const activeBrandLabels = useMemo(() => {
    const brandGroup = activeRefinementGroups.find((group) => group.attribute === "brand");
    if (!brandGroup) {
      return [];
    }

    return brandGroup.refinements.reduce<string[]>((labels, refinement) => {
      if (refinement.label.trim().length > 0) {
        labels.push(refinement.label);
      }
      return labels;
    }, []);
  }, [activeRefinementGroups]);

  const totalActiveFilters = useMemo(
    () =>
      activeRefinementGroups.reduce(
        (count, group) => count + group.refinements.length,
        0,
      ),
    [activeRefinementGroups],
  );

  return (
    <div className="space-y-4">
      <ResultsCountCta
        totalActiveFilters={totalActiveFilters}
        canClearFilters={canClearFilters}
        clearFilters={clearFilters}
      />

      {activeBrandLabels.length > 0 ? (
        <SelectedBrandCards selectedBrandLabels={activeBrandLabels} />
      ) : null}

      <FilterSection title={tFilters("brand")}>
        <AllBrandsRefinementList
          idScope={idScope}
          selectedBrandLabels={activeBrandLabels}
        />
      </FilterSection>

      <FilterSection title={tFilters("model")}>
        {activeBrandLabels.length > 0 ? (
          <CustomRefinementList
            attribute="model"
            idScope={idScope}
            emptyLabel={tHomeSearch("selectBrandFirst")}
          />
        ) : (
          <p className="py-1 text-sm text-text-muted">{tHomeSearch("selectBrandFirst")}</p>
        )}
      </FilterSection>

      <FilterSection title={tFilters("fuelTitle")} collapsible>
          <CustomRefinementList
            attribute="fuel"
            idScope={idScope}
            labelFormatter={(value) =>
              tFuel(value.toLowerCase() as Parameters<typeof tFuel>[0]) || value
            }
          />
      </FilterSection>

      <FilterSection title={tFilters("priceTitle")}>
        <PriceRangeInput attribute="price_eur" idScope={idScope} />
      </FilterSection>

      <FilterSection title={tFilters("mileageTitle")}>
        <CustomRangeInput attribute="mileage_km" idScope={idScope} />
      </FilterSection>

      <FilterSection title={tFilters("yearTitle")}>
        <CustomRangeInput attribute="year" idScope={idScope} />
      </FilterSection>

      <FilterSection title={tHomeSearch("locationOption")} collapsible>
        <CustomRefinementList attribute="location_city" idScope={idScope} />
      </FilterSection>

      <FilterSection title={tFilters("transmissionTitle")} collapsible>
          <CustomRefinementList
            attribute="transmission"
            idScope={idScope}
            labelFormatter={(value) =>
              tTransmission(value.toLowerCase() as Parameters<typeof tTransmission>[0]) || value
            }
          />
      </FilterSection>

      <FilterSection title={tFilters("bodyTypeTitle")} collapsible>
          <CustomRefinementList
            attribute="body_style"
            idScope={idScope}
            labelFormatter={(value) =>
              tBodyType(value.toLowerCase() as Parameters<typeof tBodyType>[0]) || value
            }
        />
      </FilterSection>

      <FilterSection title={tFilters("other")} collapsible defaultOpen={false}>
        <div className="space-y-3">
          <CustomToggle attribute="has_service_book" label={tFilters("serviceBook")} />
          <CustomToggle attribute="not_crashed" label={tFilters("notCrashed")} />
          <CustomToggle attribute="is_bought_in_sk" label={tFilters("boughtInSK")} />
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen || !collapsible);

  if (!collapsible) {
    return (
      <section className="border-t border-border-subtle pt-4 first:border-t-0 first:pt-0">
        <h3 className="mb-2.5 text-sm font-semibold text-text-primary">{title}</h3>
        {children}
      </section>
    );
  }

  return (
    <section className="border-t border-border-subtle pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex min-h-10 w-full items-center justify-between rounded-lg px-0.5 text-left text-sm font-semibold text-text-primary"
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 text-text-muted transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all",
          isOpen ? "mt-3 max-h-[1400px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {children}
      </div>
    </section>
  );
}

function ResultsCountCta({
  totalActiveFilters,
  canClearFilters,
  clearFilters,
}: {
  totalActiveFilters: number;
  canClearFilters: boolean;
  clearFilters: () => void;
}) {
  const tFilters = useTranslations("filters");
  const tSearchPage = useTranslations("searchPage");
  const locale = useLocale();
  const { nbHits } = useStats();
  const formattedCount = nbHits.toLocaleString(locale);

  return (
    <section className="rounded-xl border border-primary/10 bg-primary/5 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-secondary">
          {formattedCount} {tSearchPage(getResultCountMessageKey(nbHits))} ·{" "}
          <span className="font-semibold text-text-primary">
            {tSearchPage("activeFiltersLabel")} {totalActiveFilters}
          </span>
        </p>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!canClearFilters}
          className={cn(
            "rounded-xl px-3 py-2 text-xs font-black transition-colors",
            canClearFilters
              ? "border border-primary/20 bg-white text-primary hover:border-primary/40 hover:bg-background-muted"
              : "cursor-not-allowed bg-background-secondary text-text-muted",
          )}
        >
          {tFilters("clearAll")}
        </button>
      </div>
    </section>
  );
}

function SelectedBrandCards({
  selectedBrandLabels,
}: {
  selectedBrandLabels: string[];
}) {
  const { brandNames, modelsByBrandName } = usePublicVehicleTaxonomy();
  const tFilters = useTranslations("filters");
  const tHomeSearch = useTranslations("homeSearch");
  const { refine: refineBrand } = useRefinementList({
    attribute: "brand",
    limit: 100,
    sortBy: ["count:desc", "name:asc"],
  });
  const { items: modelItems, refine: refineModel } = useRefinementList({
    attribute: "model",
    limit: 100,
    sortBy: ["count:desc", "name:asc"],
  });
  const normalizedModelMap = useMemo(
    () =>
      new Map(
        modelItems.map((item) => [normalizeComparableText(item.label), item] as const),
      ),
    [modelItems],
  );

  return (
    <section className="rounded-xl border border-primary/10 bg-primary/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">
        {tFilters("selectedBrandsTitle")}
      </h3>
      <div className="space-y-3">
        {selectedBrandLabels.map((brand) => {
          const knownModels = getKnownModelsForBrand(
            brand,
            brandNames,
            modelsByBrandName,
          );
          const selectedKnownModel =
            knownModels.find(
              (model) => normalizedModelMap.get(normalizeComparableText(model))?.isRefined,
            ) ?? "";

          return (
            <article
              key={brand}
              className="rounded-xl border border-accent/15 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                    {tFilters("brand")}
                  </p>
                  <p className="mt-1 text-base font-black text-text-primary">{brand}</p>
                </div>
                <button
                  type="button"
                  onClick={() => refineBrand(brand)}
                  className="market-icon-button flex size-8 min-h-8 min-w-8 items-center justify-center rounded-lg bg-text-primary/80 text-white"
                  aria-label={tHomeSearch("clearSelectedBrand")}
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>

              {knownModels.length > 0 ? (
                <>
                  <select
                    aria-label={tFilters("model")}
                    value={selectedKnownModel}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (selectedKnownModel && selectedKnownModel !== nextValue) {
                        refineModel(selectedKnownModel);
                      }
                      if (nextValue && nextValue !== selectedKnownModel) {
                        refineModel(nextValue);
                      }
                    }}
                    className="market-field mt-3 h-11 w-full px-3 text-sm font-semibold text-text-primary"
                  >
                    <option value="">{tFilters("modelPickerPlaceholder")}</option>
                    {knownModels.map((modelName) => {
                      const matchingItem = normalizedModelMap.get(
                        normalizeComparableText(modelName),
                      );

                      return (
                        <option key={`${brand}-${modelName}`} value={modelName}>
                          {matchingItem ? `${modelName} (${matchingItem.count})` : modelName}
                        </option>
                      );
                    })}
                  </select>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {knownModels.slice(0, 4).map((modelName) => {
                      const matchingItem = normalizedModelMap.get(
                        normalizeComparableText(modelName),
                      );
                      const isActive = Boolean(matchingItem?.isRefined);

                      return (
                        <button
                          key={`${brand}-${modelName}`}
                          type="button"
                          onClick={() => refineModel(modelName)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                            isActive
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-border-subtle bg-white text-text-secondary hover:border-accent hover:text-accent",
                          )}
                        >
                          {modelName}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-text-muted">
                  {tFilters("modelPickerUnavailable")}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RangePresetInput({
  attribute,
  idScope,
}: {
  attribute: string;
  idScope: string;
}) {
  const tFilters = useTranslations("filters");
  const { canRefine, refine, start } = useRange({ attribute });
  const minDefaultValue =
    typeof start[0] === "number" && Number.isFinite(start[0])
      ? String(Math.round(start[0]))
      : "";
  const maxDefaultValue =
    typeof start[1] === "number" && Number.isFinite(start[1])
      ? String(Math.round(start[1]))
      : "";

  const submitRange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawMin = String(formData.get(`${attribute}-range-min`) || "").trim();
    const rawMax = String(formData.get(`${attribute}-range-max`) || "").trim();
    const nextMin = rawMin ? Number.parseInt(rawMin, 10) : undefined;
    const nextMax = rawMax ? Number.parseInt(rawMax, 10) : undefined;

    refine([
      Number.isFinite(nextMin) ? nextMin : undefined,
      Number.isFinite(nextMax) ? nextMax : undefined,
    ]);
  };

  return (
    <div>
      <form
        key={`${attribute}:${minDefaultValue}:${maxDefaultValue}`}
        onSubmit={submitRange}
        className="border-0 bg-transparent p-0"
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            id={`${idScope}-${attribute}-range-min`}
            name={`${attribute}-range-min`}
            type="number"
            inputMode="numeric"
            defaultValue={minDefaultValue}
            placeholder={tFilters("from")}
            className="market-field w-full px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
          />
          <input
            id={`${idScope}-${attribute}-range-max`}
            name={`${attribute}-range-max`}
            type="number"
            inputMode="numeric"
            defaultValue={maxDefaultValue}
            placeholder={tFilters("to")}
            className="market-field w-full px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
          />
        </div>
        <button
          type="submit"
          disabled={!canRefine}
          className="market-action-secondary mt-2 w-full px-4 py-2 text-sm"
        >
          {tFilters("apply")}
        </button>
      </form>
    </div>
  );
}

export function PriceRangeInput({
  attribute,
  idScope = "filters",
}: {
  attribute: string;
  idScope?: string;
}) {
  return <RangePresetInput attribute={attribute} idScope={idScope} />;
}

function CustomRangeInput({
  attribute,
  idScope,
}: {
  attribute: string;
  idScope: string;
}) {
  return <RangePresetInput attribute={attribute} idScope={idScope} />;
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
        label: "flex min-h-10 items-center gap-3 w-full cursor-pointer group py-1",
        checkbox:
          "size-4 rounded border-2 border-border-strong text-primary focus:ring-accent focus:ring-offset-0 transition-colors",
        labelText:
          "text-sm text-text-secondary group-hover:text-text-primary transition-colors",
      }}
    />
  );
}

function AllBrandsRefinementList({
  idScope,
  selectedBrandLabels,
}: {
  idScope: string;
  selectedBrandLabels: string[];
}) {
  const { brandNames } = usePublicVehicleTaxonomy();
  const tSearch = useTranslations("search");
  const tHomeSearch = useTranslations("homeSearch");
  const { items: currentItems, refine } = useRefinementList({
    attribute: "brand",
    limit: 100,
    sortBy: ["count:desc", "name:asc"],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const catalogBrandItems = useMemo<RefinementOption[]>(
    () =>
      brandNames.map((brandName) => ({
        value: brandName,
        label: brandName,
        count: 0,
        isRefined: false,
      })),
    [brandNames],
  );
  const visibleItems = useMemo(
    () =>
      mergePersistentRefinementOptions(
        catalogBrandItems,
        currentItems,
        selectedBrandLabels,
      ),
    [catalogBrandItems, currentItems, selectedBrandLabels],
  );

  const mergedItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return visibleItems;
    }

    return visibleItems.filter((item) =>
      item.label.toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery, visibleItems]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          id={`${idScope}-brand-filter-search`}
          name="brand-filter-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={tSearch("brand")}
          className="market-field w-full py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
      </div>
      <div className="max-h-72 overflow-y-auto pr-1">
        <ul className="space-y-1">
          {mergedItems.map((item) => (
            <li key={item.value}>
              <RefinementToggleButton
                item={item}
                prefix={`${idScope}-brand-filter`}
                label={item.label}
                onToggle={() => refine(item.value)}
              />
            </li>
          ))}
          {mergedItems.length === 0 ? (
            <li className="py-3 text-center text-sm text-text-muted">{tHomeSearch("noResults")}</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function CustomRefinementList({
  attribute,
  idScope,
  labelFormatter,
  emptyLabel,
}: {
  attribute: string;
  idScope: string;
  labelFormatter?: (value: string) => string;
  emptyLabel?: string | null;
}) {
  const tHomeSearch = useTranslations("homeSearch");
  const { items, refine } = useRefinementList({
    attribute,
    limit: 100,
    sortBy: ["count:desc", "name:asc"],
  });

  if (items.length === 0) {
    return (
      <p className="py-2 text-sm text-text-muted">
        {emptyLabel ?? tHomeSearch("noResults")}
      </p>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto pr-1">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.value}>
            <RefinementToggleButton
              item={item}
              prefix={`${idScope}-${attribute}-filter`}
              label={labelFormatter ? labelFormatter(item.label) : item.label}
              onToggle={() => refine(item.value)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
