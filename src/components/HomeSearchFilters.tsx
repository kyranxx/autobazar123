"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
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

export default function HomeSearchFilters() {
  const tSearch = useTranslations("search");

  const [query, setQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState("");
  const [selectedTransmission, setSelectedTransmission] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const [brands, setBrands] = useState<FacetItem[]>([]);
  const [models, setModels] = useState<FacetItem[]>([]);
  const [fuels, setFuels] = useState<FacetItem[]>([]);
  const [transmissions, setTransmissions] = useState<FacetItem[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await searchWithFilters({
        query,
        brand: selectedBrand || undefined,
        model: selectedModel || undefined,
        fuel: selectedFuel || undefined,
        transmission: selectedTransmission || undefined,
        priceFrom: priceFrom ? Number(priceFrom) : undefined,
        priceTo: priceTo ? Number(priceTo) : undefined,
        yearFrom: yearFrom ? Number(yearFrom) : undefined,
        yearTo: yearTo ? Number(yearTo) : undefined,
      });

      setResultCount(result.count);
      setBrands(result.facets.brands);
      setFuels(result.facets.fuels);
      setTransmissions(result.facets.transmissions);
      setModels(selectedBrand ? result.facets.models : []);
    } catch {
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    query,
    selectedBrand,
    selectedModel,
    selectedFuel,
    selectedTransmission,
    priceFrom,
    priceTo,
    yearFrom,
    yearTo,
  ]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 220);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    setSelectedModel("");
  }, [selectedBrand]);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedModel) params.set("model", selectedModel);
    if (priceFrom) params.set("priceFrom", priceFrom);
    if (priceTo) params.set("priceTo", priceTo);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);
    if (selectedFuel) params.set("fuel", selectedFuel);
    if (selectedTransmission) params.set("transmission", selectedTransmission);

    const queryString = params.toString();
    window.location.assign(`/vysledky${queryString ? `?${queryString}` : ""}`);
  }, [
    query,
    selectedBrand,
    selectedModel,
    priceFrom,
    priceTo,
    yearFrom,
    yearTo,
    selectedFuel,
    selectedTransmission,
  ]);

  const handleReset = () => {
    setQuery("");
    setSelectedBrand("");
    setSelectedModel("");
    setPriceFrom("");
    setPriceTo("");
    setYearFrom("");
    setYearTo("");
    setSelectedFuel("");
    setSelectedTransmission("");
    setShowAdvanced(false);
  };

  const hasFilters =
    query ||
    selectedBrand ||
    selectedModel ||
    priceFrom ||
    priceTo ||
    yearFrom ||
    yearTo ||
    selectedFuel ||
    selectedTransmission;

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          value={selectedBrand}
          onChange={setSelectedBrand}
          options={brands}
          name="home-brand"
          placeholder="Značka"
          isLoading={isLoading && brands.length === 0}
        />
        <MiniSelect
          value={selectedModel}
          onChange={setSelectedModel}
          options={models}
          name="home-model"
          placeholder="Model"
          disabled={!selectedBrand}
          isLoading={isLoading && selectedBrand !== "" && models.length === 0}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 sm:gap-3">
        <Input
          type="number"
          value={priceFrom}
          onChange={(e) => setPriceFrom(e.target.value)}
          placeholder="Cena od"
          className="h-11 rounded-xl border-zinc-300 bg-white"
        />
        <span className="text-center text-sm font-semibold text-zinc-500">-</span>
        <Input
          type="number"
          value={priceTo}
          onChange={(e) => setPriceTo(e.target.value)}
          placeholder="Cena do"
          className="h-11 rounded-xl border-zinc-300 bg-white"
        />
        <span className="text-sm font-semibold text-zinc-600">EUR</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setShowAdvanced((prev) => !prev)}
        className="h-auto justify-start gap-2 px-0 text-sm font-medium text-zinc-600 hover:bg-transparent hover:text-zinc-900"
      >
        Viac filtrov
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            showAdvanced && "rotate-180",
          )}
        />
      </Button>

      <div
        className={cn(
          "grid grid-cols-1 gap-3 overflow-hidden transition-all duration-300 ease-out sm:grid-cols-2",
          showAdvanced ? "max-h-56 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <MiniSelect
          value={selectedFuel}
          onChange={setSelectedFuel}
          options={fuels}
          name="home-fuel"
          placeholder="Palivo"
        />
        <MiniSelect
          value={selectedTransmission}
          onChange={setSelectedTransmission}
          options={transmissions}
          name="home-transmission"
          placeholder="Prevodovka"
        />
        <Input
          type="number"
          value={yearFrom}
          onChange={(e) => setYearFrom(e.target.value)}
          placeholder="Rok od"
          className="h-11 rounded-xl border-zinc-300 bg-white"
        />
        <Input
          type="number"
          value={yearTo}
          onChange={(e) => setYearTo(e.target.value)}
          placeholder="Rok do"
          className="h-11 rounded-xl border-zinc-300 bg-white"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          className="h-12 w-full rounded-xl bg-zinc-950 text-base font-semibold text-white hover:bg-zinc-800 sm:h-14"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              Aktualizujem ponuky...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <SearchIcon className="h-5 w-5" />
              {tSearch("search")}
              {resultCount > 0 && (
                <span className="opacity-80">({resultCount.toLocaleString("sk-SK")})</span>
              )}
            </span>
          )}
        </Button>

        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="h-12 rounded-xl border-zinc-300 px-4 text-sm font-semibold sm:h-14"
          >
            Vymazať
          </Button>
        )}
      </div>

      {!isLoading && (
        <p className="text-center text-xs text-zinc-500" suppressHydrationWarning>
          {resultCount.toLocaleString("sk-SK")} vozidiel zodpovedá aktuálnemu výberu
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
  isLoading,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FacetItem[];
  name?: string;
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  if (isLoading) {
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
