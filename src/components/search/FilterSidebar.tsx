"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ToggleRefinement,
  useClearRefinements,
  useCurrentRefinements,
  useRange,
  useRefinementList,
  useStats,
  useToggleRefinement,
} from "react-instantsearch";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { HOME_BRANDS, HOME_MODELS } from "@/components/home/theme";
import {
  CarIcon,
  CityCarIcon,
  ChevronDownIcon,
  EstateCarIcon,
  SearchIcon,
  SportCarIcon,
  SuvIcon,
  VanIcon,
  XIcon,
} from "@/components/ui/Icons";
import { BRANDS } from "@/config/cars";

type RefinementOption = {
  value: string;
  label: string;
  count: number;
  isRefined: boolean;
};

const ADVANCED_FILTER_ATTRIBUTES = new Set([
  "fuel",
  "transmission",
  "body_style",
  "has_service_book",
  "not_crashed",
  "is_bought_in_sk",
]);

const BODY_STYLE_TABS = [
  { key: "all", value: "", icon: CarIcon },
  { key: "hatchback", value: "hatchback", icon: CityCarIcon },
  { key: "wagon", value: "wagon", icon: EstateCarIcon },
  { key: "suv", value: "suv", icon: SuvIcon },
  { key: "coupe", value: "coupe", icon: SportCarIcon },
  { key: "van", value: "van", icon: VanIcon },
] as const;

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

