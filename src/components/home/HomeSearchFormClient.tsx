"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CarIcon,
  SearchIcon,
  SpinnerIcon,
  TagIcon,
  CheckIcon,
} from "@/components/ui/Icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import type { AlgoliaCarRecord } from "@/lib/algolia";
import { cn } from "@/utils/cn";
import { HOME_BRANDS, HOME_LOCATIONS, HOME_MODELS } from "@/components/home/theme";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

const HOME_MIN_SUGGESTION_LENGTH = 2;
const HOME_REMOTE_SUGGESTION_LIMIT = 8;
const HOME_REMOTE_SUGGESTION_DEBOUNCE_MS = 120;
const HOME_CARS_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX ?? "ads";

let homeAlgoliaModulePromise: Promise<typeof import("@/lib/algolia")> | null = null;

function loadHomeAlgoliaModule() {
  if (!homeAlgoliaModulePromise) {
    homeAlgoliaModulePromise = import("@/lib/algolia");
  }

  return homeAlgoliaModulePromise;
}

const HOME_CATEGORY_TABS = [
  {
    key: "passenger",
    bodyStyle: "",
    iconSrc: "/icons/vehicle-types/tabler/car.svg",
  },
  {
    key: "utility",
    bodyStyle: "van",
    iconSrc: "/icons/vehicle-types/tabler/car-suv.svg",
  },
  {
    key: "cargo",
    bodyStyle: "wagon",
    iconSrc: "/icons/vehicle-types/tabler/truck-loading.svg",
  },
  {
    key: "motorbikes",
    bodyStyle: "coupe",
    iconSrc: "/icons/vehicle-types/tabler/motorbike.svg",
  },
  {
    key: "quads",
    bodyStyle: "suv",
    iconSrc: "/icons/vehicle-types/tabler/car-4wd.svg",
  },
  {
    key: "trailers",
    bodyStyle: "wagon",
    iconSrc: "/icons/vehicle-types/tabler/truck.svg",
  },
  {
    key: "campers",
    bodyStyle: "van",
    iconSrc: "/icons/vehicle-types/tabler/caravan.svg",
  },
  {
    key: "work",
    bodyStyle: "van",
    iconSrc: "/icons/vehicle-types/tabler/tractor.svg",
  },
  {
    key: "buses",
    bodyStyle: "van",
    iconSrc: "/icons/vehicle-types/tabler/bus.svg",
  },
] as const;

function VehicleTypeIcon({ src, className }: { src: string; className?: string }) {
  const maskStyle: CSSProperties = {
    WebkitMaskImage: `url("${src}")`,
    maskImage: `url("${src}")`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={maskStyle}
    />
  );
}

type HomeBrand = (typeof HOME_BRANDS)[number];

const HOME_BRAND_LOGOS: Record<HomeBrand, string> = {
  Audi: "/brand-logos/audi.png",
  BMW: "/brand-logos/bmw.png",
  Ford: "/brand-logos/ford.png",
  Kia: "/brand-logos/kia.png",
  "Mercedes-Benz": "/brand-logos/mercedes-benz.png",
  Nissan: "/brand-logos/nissan.png",
  Skoda: "/brand-logos/skoda.png",
  Toyota: "/brand-logos/toyota.png",
  Volvo: "/brand-logos/volvo.png",
  Volkswagen: "/brand-logos/volkswagen.png",
};

type SuggestionType = "brand" | "model" | "location";

type SuggestionItem = {
  type: SuggestionType;
  value: string;
  count?: number;
  brand?: string;
};

type HomeSearchFilters = {
  q: string;
  brands: string[];
  model: string;
  fuel: string;
  transmission: string;
  bodyStyle: string;
  location: string;
  priceFrom: string;
  priceTo: string;
  yearFrom: string;
  yearTo: string;
  hasServiceBook: boolean;
  notCrashed: boolean;
  boughtInSk: boolean;
};

function renderBrandLogo(brand: HomeBrand): ReactNode {
  const src = HOME_BRAND_LOGOS[brand];
  if (!src) {
    return <CarIcon className="h-5 w-5" />;
  }

  return (
    <span className="flex h-8 w-full items-center justify-center">
      <Image
        src={src}
        alt={`${brand} logo`}
        width={180}
        height={56}
        sizes="180px"
        className="h-6 w-auto max-w-full object-contain object-center"
      />
    </span>
  );
}

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

