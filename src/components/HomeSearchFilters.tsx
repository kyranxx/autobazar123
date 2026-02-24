"use client";

import { useCallback, useEffect, useMemo, useReducer, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { searchWithFilters } from "@/lib/algolia/search";
import { cn } from "@/utils/cn";
import { SearchIcon, ChevronDownIcon } from "@/components/ui/Icons";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

interface FacetItem {
  value: string;
  count: number;
}

interface HomeSearchFiltersState {
  query: string;
  selectedBrand: string;
  selectedModel: string;
  priceFrom: string;
  priceTo: string;
  showAdvanced: boolean;
  selectedFuel: string;
  selectedTransmission: string;
  yearFrom: string;
  yearTo: string;
  brands: FacetItem[];
  models: FacetItem[];
  fuels: FacetItem[];
  transmissions: FacetItem[];
  resultCount: number;
  isLoading: boolean;
}

type FilterFieldKey =
  | "query"
  | "selectedModel"
  | "priceFrom"
  | "priceTo"
  | "selectedFuel"
  | "selectedTransmission"
  | "yearFrom"
  | "yearTo";

type HomeSearchFiltersAction =
  | { type: "setField"; field: FilterFieldKey; value: string }
  | { type: "setBrand"; value: string }
  | { type: "setShowAdvanced"; value: boolean }
  | { type: "setLoading"; value: boolean }
  | {
      type: "setSearchResult";
      value: {
        count: number;
        brands: FacetItem[];
        fuels: FacetItem[];
        transmissions: FacetItem[];
        models: FacetItem[];
      };
    }
  | { type: "setResultCount"; value: number }
  | { type: "resetForm" };

const initialState: HomeSearchFiltersState = {
  query: "",
  selectedBrand: "",
  selectedModel: "",
  priceFrom: "",
  priceTo: "",
  showAdvanced: false,
  selectedFuel: "",
  selectedTransmission: "",
  yearFrom: "",
  yearTo: "",
  brands: [],
  models: [],
  fuels: [],
  transmissions: [],
  resultCount: 0,
  isLoading: true,
};

const quickIntentPresets = [
  {
    id: "budget-city",
    label: "Mestske do 12k",
    values: {
      selectedTransmission: "manual",
      priceTo: "12000",
      yearFrom: "2015",
    },
  },
  {
    id: "family-suv",
    label: "Rodinne SUV",
    values: {
      selectedFuel: "hybrid",
      selectedTransmission: "automatic",
      priceTo: "35000",
    },
  },
  {
    id: "long-trip",
    label: "Dialnicne diesel",
    values: {
      selectedFuel: "diesel",
      selectedTransmission: "automatic",
      yearFrom: "2018",
    },
  },
];

function homeSearchFiltersReducer(
  state: HomeSearchFiltersState,
  action: HomeSearchFiltersAction,
): HomeSearchFiltersState {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setBrand":
      return {
        ...state,
        selectedBrand: action.value,
        selectedModel: "",
      };
    case "setShowAdvanced":
      return { ...state, showAdvanced: action.value };
    case "setLoading":
      return { ...state, isLoading: action.value };
    case "setSearchResult":
      return {
        ...state,
        resultCount: action.value.count,
        brands: action.value.brands,
        fuels: action.value.fuels,
        transmissions: action.value.transmissions,
        models: state.selectedBrand ? action.value.models : [],
      };
    case "setResultCount":
      return { ...state, resultCount: action.value };
    case "resetForm":
      return {
        ...state,
        query: "",
        selectedBrand: "",
        selectedModel: "",
        priceFrom: "",
        priceTo: "",
        yearFrom: "",
        yearTo: "",
        selectedFuel: "",
        selectedTransmission: "",
        showAdvanced: false,
      };
    default:
      return state;
  }
}

function subscribeToHydration() {
  return () => {};
}

