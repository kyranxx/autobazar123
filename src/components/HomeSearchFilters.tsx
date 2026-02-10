"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { searchWithFilters } from "@/lib/algolia/search";
import { cn } from "@/utils/cn";
import CustomSelect from "@/components/ui/CustomSelect";
import { SearchIcon, ChevronDownIcon } from "@/components/ui/Icons";

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
  const [hasRedirected, setHasRedirected] = useState(false);

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

      if (selectedBrand) {
        setModels(result.facets.models);
      } else {
        setModels([]);
      }

      if (query.length >= 3 && result.count > 0 && !hasRedirected) {
        setHasRedirected(true);
        window.location.href = `/vysledky?q=${encodeURIComponent(query)}`;
      }
    } catch (error) {
      console.error("Search error:", error);
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
    hasRedirected,
  ]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 150);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    setSelectedModel("");
  }, [selectedBrand]);

  useEffect(() => {
    if (query.length === 0) {
      setHasRedirected(false);
    }
  }, [query]);

  const handleSearch = () => {
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
    window.location.href = `/vysledky${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const hasFilters =
    selectedBrand ||
    selectedModel ||
    priceFrom ||
    priceTo ||
    yearFrom ||
    yearTo ||
    selectedFuel ||
    selectedTransmission;

  return (
    <div className="space-y-5">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tSearch("placeholder")}
          className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-base"
        />
      </div>

      {/* Brand & Model */}
      <div className="grid grid-cols-2 gap-3">
        <MiniSelect
          value={selectedBrand}
          onChange={setSelectedBrand}
          options={brands}
          placeholder="Značka"
          isLoading={isLoading && brands.length === 0}
        />
        <MiniSelect
          value={selectedModel}
          onChange={setSelectedModel}
          options={models}
          placeholder="Model"
          disabled={!selectedBrand}
          isLoading={isLoading && selectedBrand !== "" && models.length === 0}
        />
      </div>

      {/* Price Range */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="number"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            placeholder="Cena od"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
          />
        </div>
        <span className="text-text-tertiary text-sm font-medium">–</span>
        <div className="flex-1 relative">
          <input
            type="number"
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            placeholder="do"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
          />
        </div>
        <span className="text-text-secondary text-sm font-semibold">€</span>
      </div>

      {/* More Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors group"
      >
        <span>Viac filtrov</span>
        <ChevronDownIcon
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            showAdvanced && "rotate-180",
          )}
        />
      </button>

      {/* Advanced Filters */}
      <div
        className={cn(
          "grid grid-cols-2 gap-3 overflow-hidden transition-all duration-300 ease-out",
          showAdvanced ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <MiniSelect
          value={selectedFuel}
          onChange={setSelectedFuel}
          options={fuels}
          placeholder="Palivo"
        />
        <MiniSelect
          value={selectedTransmission}
          onChange={setSelectedTransmission}
          options={transmissions}
          placeholder="Prevodovka"
        />
        <input
          type="number"
          value={yearFrom}
          onChange={(e) => setYearFrom(e.target.value)}
          placeholder="Rok od"
          className="h-11 px-4 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
        />
        <input
          type="number"
          value={yearTo}
          onChange={(e) => setYearTo(e.target.value)}
          placeholder="Rok do"
          className="h-11 px-4 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow text-sm"
        />
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isLoading}
        className="btn-primary w-full h-12 sm:h-14 text-base font-semibold rounded-xl shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin" />
        ) : (
          <>
            <SearchIcon className="w-5 h-5" />
            <span>
              {tSearch("search")}
              {resultCount > 0 && (
                <span className="ml-1.5 opacity-90">
                  ({resultCount.toLocaleString()})
                </span>
              )}
            </span>
          </>
        )}
      </button>

      {/* Active filters indicator */}
      {hasFilters && !isLoading && (
        <p className="text-center text-xs text-text-tertiary">
          {resultCount.toLocaleString()} vozidiel zodpovedá vášmu výberu
        </p>
      )}
    </div>
  );
}

function MiniSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  isLoading,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FacetItem[];
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="h-11 rounded-xl bg-background-secondary animate-pulse border border-border" />
    );
  }

  const selectOptions = options.map((opt) => ({
    value: opt.value,
    label: opt.value,
    count: opt.count,
  }));

  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={selectOptions}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