function buildHomeSearchParams(filters: HomeSearchFilters): URLSearchParams {
  const normalizedQuery = normalizeLooseText(filters.q);
  const normalizedBrands = Array.from(
    new Set(
      filters.brands
        .map((brand) => normalizeLooseText(brand))
        .filter((brand) => brand.length > 0),
    ),
  );
  const normalizedModel = normalizeLooseText(filters.model);
  const normalizedLocation = normalizeLooseText(filters.location);
  const [safePriceFrom, safePriceTo] = normalizeRangePair(
    normalizeIntegerInput(filters.priceFrom),
    normalizeIntegerInput(filters.priceTo),
  );
  const [safeYearFrom, safeYearTo] = normalizeRangePair(
    normalizeIntegerInput(filters.yearFrom),
    normalizeIntegerInput(filters.yearTo),
  );
  const params = new URLSearchParams();

  if (normalizedQuery) params.set("q", normalizedQuery);
  for (const normalizedBrand of normalizedBrands) {
    params.append("brand", normalizedBrand);
  }
  if (normalizedModel) params.set("model", normalizedModel);
  if (filters.fuel) params.set("fuel", filters.fuel);
  if (filters.transmission) params.set("transmission", filters.transmission);
  if (filters.bodyStyle) params.set("bodyStyle", filters.bodyStyle);
  if (normalizedLocation) params.set("location", normalizedLocation);
  if (safePriceFrom) params.set("priceFrom", safePriceFrom);
  if (safePriceTo) params.set("priceTo", safePriceTo);
  if (safeYearFrom) params.set("yearFrom", safeYearFrom);
  if (safeYearTo) params.set("yearTo", safeYearTo);
  if (filters.hasServiceBook) params.set("hasServiceBook", "true");
  if (filters.notCrashed) params.set("notCrashed", "true");
  if (filters.boughtInSk) params.set("boughtInSk", "true");

  return params;
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
      .map((entry) => ({
        type: "model" as const,
        value: entry.model,
        brand: entry.brand,
      })),
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

function dedupeSuggestions(suggestions: SuggestionItem[]): SuggestionItem[] {
  return suggestions.filter(
    (item, index) =>
      suggestions.findIndex((candidate) => {
        if (candidate.type !== item.type) {
          return false;
        }

        if (candidate.value.toLowerCase() !== item.value.toLowerCase()) {
          return false;
        }

        return (candidate.brand ?? "").toLowerCase() === (item.brand ?? "").toLowerCase();
      }) === index,
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
      brand: effectiveBrand,
    }));
  const locationSuggestions = HOME_LOCATIONS.filter((location) =>
    location.toLowerCase().includes(normalizedInput),
  )
    .slice(0, 2)
    .map((value) => ({
      type: "location" as const,
      value,
    }));

  return dedupeSuggestions([...modelSuggestions, ...locationSuggestions]);
}