function getKnownModelsForBrand(brand: string): string[] {
  const normalizedBrand = normalizeComparableText(brand);
  const directBrandModels =
    Object.entries(HOME_MODELS).find(
      ([brandName]) => normalizeComparableText(brandName) === normalizedBrand,
    )?.[1] ?? [];

  if (directBrandModels.length > 0) {
    return directBrandModels;
  }

  return HOME_BRANDS.includes(brand as (typeof HOME_BRANDS)[number])
    ? HOME_MODELS[brand as keyof typeof HOME_MODELS] ?? []
    : [];
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
        "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
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
  const tFilters = useTranslations("filters");
  const tHomeSearch = useTranslations("homeSearch");
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBodyType = useTranslations("bodyType");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { items: activeRefinementGroups } = useCurrentRefinements();
  const { canRefine: canClearFilters, refine: clearFilters } = useClearRefinements();

  const formatFilterTitle = useMemo(
    () => (attribute: string) => {
      switch (attribute) {
        case "brand":
          return tFilters("brand");
        case "model":
          return tFilters("model");
        case "location_city":
          return tHomeSearch("locationOption");
        case "price_eur":
          return tFilters("priceTitle");
        case "year":
          return tFilters("yearTitle");
        case "fuel":
          return tFilters("fuelTitle");
        case "transmission":
          return tFilters("transmissionTitle");
        case "body_style":
          return tFilters("bodyTypeTitle");
        case "has_service_book":
          return tFilters("serviceBook");
        case "not_crashed":
          return tFilters("notCrashed");
        case "is_bought_in_sk":
          return tFilters("boughtInSK");
        default:
          return attribute;
      }
    },
    [tFilters, tHomeSearch],
  );

  const formatFilterValue = useMemo(
    () => (attribute: string, label: string) => {
      const normalizedLabel = label.trim();

      if (normalizedLabel.toLowerCase() === "true") {
        return formatFilterTitle(attribute);
      }

      switch (attribute) {
        case "fuel":
          return (
            tFuel(normalizedLabel.toLowerCase() as Parameters<typeof tFuel>[0]) ||
            normalizedLabel
          );
        case "transmission":
          return (
            tTransmission(
              normalizedLabel.toLowerCase() as Parameters<typeof tTransmission>[0],
            ) || normalizedLabel
          );
        case "body_style":
          return (
            tBodyType(normalizedLabel.toLowerCase() as Parameters<typeof tBodyType>[0]) ||
            normalizedLabel
          );
        default:
          return normalizedLabel;
      }
    },
    [formatFilterTitle, tBodyType, tFuel, tTransmission],
  );

  const activeBrandLabels = useMemo(() => {
    return (
      activeRefinementGroups
        .find((group) => group.attribute === "brand")
        ?.refinements.map((refinement) => refinement.label)
        .filter((label) => label.trim().length > 0) ?? []
    );
  }, [activeRefinementGroups]);

  const totalActiveFilters = useMemo(
    () =>
      activeRefinementGroups.reduce(
        (count, group) => count + group.refinements.length,
        0,
      ),
    [activeRefinementGroups],
  );

  const activeAdvancedFilters = useMemo(
    () =>
      activeRefinementGroups.reduce((count, group) => {
        if (!ADVANCED_FILTER_ATTRIBUTES.has(group.attribute)) {
          return count;
        }
        return count + group.refinements.length;
      }, 0),
    [activeRefinementGroups],
  );

  const activeFilterPills = useMemo(() => {
    return activeRefinementGroups.flatMap((group) =>
      group.refinements.map((refinement, index) => {
        const baseLabel = formatFilterValue(group.attribute, refinement.label);
        const titleLabel = formatFilterTitle(group.attribute);
        const needsTitlePrefix = !["brand", "model", "location_city"].includes(
          group.attribute,
        );
        const shouldPrefix = needsTitlePrefix && baseLabel !== titleLabel;

        return {
          key: `${group.attribute}-${index}-${refinement.label}`,
          label: shouldPrefix ? `${titleLabel}: ${baseLabel}` : baseLabel,
        };
      }),
    );
  }, [activeRefinementGroups, formatFilterTitle, formatFilterValue]);

  return (
    <div className="space-y-4">
      <ResultsCountCta
        totalActiveFilters={totalActiveFilters}
        canClearFilters={canClearFilters}
        clearFilters={clearFilters}
        activeFilterPills={activeFilterPills}
      />

      <BodyStyleQuickTabs />

      <PopularShortcutFilters />

      {activeBrandLabels.length > 0 ? (
        <SelectedBrandCards selectedBrandLabels={activeBrandLabels} />
      ) : null}

      <FilterSection title={tFilters("brand")} collapsible defaultOpen>
        <AllBrandsRefinementList selectedBrandLabels={activeBrandLabels} />
      </FilterSection>

      <FilterSection title={tFilters("model")} collapsible defaultOpen={false}>
        <CustomRefinementList attribute="model" emptyLabel={tHomeSearch("selectBrandFirst")} />
      </FilterSection>

      <FilterSection title={tHomeSearch("locationOption")} collapsible defaultOpen={false}>
        <CustomRefinementList attribute="location_city" />
      </FilterSection>

      <FilterSection title={tFilters("priceTitle")} collapsible defaultOpen>
        <PriceRangeInput attribute="price_eur" />
      </FilterSection>

      <FilterSection title={tFilters("yearTitle")} collapsible defaultOpen={false}>
        <CustomRangeInput attribute="year" />
      </FilterSection>

      <section className="rounded-xl border border-border-subtle bg-background p-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          aria-expanded={showAdvanced}
          className="flex min-h-11 w-full items-center justify-between rounded-lg border border-border-subtle bg-background-secondary px-3 py-2 text-left text-sm font-semibold text-text-primary transition-colors hover:border-border-strong"
        >
          <span>{showAdvanced ? tHomeSearch("toggleAdvancedHide") : tHomeSearch("toggleAdvancedShow")}</span>
          {activeAdvancedFilters > 0 ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
              {activeAdvancedFilters}
            </span>
          ) : null}
        </button>

        <p className="mt-2 text-xs text-text-secondary">
          {tHomeSearch("advancedSectionHint")}
        </p>

        <div
          className={cn(
            "grid gap-4 overflow-hidden transition-all",
            showAdvanced ? "mt-4 max-h-[1200px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <FilterSection title={tFilters("fuelTitle")}>
            <CustomRefinementList
              attribute="fuel"
              labelFormatter={(value) =>
                tFuel(value.toLowerCase() as Parameters<typeof tFuel>[0]) || value
              }
            />
          </FilterSection>

          <FilterSection title={tFilters("transmissionTitle")}>
            <CustomRefinementList
              attribute="transmission"
              labelFormatter={(value) =>
                tTransmission(value.toLowerCase() as Parameters<typeof tTransmission>[0]) || value
              }
            />
          </FilterSection>

          <FilterSection title={tFilters("bodyTypeTitle")}>
            <CustomRefinementList
              attribute="body_style"
              labelFormatter={(value) =>
                tBodyType(value.toLowerCase() as Parameters<typeof tBodyType>[0]) || value
              }
            />
          </FilterSection>

          <FilterSection title={tFilters("other")}>
            <div className="space-y-3">
              <CustomToggle attribute="has_service_book" label={tFilters("serviceBook")} />
              <CustomToggle attribute="not_crashed" label={tFilters("notCrashed")} />
              <CustomToggle attribute="is_bought_in_sk" label={tFilters("boughtInSK")} />
            </div>
          </FilterSection>
        </div>
      </section>
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
      <section className="rounded-xl border border-border-subtle bg-background p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">{title}</h3>
        {children}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-background p-4">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex min-h-10 w-full items-center justify-between rounded-lg px-0.5 text-left text-sm font-semibold text-text-primary"
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 text-text-muted transition-transform",
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
  activeFilterPills,
}: {
  totalActiveFilters: number;
  canClearFilters: boolean;
  clearFilters: () => void;
  activeFilterPills: Array<{ key: string; label: string }>;
}) {
  const tFilters = useTranslations("filters");
  const tSearchPage = useTranslations("searchPage");
  const locale = useLocale();
  const { nbHits } = useStats();

  return (
    <section className="z-20 rounded-xl border border-border-subtle bg-background p-4 shadow-sm lg:sticky lg:top-3">
      <p className="text-sm font-semibold text-text-primary">
        {tFilters("quickSearchHint")}
      </p>
      <button
        type="button"
        onClick={() =>
          document.getElementById("results-grid")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
        className="mt-3 flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-center text-sm font-black text-white shadow-sm transition-colors hover:bg-accent-hover"
      >
        {tSearchPage("showResultsCount", { count: nbHits.toLocaleString(locale) })}
      </button>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-text-secondary">
          {tSearchPage("activeFiltersLabel")}{" "}
          <span className="font-semibold text-text-primary">{totalActiveFilters}</span>
        </p>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!canClearFilters}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
            canClearFilters
              ? "border-accent/30 bg-accent/10 text-accent hover:border-accent hover:bg-accent/15"
              : "cursor-not-allowed border-border-subtle bg-background text-text-muted",
          )}
        >
          {tFilters("clearAll")}
        </button>
      </div>
      {activeFilterPills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeFilterPills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex min-h-8 items-center rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent"
            >
              {pill.label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BodyStyleQuickTabs() {
  const tBodyType = useTranslations("bodyType");
  const tHomeSearch = useTranslations("homeSearch");
  const { items, refine } = useRefinementList({
    attribute: "body_style",
    limit: 20,
    sortBy: ["count:desc", "name:asc"],
  });
  const bodyStyleMap = useMemo(
    () =>
      new Map(
        items.map((item) => [normalizeComparableText(item.value), item] as const),
      ),
    [items],
  );
  const hasActiveBodyStyle = items.some((item) => item.isRefined);

  return (
    <section className="rounded-xl border border-border-subtle bg-background p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">
        {tHomeSearch("categoryTabsLabel")}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {BODY_STYLE_TABS.map((tab) => {
          const item = tab.value
            ? bodyStyleMap.get(normalizeComparableText(tab.value))
            : null;
          const isActive = tab.value === "" ? !hasActiveBodyStyle : Boolean(item?.isRefined);
          const isDisabled = tab.value !== "" && !item?.isRefined && (item?.count ?? 0) === 0;
          const Icon = tab.icon;
          const label =
            tab.key === "all"
              ? tHomeSearch("categoryAll")
              : tBodyType(tab.key as Parameters<typeof tBodyType>[0]);

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.value === "") {
                  items.filter((candidate) => candidate.isRefined).forEach((candidate) => {
                    refine(candidate.value);
                  });
                  return;
                }

                refine(tab.value);
              }}
              disabled={isDisabled}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                isActive
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-border-subtle bg-background-secondary text-text-secondary hover:border-accent/35 hover:bg-background",
                isDisabled && "cursor-not-allowed opacity-45 hover:border-border-subtle hover:bg-background-secondary",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                  isActive ? "bg-accent/15 text-accent" : "bg-background text-text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                {tab.value !== "" ? (
                  <span className="block text-xs text-text-muted">{item?.count ?? 0}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PopularShortcutFilters() {
  const tFilters = useTranslations("filters");
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");

  return (
    <section className="rounded-xl border border-border-subtle bg-background p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">
        {tFilters("popularFiltersTitle")}
      </h3>
      <div className="flex flex-wrap gap-2">
        <FacetShortcutButton
          attribute="transmission"
          value="automatic"
          label={tTransmission("automatic")}
        />
        <FacetShortcutButton attribute="fuel" value="diesel" label={tFuel("diesel")} />
        <FacetShortcutButton attribute="fuel" value="electric" label={tFuel("electric")} />
        <ToggleShortcutButton
          attribute="has_service_book"
          label={tFilters("serviceBook")}
        />
        <ToggleShortcutButton attribute="not_crashed" label={tFilters("notCrashed")} />
        <ToggleShortcutButton attribute="is_bought_in_sk" label={tFilters("boughtInSK")} />
      </div>
    </section>
  );
}

function SelectedBrandCards({
  selectedBrandLabels,
}: {
  selectedBrandLabels: string[];
}) {
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
    <section className="rounded-xl border border-border-subtle bg-background p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">
        {tFilters("selectedBrandsTitle")}
      </h3>
      <div className="space-y-3">
        {selectedBrandLabels.map((brand) => {
          const knownModels = getKnownModelsForBrand(brand);
          const selectedKnownModel =
            knownModels.find(
              (model) => normalizedModelMap.get(normalizeComparableText(model))?.isRefined,
            ) ?? "";

          return (
            <article
              key={brand}
              className="rounded-2xl border border-accent/15 bg-accent/5 p-3"
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-text-primary/80 text-white"
                  aria-label={tHomeSearch("clearSelectedBrand")}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {knownModels.length > 0 ? (
                <>
                  <select
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
                    className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-text-primary"
                  >
                    <option value="">{tFilters("modelPickerPlaceholder")}</option>
                    {knownModels.map((modelName) => {
                      const matchingItem = normalizedModelMap.get(
                        normalizeComparableText(modelName),
                      );

                      return (
                        <option key={modelName} value={modelName}>
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
                          key={modelName}
                          type="button"
                          onClick={() => refineModel(modelName)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
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

function FacetShortcutButton({
  attribute,
  value,
  label,
}: {
  attribute: string;
  value: string;
  label: string;
}) {
  const { items, refine } = useRefinementList({
    attribute,
    limit: 20,
    sortBy: ["count:desc", "name:asc"],
  });
  const matchingItem =
    items.find(
      (item) => normalizeComparableText(item.value) === normalizeComparableText(value),
    ) ?? null;
  const isActive = Boolean(matchingItem?.isRefined);

  return (
    <button
      type="button"
      onClick={() => refine(value)}
      disabled={!matchingItem?.isRefined && (matchingItem?.count ?? 0) === 0}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        isActive
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border-subtle bg-background-secondary text-text-secondary hover:border-accent hover:text-accent",
        !matchingItem?.isRefined &&
          (matchingItem?.count ?? 0) === 0 &&
          "cursor-not-allowed opacity-45 hover:border-border-subtle hover:text-text-secondary",
      )}
    >
      {label}
    </button>
  );
}

function ToggleShortcutButton({
  attribute,
  label,
}: {
  attribute: string;
  label: string;
}) {
  const { value, refine } = useToggleRefinement({
    attribute,
    on: true,
  });

  return (
    <button
      type="button"
      onClick={() => refine({ isRefined: !value.isRefined })}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        value.isRefined
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border-subtle bg-background-secondary text-text-secondary hover:border-accent hover:text-accent",
      )}
    >
      {label}
    </button>
  );
}

export function PriceRangeInput({ attribute }: { attribute: string }) {
  const { canRefine, range, refine, start } = useRange({ attribute });
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
    <div className="space-y-3">
      <form
        key={`${attribute}:${minDefaultValue}:${maxDefaultValue}`}
        onSubmit={submitRange}
        className="flex items-center gap-2"
      >
        <input
          id={`${attribute}-range-min`}
          name={`${attribute}-range-min`}
          type="number"
          inputMode="numeric"
          defaultValue={minDefaultValue}
          placeholder="Min"
          className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
        <span className="text-text-muted font-medium">-</span>
        <input
          id={`${attribute}-range-max`}
          name={`${attribute}-range-max`}
          type="number"
          inputMode="numeric"
          defaultValue={maxDefaultValue}
          placeholder="Max"
          className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors shadow-sm"
        >
          OK
        </button>
      </form>
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
            aria-pressed={typeof start[1] === "number" && Math.round(start[1]) === price}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              !canRefine
                ? "cursor-not-allowed border-border-subtle bg-background text-text-muted"
                : typeof start[1] === "number" && Math.round(start[1]) === price
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-subtle bg-background text-text-secondary hover:border-accent hover:text-accent",
            )}
          >
            {"<= "} {(price / 1000).toFixed(0)}k EUR
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomRangeInput({ attribute }: { attribute: string }) {
  const { refine, start } = useRange({ attribute });
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
    <form
      key={`${attribute}:${minDefaultValue}:${maxDefaultValue}`}
      onSubmit={submitRange}
      className="flex items-center gap-2"
    >
      <input
        id={`${attribute}-range-min`}
        name={`${attribute}-range-min`}
        type="number"
        inputMode="numeric"
        defaultValue={minDefaultValue}
        placeholder="Min"
        className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
      />
      <span className="text-text-muted font-medium">-</span>
      <input
        id={`${attribute}-range-max`}
        name={`${attribute}-range-max`}
        type="number"
        inputMode="numeric"
        defaultValue={maxDefaultValue}
        placeholder="Max"
        className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
      />
      <button
        type="submit"
        className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors shadow-sm"
      >
        OK
      </button>
    </form>
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
        label: "flex min-h-10 items-center gap-3 w-full cursor-pointer group py-1",
        checkbox:
          "w-4 h-4 rounded border-2 border-border-strong text-accent focus:ring-accent focus:ring-offset-0 transition-colors",
        labelText:
          "text-sm text-text-secondary group-hover:text-text-primary transition-colors",
      }}
    />
  );
}

function AllBrandsRefinementList({
  selectedBrandLabels,
}: {
  selectedBrandLabels: string[];
}) {
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
      BRANDS.map((brand) => ({
        value: brand.name,
        label: brand.name,
        count: 0,
        isRefined: false,
      })),
    [],
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
  const featuredBrandItems = useMemo(
    () => visibleItems.slice(0, 6),
    [visibleItems],
  );

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
          {tHomeSearch("popularBrandsLabel")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {featuredBrandItems.map((item) => (
            <button
              key={`featured-${item.value}`}
              type="button"
              onClick={() => refine(item.value)}
              className={cn(
                "rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors",
                item.isRefined
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border-subtle bg-background-secondary text-text-secondary hover:border-accent hover:text-accent",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          id="brand-filter-search"
          name="brand-filter-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={tSearch("brand")}
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
            <li className="py-3 text-center text-sm text-text-muted">{tHomeSearch("noResults")}</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function CustomRefinementList({
  attribute,
  labelFormatter,
  emptyLabel,
}: {
  attribute: string;
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
