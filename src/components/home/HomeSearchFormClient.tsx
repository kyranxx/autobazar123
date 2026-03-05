"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CarIcon,
  SearchIcon,
  SpinnerIcon,
  TagIcon,
} from "@/components/ui/Icons";
import { cn } from "@/utils/cn";
import { HOME_BRANDS, HOME_LOCATIONS, HOME_MODELS } from "@/components/home/theme";

const HOME_MIN_SUGGESTION_LENGTH = 2;

type SuggestionType = "brand" | "model" | "location";

type SuggestionItem = {
  type: SuggestionType;
  value: string;
  count?: number;
};

function normalizeLooseText(value: string): string {
  return value
    .replace(/\u3000/g, " ")
    .replace(/[;,|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIntegerInput(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return "";
  }

  return String(Number.parseInt(digits, 10));
}

function normalizeRangePair(from: string, to: string): [string, string] {
  if (!from || !to) {
    return [from, to];
  }

  const fromNumber = Number.parseInt(from, 10);
  const toNumber = Number.parseInt(to, 10);

  if (Number.isNaN(fromNumber) || Number.isNaN(toNumber)) {
    return [from, to];
  }

  return fromNumber <= toNumber ? [from, to] : [to, from];
}

function getFallbackSuggestions(inputValue: string): SuggestionItem[] {
  const needle = inputValue.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const modelEntries = Object.entries(HOME_MODELS).flatMap(([brand, models]) =>
    models.map((model) => ({ brand, model })),
  );

  const suggestions: SuggestionItem[] = [
    ...HOME_BRANDS.filter((brand) => brand.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((brand) => ({ type: "brand" as const, value: brand })),
    ...modelEntries
      .filter((entry) => entry.model.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((entry) => ({ type: "model" as const, value: entry.model })),
    ...HOME_LOCATIONS.filter((location) => location.toLowerCase().includes(needle))
      .slice(0, 2)
      .map((location) => ({ type: "location" as const, value: location })),
  ];

  return suggestions.filter(
    (item, index) =>
      suggestions.findIndex(
        (candidate) =>
          candidate.type === item.type &&
          candidate.value.toLowerCase() === item.value.toLowerCase(),
      ) === index,
  );
}

function findBrandForModel(modelValue: string): string | null {
  const normalizedModel = modelValue.trim().toLowerCase();

  for (const [brand, models] of Object.entries(HOME_MODELS)) {
    if (models.some((model) => model.toLowerCase() === normalizedModel)) {
      return brand;
    }
  }

  return null;
}

function findEffectiveHomeBrand(
  inputValue: string,
  selectedBrand: string,
): string | null {
  const normalizedInput = inputValue.trim().toLowerCase();

  if (
    selectedBrand &&
    (!normalizedInput ||
      normalizedInput === selectedBrand.toLowerCase() ||
      normalizedInput.startsWith(`${selectedBrand.toLowerCase()} `))
  ) {
    return selectedBrand;
  }

  return (
    HOME_BRANDS.find((candidate) => {
      const normalizedCandidate = candidate.toLowerCase();
      return (
        normalizedInput === normalizedCandidate ||
        normalizedInput.startsWith(`${normalizedCandidate} `)
      );
    }) ?? null
  );
}

function getHomeSuggestions(
  inputValue: string,
  selectedBrand: string,
): SuggestionItem[] {
  const trimmedValue = inputValue.trim();
  const effectiveBrand = findEffectiveHomeBrand(trimmedValue, selectedBrand);

  if (!effectiveBrand) {
    return getFallbackSuggestions(trimmedValue);
  }

  const normalizedBrand = effectiveBrand.toLowerCase();
  const normalizedInput = trimmedValue.toLowerCase();
  const modelNeedle = normalizedInput.startsWith(normalizedBrand)
    ? trimmedValue.slice(effectiveBrand.length).trim().toLowerCase()
    : normalizedInput;
  const modelSuggestions = (HOME_MODELS[effectiveBrand] ?? [])
    .filter((candidate) =>
      modelNeedle ? candidate.toLowerCase().includes(modelNeedle) : true,
    )
    .slice(0, 5)
    .map((value) => ({
      type: "model" as const,
      value,
    }));
  const locationSuggestions = HOME_LOCATIONS.filter((location) =>
    location.toLowerCase().includes(normalizedInput),
  )
    .slice(0, 2)
    .map((value) => ({
      type: "location" as const,
      value,
    }));

  return [...modelSuggestions, ...locationSuggestions];
}

type HomeSearchFormClientProps = {
  className?: string;
};

export default function HomeSearchFormClient({ className }: HomeSearchFormClientProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");
  const [transmission, setTransmission] = useState("");
  const [bodyStyle, setBodyStyle] = useState("");
  const [location, setLocation] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [hasServiceBook, setHasServiceBook] = useState(false);
  const [notCrashed, setNotCrashed] = useState(false);
  const [boughtInSk, setBoughtInSk] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);

  const modelOptions = useMemo(() => HOME_MODELS[brand] ?? [], [brand]);
  const suggestions = useMemo(
    () =>
      q.trim().length < HOME_MIN_SUGGESTION_LENGTH ? [] : getHomeSuggestions(q.trim(), brand),
    [brand, q],
  );
  const activePrimaryFiltersCount = useMemo(() => {
    let count = 0;
    if (q.trim()) count += 1;
    if (brand) count += 1;
    if (model) count += 1;
    if (priceTo) count += 1;
    if (location) count += 1;
    return count;
  }, [brand, location, model, priceTo, q]);
  const activeAdvancedFiltersCount = useMemo(() => {
    let count = 0;
    if (fuel) count += 1;
    if (transmission) count += 1;
    if (bodyStyle) count += 1;
    if (priceFrom) count += 1;
    if (yearFrom) count += 1;
    if (yearTo) count += 1;
    if (hasServiceBook) count += 1;
    if (notCrashed) count += 1;
    if (boughtInSk) count += 1;
    return count;
  }, [
    bodyStyle,
    boughtInSk,
    fuel,
    hasServiceBook,
    notCrashed,
    priceFrom,
    transmission,
    yearFrom,
    yearTo,
  ]);
  const hasAnyFilters = activePrimaryFiltersCount + activeAdvancedFiltersCount > 0;

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearching(true);

    const normalizedQuery = normalizeLooseText(q);
    const normalizedBrand = normalizeLooseText(brand);
    const normalizedModel = normalizeLooseText(model);
    const normalizedLocation = normalizeLooseText(location);
    const [safePriceFrom, safePriceTo] = normalizeRangePair(
      normalizeIntegerInput(priceFrom),
      normalizeIntegerInput(priceTo),
    );
    const [safeYearFrom, safeYearTo] = normalizeRangePair(
      normalizeIntegerInput(yearFrom),
      normalizeIntegerInput(yearTo),
    );
    const params = new URLSearchParams();
    if (normalizedQuery) params.set("q", normalizedQuery);
    if (normalizedBrand) params.set("brand", normalizedBrand);
    if (normalizedModel) params.set("model", normalizedModel);
    if (fuel) params.set("fuel", fuel);
    if (transmission) params.set("transmission", transmission);
    if (bodyStyle) params.set("bodyStyle", bodyStyle);
    if (normalizedLocation) params.set("location", normalizedLocation);
    if (safePriceFrom) params.set("priceFrom", safePriceFrom);
    if (safePriceTo) params.set("priceTo", safePriceTo);
    if (safeYearFrom) params.set("yearFrom", safeYearFrom);
    if (safeYearTo) params.set("yearTo", safeYearTo);
    if (hasServiceBook) params.set("hasServiceBook", "true");
    if (notCrashed) params.set("notCrashed", "true");
    if (boughtInSk) params.set("boughtInSk", "true");

    setShowSuggestions(false);
    router.push(params.toString() ? `/vysledky?${params.toString()}` : "/vysledky");
  };

  const resetAllFilters = () => {
    setQ("");
    setBrand("");
    setModel("");
    setFuel("");
    setTransmission("");
    setBodyStyle("");
    setLocation("");
    setPriceFrom("");
    setPriceTo("");
    setYearFrom("");
    setYearTo("");
    setHasServiceBook(false);
    setNotCrashed(false);
    setBoughtInSk(false);
    setShowAdvanced(false);
    setShowSuggestions(false);
    setHighlightedSuggestionIndex(-1);
    setIsSearching(false);
  };

  const applySuggestion = (suggestion: SuggestionItem) => {
    if (suggestion.type === "brand") {
      const nextValue = `${suggestion.value} `;

      setQ(nextValue);
      setBrand(suggestion.value);
      setModel("");
      setShowSuggestions(true);
      setHighlightedSuggestionIndex(-1);
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return;
    }

    setQ(suggestion.value);
    setShowSuggestions(false);
    setHighlightedSuggestionIndex(-1);

    if (suggestion.type === "model") {
      const matchedBrand = findBrandForModel(suggestion.value);
      if (matchedBrand) {
        setBrand(matchedBrand);
      }
      setModel(suggestion.value);
      return;
    }

    if (suggestion.type === "location") {
      setLocation(suggestion.value);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedSuggestionIndex((currentValue) =>
        currentValue < suggestions.length - 1 ? currentValue + 1 : currentValue,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedSuggestionIndex((currentValue) =>
        currentValue > 0 ? currentValue - 1 : -1,
      );
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedSuggestionIndex(-1);
      return;
    }

    if (event.key === "Enter" && highlightedSuggestionIndex >= 0) {
      event.preventDefault();
      applySuggestion(suggestions[highlightedSuggestionIndex]);
    }
  };

  return (
    <form
      onSubmit={onSearch}
      className={cn(
        "mt-8 w-full max-w-none rounded-[26px] border border-border-strong/80 bg-background-secondary/95 p-4 text-text-primary shadow-xl sm:p-5",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl border border-border-subtle bg-background/80 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          Rychly postup
        </p>
        <ol className="mt-2 grid gap-2 text-xs text-text-secondary sm:grid-cols-3">
          <li className="flex items-center gap-2 rounded-lg bg-background-secondary px-2.5 py-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">
              1
            </span>
            Vyberte znacku alebo model
          </li>
          <li className="flex items-center gap-2 rounded-lg bg-background-secondary px-2.5 py-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">
              2
            </span>
            Doplnt cenu alebo lokalitu
          </li>
          <li className="flex items-center gap-2 rounded-lg bg-background-secondary px-2.5 py-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">
              3
            </span>
            Spustit hladanie
          </li>
        </ol>
        <p className="mt-2 text-xs text-text-muted">
          Aktivne rychle filtre:{" "}
          <span className="font-semibold text-text-primary">{activePrimaryFiltersCount}</span>
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-7 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          ref={searchInputRef}
          id="home-search-q"
          name="q"
          type="text"
          value={q}
          onChange={(event) => {
            const nextValue = event.target.value;
            const nextTrimmedValue = nextValue.trim().toLowerCase();

            if (
              brand &&
              nextTrimmedValue &&
              nextTrimmedValue !== brand.toLowerCase() &&
              !nextTrimmedValue.startsWith(`${brand.toLowerCase()} `)
            ) {
              setBrand("");
              setModel("");
            }

            setQ(nextValue);
            setHighlightedSuggestionIndex(-1);
            if (nextValue.trim().length < HOME_MIN_SUGGESTION_LENGTH) {
              setShowSuggestions(false);
              return;
            }
            setShowSuggestions(true);
          }}
          onFocus={() =>
            setShowSuggestions(
              q.trim().length >= HOME_MIN_SUGGESTION_LENGTH && suggestions.length > 0,
            )
          }
          onBlur={() => {
            window.setTimeout(() => {
              setShowSuggestions(false);
              setHighlightedSuggestionIndex(-1);
            }, 120);
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder="Znacka, model alebo mesto"
          className="h-14 w-full rounded-2xl border-2 border-border-strong bg-background-secondary pl-12 pr-4 text-base font-semibold shadow-sm outline-none focus:border-[var(--home-link)] focus:ring-4 focus:ring-[var(--home-brand-soft)]"
        />

        {showSuggestions && suggestions.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border-subtle bg-background-secondary shadow-xl">
            <ul className="max-h-72 overflow-y-auto py-2">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.type}-${suggestion.value}`}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applySuggestion(suggestion)}
                    onMouseEnter={() => setHighlightedSuggestionIndex(index)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                      highlightedSuggestionIndex === index
                        ? "bg-accent/10"
                        : "hover:bg-background-tertiary",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          suggestion.type === "brand" && "bg-accent/10 text-accent",
                          suggestion.type === "model" && "bg-success/10 text-success",
                          suggestion.type === "location" && "bg-primary/10 text-primary",
                        )}
                      >
                        {suggestion.type === "brand" ? (
                          <CarIcon className="h-4 w-4" />
                        ) : suggestion.type === "model" ? (
                          <TagIcon className="h-4 w-4" />
                        ) : (
                          <SearchIcon className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-text-primary">
                          {suggestion.value}
                        </span>
                        <span className="block text-xs text-text-muted">
                          {suggestion.type === "brand"
                            ? "Znacka"
                            : suggestion.type === "model"
                              ? "Model"
                              : "Lokalita"}
                        </span>
                      </span>
                    </span>
                    {typeof suggestion.count === "number" ? (
                      <span className="text-xs text-text-muted">{suggestion.count}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        <select
          id="home-search-brand"
          name="brand"
          aria-label="Znacka vozidla"
          value={brand}
          onChange={(event) => {
            setBrand(event.target.value);
            setModel("");
          }}
          className="h-12 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Znacka</option>
          {HOME_BRANDS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          id="home-search-model"
          name="model"
          aria-label="Model vozidla"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          disabled={!brand}
          className="h-12 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold disabled:bg-background-muted"
        >
          <option value="">Model</option>
          {modelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          id="home-search-location"
          name="location"
          aria-label="Lokalita predaja"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="h-12 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Lokalita</option>
          {HOME_LOCATIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          id="home-search-price-to"
          name="priceTo"
          aria-label="Maximalna cena"
          value={priceTo}
          onChange={(event) => setPriceTo(event.target.value)}
          className="h-12 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Cena do</option>
          <option value="10000">10 000 EUR</option>
          <option value="20000">20 000 EUR</option>
          <option value="35000">35 000 EUR</option>
          <option value="50000">50 000 EUR</option>
        </select>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[var(--home-link)] bg-[var(--home-brand-soft)] px-6 text-sm font-semibold text-[var(--home-link)] shadow-sm transition-colors hover:bg-background-secondary"
        >
          {showAdvanced ? "Skryt dalsie filtre" : "Zobrazit dalsie filtre"}
        </button>
        {activeAdvancedFiltersCount > 0 ? (
          <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
            {activeAdvancedFiltersCount} aktivne
          </span>
        ) : null}
        {hasAnyFilters ? (
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-strong bg-background px-4 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
          >
            Reset filtrov
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-center text-xs text-text-secondary">
        Pokrocile filtre su volitelne. Zacnite rychlymi filtrami hore.
      </p>

      <div
        className={`grid gap-3 overflow-hidden transition-all sm:grid-cols-2 lg:grid-cols-4 ${showAdvanced ? "mt-4 max-h-[520px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <select
          id="home-search-fuel"
          name="fuel"
          aria-label="Typ paliva"
          value={fuel}
          onChange={(event) => setFuel(event.target.value)}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Palivo</option>
          <option value="petrol">Benzin</option>
          <option value="diesel">Diesel</option>
          <option value="electric">Elektrina</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <select
          id="home-search-transmission"
          name="transmission"
          aria-label="Typ prevodovky"
          value={transmission}
          onChange={(event) => setTransmission(event.target.value)}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Prevodovka</option>
          <option value="manual">Manualna</option>
          <option value="automatic">Automaticka</option>
        </select>
        <select
          id="home-search-body-style"
          name="bodyStyle"
          aria-label="Typ karoserie"
          value={bodyStyle}
          onChange={(event) => setBodyStyle(event.target.value)}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Karoseria</option>
          <option value="hatchback">Hatchback</option>
          <option value="sedan">Sedan</option>
          <option value="wagon">Kombi</option>
          <option value="suv">SUV</option>
          <option value="coupe">Kupe</option>
          <option value="van">Van</option>
        </select>
        <input
          id="home-search-price-from"
          name="priceFrom"
          type="number"
          min="0"
          value={priceFrom}
          onChange={(event) => setPriceFrom(event.target.value)}
          placeholder="Cena od"
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        />
        <input
          id="home-search-year-from"
          name="yearFrom"
          type="number"
          min="1900"
          value={yearFrom}
          onChange={(event) => setYearFrom(event.target.value)}
          placeholder="Rok od"
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        />
        <input
          id="home-search-year-to"
          name="yearTo"
          type="number"
          min="1900"
          value={yearTo}
          onChange={(event) => setYearTo(event.target.value)}
          placeholder="Rok do"
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        />
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-background-muted p-3 text-xs font-semibold text-text-secondary sm:col-span-2 lg:col-span-1">
          <label className="inline-flex items-center gap-2">
            <input
              id="home-search-has-service-book"
              name="hasServiceBook"
              type="checkbox"
              checked={hasServiceBook}
              onChange={(event) => setHasServiceBook(event.target.checked)}
              className="h-4 w-4"
            />
            Servisna knizka
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              id="home-search-not-crashed"
              name="notCrashed"
              type="checkbox"
              checked={notCrashed}
              onChange={(event) => setNotCrashed(event.target.checked)}
              className="h-4 w-4"
            />
            Nehavarovane
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              id="home-search-bought-in-sk"
              name="boughtInSk"
              type="checkbox"
              checked={boughtInSk}
              onChange={(event) => setBoughtInSk(event.target.checked)}
              className="h-4 w-4"
            />
            Kupene v SR
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSearching}
        className={cn(
          "mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--home-cta)] px-5 py-3 text-base font-black text-[var(--home-cta-text)] shadow-lg",
          isSearching && "cursor-not-allowed opacity-80",
        )}
      >
        {isSearching ? (
          <>
            <SpinnerIcon className="h-4 w-4 animate-spin" />
            Hladam auta...
          </>
        ) : (
          "Hladat auta"
        )}
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </form>
  );
}