export default function HomeSearchFilters() {
  const tSearch = useTranslations("search");
  const router = useRouter();
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [state, dispatch] = useReducer(homeSearchFiltersReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: "setLoading", value: true });
    try {
      const result = await searchWithFilters({
        query: state.query,
        brand: state.selectedBrand || undefined,
        model: state.selectedModel || undefined,
        fuel: state.selectedFuel || undefined,
        transmission: state.selectedTransmission || undefined,
        priceFrom: state.priceFrom ? Number(state.priceFrom) : undefined,
        priceTo: state.priceTo ? Number(state.priceTo) : undefined,
        yearFrom: state.yearFrom ? Number(state.yearFrom) : undefined,
        yearTo: state.yearTo ? Number(state.yearTo) : undefined,
      });

      dispatch({
        type: "setSearchResult",
        value: {
          count: result.count,
          brands: result.facets.brands,
          fuels: result.facets.fuels,
          transmissions: result.facets.transmissions,
          models: result.facets.models,
        },
      });
    } catch {
      dispatch({ type: "setResultCount", value: 0 });
    } finally {
      dispatch({ type: "setLoading", value: false });
    }
  }, [
    state.query,
    state.selectedBrand,
    state.selectedModel,
    state.selectedFuel,
    state.selectedTransmission,
    state.priceFrom,
    state.priceTo,
    state.yearFrom,
    state.yearTo,
  ]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 220);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (state.selectedBrand) params.set("brand", state.selectedBrand);
    if (state.selectedModel) params.set("model", state.selectedModel);
    if (state.priceFrom) params.set("priceFrom", state.priceFrom);
    if (state.priceTo) params.set("priceTo", state.priceTo);
    if (state.yearFrom) params.set("yearFrom", state.yearFrom);
    if (state.yearTo) params.set("yearTo", state.yearTo);
    if (state.selectedFuel) params.set("fuel", state.selectedFuel);
    if (state.selectedTransmission) params.set("transmission", state.selectedTransmission);

    const queryString = params.toString();
    router.push(`/vysledky${queryString ? `?${queryString}` : ""}`);
  }, [
    state.query,
    state.selectedBrand,
    state.selectedModel,
    state.priceFrom,
    state.priceTo,
    state.yearFrom,
    state.yearTo,
    state.selectedFuel,
    state.selectedTransmission,
    router,
  ]);

  const hasFilters =
    state.query ||
    state.selectedBrand ||
    state.selectedModel ||
    state.priceFrom ||
    state.priceTo ||
    state.yearFrom ||
    state.yearTo ||
    state.selectedFuel ||
    state.selectedTransmission;

  const activeFilters = useMemo(() => {
    const chips: Array<{
      key: string;
      label: string;
      onClear: () => void;
    }> = [];

    if (state.query) {
      chips.push({
        key: "query",
        label: `Dopyt: ${state.query}`,
        onClear: () => dispatch({ type: "setField", field: "query", value: "" }),
      });
    }
    if (state.selectedBrand) {
      chips.push({
        key: "brand",
        label: `Znacka: ${state.selectedBrand}`,
        onClear: () => dispatch({ type: "setBrand", value: "" }),
      });
    }
    if (state.selectedModel) {
      chips.push({
        key: "model",
        label: `Model: ${state.selectedModel}`,
        onClear: () => dispatch({ type: "setField", field: "selectedModel", value: "" }),
      });
    }
    if (state.priceFrom || state.priceTo) {
      chips.push({
        key: "price",
        label: `Cena: ${state.priceFrom || "0"} - ${state.priceTo || "bez limitu"} EUR`,
        onClear: () => {
          dispatch({ type: "setField", field: "priceFrom", value: "" });
          dispatch({ type: "setField", field: "priceTo", value: "" });
        },
      });
    }
    if (state.selectedFuel) {
      chips.push({
        key: "fuel",
        label: `Palivo: ${state.selectedFuel}`,
        onClear: () => dispatch({ type: "setField", field: "selectedFuel", value: "" }),
      });
    }
    if (state.selectedTransmission) {
      chips.push({
        key: "transmission",
        label: `Prevodovka: ${state.selectedTransmission}`,
        onClear: () =>
          dispatch({ type: "setField", field: "selectedTransmission", value: "" }),
      });
    }

    return chips;
  }, [
    state.priceFrom,
    state.priceTo,
    state.query,
    state.selectedBrand,
    state.selectedFuel,
    state.selectedModel,
    state.selectedTransmission,
  ]);

  const applyQuickIntent = useCallback(
    (preset: (typeof quickIntentPresets)[number]) => {
      dispatch({ type: "setField", field: "selectedFuel", value: preset.values.selectedFuel || "" });
      dispatch({
        type: "setField",
        field: "selectedTransmission",
        value: preset.values.selectedTransmission || "",
      });
      dispatch({ type: "setField", field: "priceTo", value: preset.values.priceTo || "" });
      dispatch({ type: "setField", field: "yearFrom", value: preset.values.yearFrom || "" });
      dispatch({ type: "setField", field: "yearTo", value: "" });
      dispatch({ type: "setBrand", value: "" });
      dispatch({ type: "setField", field: "selectedModel", value: "" });
      dispatch({ type: "setField", field: "query", value: "" });
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          value={state.query}
          onChange={(e) => dispatch({ type: "setField", field: "query", value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder={tSearch("placeholder")}
          className="h-12 rounded-xl border-zinc-300 bg-white pl-12 pr-4 text-base sm:h-14"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniSelect
          value={state.selectedBrand}
          onChange={(value) => dispatch({ type: "setBrand", value })}
          options={state.brands}
          name="home-brand"
          placeholder="Znacka"
          isHydrated={isHydrated}
          isLoading={state.isLoading && state.brands.length === 0}
        />
        <MiniSelect
          value={state.selectedModel}
          onChange={(value) => dispatch({ type: "setField", field: "selectedModel", value })}
          options={state.models}
          name="home-model"
          placeholder="Model"
          isHydrated={isHydrated}
          disabled={!state.selectedBrand}
          isLoading={state.isLoading && state.selectedBrand !== "" && state.models.length === 0}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 sm:gap-3">
        <Input
          type="number"
          value={state.priceFrom}
          onChange={(e) =>
            dispatch({ type: "setField", field: "priceFrom", value: e.target.value })
          }
          placeholder="Cena od"
          className="h-11 rounded-xl border-zinc-300 bg-white"
        />
        <span className="text-center text-sm font-semibold text-zinc-500">-</span>
        <Input
          type="number"
          value={state.priceTo}
          onChange={(e) =>
            dispatch({ type: "setField", field: "priceTo", value: e.target.value })
          }
          placeholder="Cena do"
          className="h-11 rounded-xl border-zinc-300 bg-white"
        />
        <span className="text-sm font-semibold text-zinc-600">EUR</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => dispatch({ type: "setShowAdvanced", value: !state.showAdvanced })}
        className="h-auto justify-start gap-2 px-0 text-sm font-medium text-zinc-600 hover:bg-transparent hover:text-zinc-900"
      >
        Viac filtrov
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            state.showAdvanced && "rotate-180",
          )}
        />
      </Button>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Rychle scenare
        </p>
        <div className="flex flex-wrap gap-2">
          {quickIntentPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyQuickIntent(preset)}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3 overflow-hidden transition-all duration-300 ease-out sm:grid-cols-2",
          state.showAdvanced ? "max-h-56 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <MiniSelect
          value={state.selectedFuel}
          onChange={(value) => dispatch({ type: "setField", field: "selectedFuel", value })}
          options={state.fuels}
          name="home-fuel"
          placeholder="Palivo"
          isHydrated={isHydrated}
        />
        <MiniSelect
          value={state.selectedTransmission}
          onChange={(value) =>
            dispatch({ type: "setField", field: "selectedTransmission", value })
          }
          options={state.transmissions}
          name="home-transmission"
          placeholder="Prevodovka"
          isHydrated={isHydrated}
        />
        <Input
          type="number"
          value={state.yearFrom}
          onChange={(e) => dispatch({ type: "setField", field: "yearFrom", value: e.target.value })}
          placeholder="Rok od"
          className="h-11 rounded-xl border-zinc-300 bg-white"
        />
        <Input
          type="number"
          value={state.yearTo}
          onChange={(e) => dispatch({ type: "setField", field: "yearTo", value: e.target.value })}
          placeholder="Rok do"
          className="h-11 rounded-xl border-zinc-300 bg-white"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={handleSearch}
          disabled={state.isLoading}
          className="h-12 w-full rounded-xl bg-zinc-950 text-base font-semibold text-white hover:bg-zinc-800 sm:h-14"
        >
          {state.isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              Aktualizujem ponuky...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <SearchIcon className="h-5 w-5" />
              {tSearch("search")}
              {state.resultCount > 0 && (
                <span className="opacity-80">({state.resultCount.toLocaleString("sk-SK")})</span>
              )}
            </span>
          )}
        </Button>

        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ type: "resetForm" })}
            className="h-12 rounded-xl border-zinc-300 px-4 text-sm font-semibold sm:h-14"
          >
            Vymazat
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Aktivne filtre
          </p>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClear}
                className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
              >
                {chip.label} x
              </button>
            ))}
          </div>
        </div>
      )}

      {!state.isLoading && (
        <p className="text-center text-xs text-zinc-500">
          {state.resultCount.toLocaleString("sk-SK")} vozidiel zodpoveda aktualnemu vyberu
        </p>
      )}
    </div>
  );
}

function MiniSelect({
  value,
  onChange,
  options,
  name,
  placeholder,
  disabled,
  isHydrated,
  isLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FacetItem[];
  name?: string;
  placeholder: string;
  disabled?: boolean;
  isHydrated: boolean;
  isLoading?: boolean;
}) {
  if (!isHydrated || isLoading) {
    return <Skeleton className="h-11 rounded-xl border border-zinc-300 bg-zinc-100" />;
  }

  const selectValue = value || "__select_placeholder__";

  return (
    <Select
      value={selectValue}
      name={name}
      onValueChange={(nextValue) =>
        onChange(nextValue === "__select_placeholder__" ? "" : nextValue)
      }
      disabled={disabled}
    >
      <SelectTrigger className="h-11 rounded-xl border-zinc-300 bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__select_placeholder__">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex w-full items-center justify-between gap-2">
              <span className="truncate">{option.value}</span>
              <span className="shrink-0 text-xs opacity-60">({option.count})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