async function getAlgoliaHomeSuggestions(
  inputValue: string,
  selectedBrand: string,
): Promise<SuggestionItem[]> {
  const trimmedValue = inputValue.trim();
  if (trimmedValue.length < HOME_MIN_SUGGESTION_LENGTH) {
    return [];
  }

  const effectiveBrand = findEffectiveHomeBrand(trimmedValue, selectedBrand);
  const normalizedInput = trimmedValue.toLowerCase();
  const modelNeedle = effectiveBrand
    && normalizedInput.startsWith(`${effectiveBrand.toLowerCase()} `)
    ? trimmedValue.slice(effectiveBrand.length).trim().toLowerCase()
    : normalizedInput;

  try {
    const { searchSingleIndex } = await loadHomeAlgoliaModule();
    const searchResult = await searchSingleIndex<AlgoliaCarRecord>({
      indexName: HOME_CARS_INDEX,
      searchParams: {
        query: trimmedValue,
        hitsPerPage: HOME_REMOTE_SUGGESTION_LIMIT * 2,
        facets: ["brand", "model", "location_city"],
        maxValuesPerFacet: HOME_REMOTE_SUGGESTION_LIMIT,
        ...(effectiveBrand
          ? {
              facetFilters: [`brand:${effectiveBrand}`],
            }
          : {}),
      },
    });

    const brandFacet = searchResult.facets?.brand ?? {};
    const modelFacet = searchResult.facets?.model ?? {};
    const locationFacet = searchResult.facets?.location_city ?? {};
    const hits = (searchResult.hits ?? []) as AlgoliaCarRecord[];

    const brandSuggestions: SuggestionItem[] = !effectiveBrand
      ? Object.entries(brandFacet)
          .filter(([value]) => value.toLowerCase().includes(normalizedInput))
          .sort((left, right) => right[1] - left[1])
          .slice(0, 3)
          .map(([value, count]) => ({
            type: "brand" as const,
            value,
            count,
          }))
      : [];

    const hitModels = hits
      .map((hit) => ({
        brand: typeof hit.brand === "string" ? hit.brand : "",
        model: typeof hit.model === "string" ? hit.model : "",
      }))
      .filter((entry) => entry.brand.length > 0 && entry.model.length > 0)
      .filter((entry) =>
        effectiveBrand
          ? entry.brand.toLowerCase() === effectiveBrand.toLowerCase()
          : true,
      )
      .filter((entry) =>
        modelNeedle ? entry.model.toLowerCase().includes(modelNeedle) : true,
      );

    const modelSuggestions: SuggestionItem[] = hitModels
      .slice(0, 5)
      .map((entry) => ({
        type: "model" as const,
        value: entry.model,
        brand: entry.brand,
        count: modelFacet[entry.model],
      }));

    const locationSuggestions: SuggestionItem[] = Object.entries(locationFacet)
      .filter(([value]) => value.toLowerCase().includes(normalizedInput))
      .sort((left, right) => right[1] - left[1])
      .slice(0, 2)
      .map(([value, count]) => ({
        type: "location" as const,
        value,
        count,
      }));

    return dedupeSuggestions([
      ...brandSuggestions,
      ...modelSuggestions,
      ...locationSuggestions,
    ]).slice(0, HOME_REMOTE_SUGGESTION_LIMIT);
  } catch {
    return [];
  }
}

type HomeSearchFormClientProps = {
  className?: string;
};

export default function HomeSearchFormClient({ className }: HomeSearchFormClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("homeSearch");
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBodyType = useTranslations("bodyType");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
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
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<
    (typeof HOME_CATEGORY_TABS)[number]["key"] | ""
  >("");
  const [hasOpenedTooltip, setHasOpenedTooltip] = useState(false);
  const suggestionRequestCounterRef = useRef(0);

  const modelBrand = useMemo(() => {
    if (brand) {
      return brand;
    }
    return selectedBrands.length === 1 ? selectedBrands[0] : "";
  }, [brand, selectedBrands]);
  const modelOptions = useMemo(() => HOME_MODELS[modelBrand] ?? [], [modelBrand]);
  const activePrimaryFiltersCount = useMemo(() => {
    let count = 0;
    if (q.trim()) count += 1;
    if (selectedBrands.length > 0 || brand) count += 1;
    if (model) count += 1;
    if (priceTo) count += 1;
    if (location) count += 1;
    return count;
  }, [brand, location, model, priceTo, q, selectedBrands]);
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
  const homeSearchQuery = useMemo(
    () =>
      buildHomeSearchParams({
        q,
        brands: Array.from(new Set([brand, ...selectedBrands])).filter(Boolean),
        model,
        fuel,
        transmission,
        bodyStyle,
        location,
        priceFrom,
        priceTo,
        yearFrom,
        yearTo,
        hasServiceBook,
        notCrashed,
        boughtInSk,
      }).toString(),
    [
      bodyStyle,
      boughtInSk,
      brand,
      fuel,
      hasServiceBook,
      location,
      model,
      notCrashed,
      priceFrom,
      priceTo,
      q,
      transmission,
      yearFrom,
      yearTo,
      selectedBrands,
    ],
  );

  useEffect(() => {
    const trimmedQuery = q.trim();
    if (trimmedQuery.length < HOME_MIN_SUGGESTION_LENGTH) {
      suggestionRequestCounterRef.current += 1;
      setSuggestions([]);
      setHighlightedSuggestionIndex(-1);
      return;
    }

    const requestId = suggestionRequestCounterRef.current + 1;
    suggestionRequestCounterRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      const algoliaSuggestions = await getAlgoliaHomeSuggestions(trimmedQuery, brand);
      if (suggestionRequestCounterRef.current !== requestId) {
        return;
      }

      if (algoliaSuggestions.length > 0) {
        setSuggestions(algoliaSuggestions);
        return;
      }

      setSuggestions(getHomeSuggestions(trimmedQuery, brand));
    }, HOME_REMOTE_SUGGESTION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [brand, q]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsPreviewLoading(true);

      try {
        const response = await fetch(
          homeSearchQuery ? `/api/search/count?${homeSearchQuery}` : "/api/search/count",
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("preview-failed");
        }

        const payload = (await response.json()) as { count?: number };
        setPreviewCount(typeof payload.count === "number" ? payload.count : null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setPreviewCount(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPreviewLoading(false);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [homeSearchQuery]);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearching(true);
    setShowSuggestions(false);
    trackAnalyticsEvent("search_query_submitted", {
      query: q.trim() || "browse",
      filtersCount: [
        selectedBrands.length > 0,
        Boolean(model),
        Boolean(location),
        Boolean(fuel),
        Boolean(transmission),
        Boolean(bodyStyle),
        Boolean(priceFrom || priceTo),
        Boolean(yearFrom || yearTo),
        hasServiceBook,
        notCrashed,
        boughtInSk,
      ].filter(Boolean).length,
      resultCount: typeof previewCount === "number" ? previewCount : undefined,
      locale: locale as "sk" | "en" | "hu",
    });
    router.push(homeSearchQuery ? `/vysledky?${homeSearchQuery}` : "/vysledky");
  };

  const resetAllFilters = () => {
    setQ("");
    setBrand("");
    setSelectedBrands([]);
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
    setActiveVehicleCategory("");
  };

  const applySuggestion = (suggestion: SuggestionItem) => {
    if (suggestion.type === "brand") {
      const nextValue = `${suggestion.value} `;

      setQ(nextValue);
      setBrand(suggestion.value);
      setSelectedBrands((currentValue) =>
        currentValue.includes(suggestion.value)
          ? currentValue
          : [...currentValue, suggestion.value],
      );
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
      const matchedBrand = suggestion.brand ?? findBrandForModel(suggestion.value);
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
    <TooltipProvider delayDuration={260} skipDelayDuration={1400}>
      <form
        onSubmit={onSearch}
        autoComplete="off"
        className={cn(
          "mt-8 w-full max-w-none rounded-[26px] border border-[var(--home-cta)]/16 bg-background-secondary/95 p-4 text-text-primary shadow-xl sm:p-5",
          className,
        )}
      >
      <div className="relative">
        <SearchIcon className="absolute left-4 top-7 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          ref={searchInputRef}
          id="home-search-q"
          name="q"
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
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
          placeholder={t("searchPlaceholder")}
          className="h-14 w-full rounded-2xl border-2 border-border-strong bg-background-secondary pl-12 pr-4 text-base font-semibold shadow-sm outline-none focus:border-[var(--home-cta)] focus:ring-4 focus:ring-[var(--home-accent-soft)]"
        />

        {showSuggestions && suggestions.length > 0 ? (
          <div
            className="home-popover-surface home-subtle-mask absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border-subtle bg-background-secondary shadow-xl"
            style={{ transformOrigin: "left top" }}
          >
            <ul className="max-h-72 overflow-y-auto py-2">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.type}-${suggestion.brand ?? ""}-${suggestion.value}`}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applySuggestion(suggestion)}
                    onMouseEnter={() => setHighlightedSuggestionIndex(index)}
                    className={cn(
                      "home-hover-surface flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                      highlightedSuggestionIndex === index && "bg-accent/10",
                    )}
                    style={
                      highlightedSuggestionIndex === index
                        ? undefined
                        : ({
                            "--home-hover-bg": "var(--color-background-tertiary)",
                          } as CSSProperties)
                    }
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
                            ? t("suggestionBrand")
                            : suggestion.type === "model"
                              ? t("suggestionModel")
                              : t("suggestionLocation")}
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

      <div className="mb-4 mt-3">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-9">
          {HOME_CATEGORY_TABS.map((tab) => {
            const isActive = activeVehicleCategory === tab.key;
            const label = t(`vehicleCategoryTabs.${tab.key}`);

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (isActive) {
                    setActiveVehicleCategory("");
                    setBodyStyle("");
                    return;
                  }

                  setActiveVehicleCategory(tab.key);
                  setBodyStyle(tab.bodyStyle);
                }}
                className={cn(
                  "home-hover-surface flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-center transition-all",
                  isActive
                    ? "border-[var(--home-cta)] bg-[var(--home-accent-soft)] text-text-primary shadow-sm"
                    : "border-border-subtle bg-white text-text-secondary",
                )}
                style={
                  isActive
                    ? undefined
                    : ({
                        "--home-hover-border": "var(--home-cta)",
                        "--home-hover-bg": "rgb(255 255 255 / 0.95)",
                      } as CSSProperties)
                }
              >
                <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
                  isActive
                    ? "border-[var(--home-cta)] bg-[var(--home-cta)] text-[var(--home-cta-text)]"
                    : "border-border-subtle bg-white text-text-secondary",
                )}
              >
                  <VehicleTypeIcon src={tab.iconSrc} className="h-6 w-6" />
                </span>
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
            {t("popularBrandsLabel")}
          </p>
          {selectedBrands.length > 0 ? (
            <span className="rounded-full bg-[var(--home-mint-soft)] px-3 py-1 text-xs font-semibold text-[var(--home-mint-ink)]">
              {selectedBrands.length === 1
                ? selectedBrands[0]
                : t("selectedBrandsCount", { count: selectedBrands.length })}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {HOME_BRANDS.map((option) => {
            const isActive = selectedBrands.includes(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSelectedBrands((currentValue) =>
                    currentValue.includes(option)
                      ? currentValue.filter((brandValue) => brandValue !== option)
                      : [...currentValue, option],
                  );
                  if (brand === option && isActive) {
                    setBrand("");
                    setModel("");
                  }
                }}
                className={cn(
                  "home-hover-surface relative flex flex-col items-center gap-1.5 rounded-2xl border px-2.5 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "border-[var(--home-cta)] bg-[var(--home-accent-soft)] text-text-primary shadow-sm ring-1 ring-[var(--home-cta)]/25"
                    : "border-border-subtle bg-white text-text-secondary",
                )}
                style={
                  isActive
                    ? undefined
                    : ({
                        "--home-hover-border": "var(--home-cta)",
                        "--home-hover-bg": "rgb(255 255 255 / 0.95)",
                      } as CSSProperties)
                }
              >
                {isActive ? (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--home-cta)] text-[var(--home-cta-text)]">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                ) : null}
                <span
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg",
                    isActive ? "bg-white" : "bg-background-muted",
                  )}
                >
                  {renderBrandLogo(option)}
                </span>
                <span className="text-[12px] leading-tight">{option}</span>
              </button>
            );
          })}
        </div>
        {selectedBrands.length > 1 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedBrands.map((selectedBrand) => (
              <button
                key={`selected-${selectedBrand}`}
                type="button"
                onClick={() =>
                  setSelectedBrands((currentValue) =>
                    currentValue.filter((brandValue) => brandValue !== selectedBrand),
                  )
                }
                className="home-touch-target inline-flex items-center gap-1 rounded-full border border-[var(--home-mint)]/30 bg-[var(--home-mint-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--home-mint-ink)]"
              >
                {selectedBrand}
                <span className="text-[10px] leading-none">×</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <select
          id="home-search-brand"
          name="brand"
          aria-label={t("brandAria")}
          value={brand}
          onChange={(event) => {
            const nextBrand = event.target.value;
            setBrand(nextBrand);
            setModel("");
            if (nextBrand) {
              setSelectedBrands((currentValue) =>
                currentValue.includes(nextBrand) ? currentValue : [...currentValue, nextBrand],
              );
            }
          }}
          className="h-12 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">{t("brandOption")}</option>
          {HOME_BRANDS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          id="home-search-model"
          name="model"
          aria-label={t("modelAria")}
          value={model}
          onChange={(event) => setModel(event.target.value)}
          disabled={!modelBrand}
          className="h-12 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold disabled:bg-background-muted"
        >
          <option value="">{t("modelOption")}</option>
          {modelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          id="home-search-location"
          name="location"
          aria-label={t("locationAria")}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="h-12 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">{t("locationOption")}</option>
          {HOME_LOCATIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          id="home-search-price-to"
          name="priceTo"
          aria-label={t("maxPriceAria")}
          value={priceTo}
          onChange={(event) => setPriceTo(event.target.value)}
          className="h-12 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">{t("priceToOption")}</option>
          <option value="10000">10 000 EUR</option>
          <option value="20000">20 000 EUR</option>
          <option value="35000">35 000 EUR</option>
          <option value="50000">50 000 EUR</option>
        </select>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
            {t("popularFiltersLabel")}
          </p>
          <Tooltip
            onOpenChange={(open) => {
              if (open) {
                setHasOpenedTooltip(true);
              }
            }}
          >
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("advancedOptionalHint")}
                className="home-touch-target inline-flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-white text-[11px] font-bold text-text-secondary"
              >
                i
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              data-home-tooltip={hasOpenedTooltip ? "instant" : "delayed"}
              className="home-subtle-mask home-tooltip-surface z-[70] max-w-60 rounded-xl border border-white/20 bg-[var(--color-primary)] px-3 py-2 text-[11px] font-semibold text-white"
            >
              {t("advancedOptionalHint")}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              id: "automatic",
              active: transmission === "automatic",
              label: tTransmission("automatic"),
              onClick: () =>
                setTransmission((currentValue) =>
                  currentValue === "automatic" ? "" : "automatic",
                ),
            },
            {
              id: "diesel",
              active: fuel === "diesel",
              label: tFuel("diesel"),
              onClick: () =>
                setFuel((currentValue) => (currentValue === "diesel" ? "" : "diesel")),
            },
            {
              id: "electric",
              active: fuel === "electric",
              label: tFuel("electric"),
              onClick: () =>
                setFuel((currentValue) => (currentValue === "electric" ? "" : "electric")),
            },
            {
              id: "service-book",
              active: hasServiceBook,
              label: t("serviceBook"),
              onClick: () => setHasServiceBook((currentValue) => !currentValue),
            },
            {
              id: "not-crashed",
              active: notCrashed,
              label: t("notCrashed"),
              onClick: () => setNotCrashed((currentValue) => !currentValue),
            },
            {
              id: "bought-in-sk",
              active: boughtInSk,
              label: t("boughtInSk"),
              onClick: () => setBoughtInSk((currentValue) => !currentValue),
            },
          ].map((shortcut) => (
            <button
              key={shortcut.id}
              type="button"
              onClick={shortcut.onClick}
              className={cn(
                "home-hover-surface rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                shortcut.active
                  ? "border-[var(--home-cta)] bg-[var(--home-accent-soft)] text-text-primary shadow-sm"
                  : "border-border-subtle bg-white text-text-secondary",
              )}
              style={
                shortcut.active
                  ? undefined
                  : ({
                      "--home-hover-border": "var(--home-cta)",
                      "--home-hover-bg": "rgb(255 255 255 / 0.95)",
                    } as CSSProperties)
              }
            >
              {shortcut.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="home-hover-surface inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[var(--home-cta)] bg-[var(--home-accent-soft)] px-6 text-sm font-semibold text-[var(--home-cta-ink)] shadow-sm transition-colors"
          style={
            {
              "--home-hover-bg": "var(--color-background-secondary)",
              "--home-hover-border": "var(--home-cta)",
            } as CSSProperties
          }
        >
          {showAdvanced ? t("toggleAdvancedHide") : t("toggleAdvancedShow")}
        </button>
        <Tooltip
          onOpenChange={(open) => {
            if (open) {
              setHasOpenedTooltip(true);
            }
          }}
        >
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("advancedSectionHint")}
              className="home-touch-target inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-white text-xs font-bold text-text-secondary"
            >
              ?
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            data-home-tooltip={hasOpenedTooltip ? "instant" : "delayed"}
            className="home-subtle-mask home-tooltip-surface z-[70] max-w-60 rounded-xl border border-white/20 bg-[var(--color-primary)] px-3 py-2 text-[11px] font-semibold text-white"
          >
            {t("advancedSectionHint")}
          </TooltipContent>
        </Tooltip>
        {activeAdvancedFiltersCount > 0 ? (
          <span className="rounded-full bg-[var(--home-mint-soft)] px-3 py-1.5 text-xs font-bold text-[var(--home-mint-ink)]">
            {t("activeLabel", { count: activeAdvancedFiltersCount })}
          </span>
        ) : null}
        {hasAnyFilters ? (
          <button
            type="button"
            onClick={resetAllFilters}
            className="home-hover-surface home-hover-text-accent inline-flex min-h-12 items-center justify-center rounded-full border border-border-strong bg-background px-4 text-xs font-semibold text-text-primary transition-colors"
            style={
              {
                "--home-hover-border": "var(--color-accent)",
                "--home-hover-text": "var(--color-accent-hover)",
              } as CSSProperties
            }
          >
            {t("resetFilters")}
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "grid gap-3 overflow-hidden transition-all sm:grid-cols-2 lg:grid-cols-4",
          showAdvanced ? "mt-4 max-h-[520px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <select
          id="home-search-fuel"
          name="fuel"
          aria-label={t("fuelOption")}
          value={fuel}
          onChange={(event) => setFuel(event.target.value)}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">{t("fuelOption")}</option>
          <option value="petrol">{tFuel("petrol")}</option>
          <option value="diesel">{tFuel("diesel")}</option>
          <option value="electric">{tFuel("electric")}</option>
          <option value="hybrid">{tFuel("hybrid")}</option>
        </select>
        <select
          id="home-search-transmission"
          name="transmission"
          aria-label={t("transmissionOption")}
          value={transmission}
          onChange={(event) => setTransmission(event.target.value)}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">{t("transmissionOption")}</option>
          <option value="manual">{tTransmission("manual")}</option>
          <option value="automatic">{tTransmission("automatic")}</option>
        </select>
        <select
          id="home-search-body-style"
          name="bodyStyle"
          aria-label={t("bodyStyleOption")}
          value={bodyStyle}
          onChange={(event) => {
            setBodyStyle(event.target.value);
            setActiveVehicleCategory("");
          }}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">{t("bodyStyleOption")}</option>
          <option value="hatchback">{tBodyType("hatchback")}</option>
          <option value="sedan">{tBodyType("sedan")}</option>
          <option value="wagon">{tBodyType("wagon")}</option>
          <option value="suv">{tBodyType("suv")}</option>
          <option value="coupe">{tBodyType("coupe")}</option>
          <option value="van">{tBodyType("van")}</option>
        </select>
        <input
          id="home-search-price-from"
          name="priceFrom"
          type="number"
          min="0"
          value={priceFrom}
          onChange={(event) => setPriceFrom(event.target.value)}
          placeholder={t("priceFromPlaceholder")}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        />
        <input
          id="home-search-year-from"
          name="yearFrom"
          type="number"
          min="1900"
          value={yearFrom}
          onChange={(event) => setYearFrom(event.target.value)}
          placeholder={t("yearFromPlaceholder")}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        />
        <input
          id="home-search-year-to"
          name="yearTo"
          type="number"
          min="1900"
          value={yearTo}
          onChange={(event) => setYearTo(event.target.value)}
          placeholder={t("yearToPlaceholder")}
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
            {t("serviceBook")}
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
            {t("notCrashed")}
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
            {t("boughtInSk")}
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSearching}
        className={cn(
          "mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--home-brand)] px-5 py-3 text-base font-black text-white shadow-lg",
          isSearching && "cursor-not-allowed opacity-80",
        )}
      >
        {isSearching ? (
          <>
            <SpinnerIcon className="h-4 w-4 animate-spin" />
            {t("searching")}
          </>
        ) : isPreviewLoading ? (
          <>
            <SpinnerIcon className="h-4 w-4 animate-spin" />
            {t("updatingPreview")}
          </>
        ) : (
          typeof previewCount === "number"
            ? t("showResultsCount", { count: previewCount.toLocaleString(locale) })
            : t("showResultsFallback")
        )}
        <ArrowRightIcon className="h-4 w-4" />
      </button>
      <p className="mt-2 text-center text-xs text-text-secondary">
        {typeof previewCount === "number"
          ? t("previewHint", { count: previewCount.toLocaleString(locale) })
          : t("previewHintFallback")}
      </p>
      </form>
    </TooltipProvider>
  );
}
