"use client";

import {
  useEffect,
  useId,
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

function HomeSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex, isOpen]);

  const openMenu = (preferredIndex?: number) => {
    if (options.length === 0) {
      return;
    }

    const nextIndex =
      typeof preferredIndex === "number" && preferredIndex >= 0
        ? preferredIndex
        : selectedIndex >= 0
          ? selectedIndex
          : 0;
    setIsOpen(true);
    setHighlightedIndex(nextIndex);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const selectOption = (option: { label: string; value: string }) => {
    onChange(option.value);
    closeMenu();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }

      setHighlightedIndex((currentValue) =>
        currentValue < options.length - 1 ? currentValue + 1 : currentValue,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenu(selectedIndex >= 0 ? selectedIndex : options.length - 1);
        return;
      }

      setHighlightedIndex((currentValue) =>
        currentValue > 0 ? currentValue - 1 : currentValue,
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }

      if (highlightedIndex >= 0) {
        selectOption(options[highlightedIndex]);
      }
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeMenu();
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }
          openMenu();
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              closeMenu();
            }
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={cn(
          "h-12 w-full flex items-center justify-between rounded-2xl border border-border bg-background-secondary px-4 text-sm font-semibold outline-none transition-all focus:border-[var(--home-mint)] focus:ring-1 focus:ring-[var(--home-mint)]",
          value ? "text-text-primary" : "text-text-secondary",
        )}
      >
        <span className="truncate">
          {value ? options.find((option) => option.value === value)?.label || value : label}
        </span>
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        >
          <path d="M1 1.5L6 6.5L11 1.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border bg-background-secondary py-2 shadow-xl animate-modal-in"
        >
          {options.map((opt, index) => (
            <button
              key={opt.value}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(opt)}
              className={cn(
                "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-background-muted",
                highlightedIndex === index && "bg-[var(--home-mint-soft)]",
                value === opt.value ? "text-text-primary" : "text-text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HomeEditableNumberField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex, isOpen]);

  const openMenu = (preferredIndex?: number) => {
    if (options.length === 0) {
      return;
    }

    const selectedIndex = options.findIndex((option) => option.value === value);
    const nextIndex =
      typeof preferredIndex === "number" && preferredIndex >= 0
        ? preferredIndex
        : selectedIndex >= 0
          ? selectedIndex
          : 0;
    setIsOpen(true);
    setHighlightedIndex(nextIndex);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    closeMenu();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }

      setHighlightedIndex((currentValue) =>
        currentValue < options.length - 1 ? currentValue + 1 : currentValue,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenu(options.length - 1);
        return;
      }

      setHighlightedIndex((currentValue) =>
        currentValue > 0 ? currentValue - 1 : currentValue,
      );
      return;
    }

    if (event.key === "Enter" && isOpen && highlightedIndex >= 0) {
      event.preventDefault();
      selectOption(options[highlightedIndex].value);
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeMenu();
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <input
        id={`${listboxId}-input`}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        inputMode="numeric"
        pattern="[0-9 ]*"
        value={value}
        onChange={(event) => {
          onChange(normalizeIntegerInput(event.target.value));
          if (!isOpen) {
            openMenu();
          }
        }}
        onFocus={() => openMenu()}
        onBlur={() => {
          window.setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              closeMenu();
            }
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        placeholder={label}
        className="h-12 w-full rounded-2xl border border-border bg-background-secondary px-4 pr-11 text-sm font-semibold text-text-primary outline-none transition-all placeholder:text-text-secondary focus:border-[var(--home-mint)] focus:ring-1 focus:ring-[var(--home-mint)]"
      />
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }
          openMenu();
        }}
        aria-label={label}
        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background-muted hover:text-text-primary"
      >
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        >
          <path d="M1 1.5L6 6.5L11 1.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border bg-background-secondary py-2 shadow-xl animate-modal-in"
        >
          {options.map((option, index) => (
            <button
              key={`${label}-${option.value}`}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option.value)}
              className={cn(
                "flex w-full items-center px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-background-muted",
                highlightedIndex === index && "bg-[var(--home-mint-soft)]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  bodyStyle: string;
  priceFrom: string;
  priceTo: string;
  mileageFrom: string;
  mileageTo: string;
  yearFrom: string;
  yearTo: string;
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
  const [safePriceFrom, safePriceTo] = normalizeRangePair(
    normalizeIntegerInput(filters.priceFrom),
    normalizeIntegerInput(filters.priceTo),
  );
  const [safeMileageFrom, safeMileageTo] = normalizeRangePair(
    normalizeIntegerInput(filters.mileageFrom),
    normalizeIntegerInput(filters.mileageTo),
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
  if (filters.bodyStyle) params.set("bodyStyle", filters.bodyStyle);
  if (safePriceFrom) params.set("priceFrom", safePriceFrom);
  if (safePriceTo) params.set("priceTo", safePriceTo);
  if (safeMileageFrom) params.set("mileageFrom", safeMileageFrom);
  if (safeMileageTo) params.set("mileageTo", safeMileageTo);
  if (safeYearFrom) params.set("yearFrom", safeYearFrom);
  if (safeYearTo) params.set("yearTo", safeYearTo);

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

  const seen = new Set<string>();
  return suggestions.filter((item) => {
    const key = `${item.type}:${item.value.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeSuggestions(suggestions: SuggestionItem[]): SuggestionItem[] {
  const seen = new Set<string>();
  return suggestions.filter((item) => {
    const key = `${item.type}:${item.value.toLowerCase()}:${(item.brand ?? "").toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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
  const tBodyType = useTranslations("bodyType");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");
  const [bodyStyle, setBodyStyle] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [mileageFrom, setMileageFrom] = useState("");
  const [mileageTo, setMileageTo] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<
    (typeof HOME_CATEGORY_TABS)[number]["key"] | ""
  >("");
  const suggestionRequestCounterRef = useRef(0);
  const yearOptions = useMemo(
    () =>
      [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2015, 2010].map((year) => ({
        label: String(year),
        value: String(year),
      })),
    [],
  );
  const formattedPreviewCount =
    typeof previewCount === "number" ? previewCount.toLocaleString(locale) : null;


  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; onRemove: () => void }[] = [];
    
    // Query filter
    if (q.trim()) {
      list.push({ key: "q", label: q.trim(), onRemove: () => setQ("") });
    }
    
    // Brands filters
    selectedBrands.forEach((b) => {
      list.push({
        key: `brand-${b}`,
        label: b,
        onRemove: () => setSelectedBrands((prev) => prev.filter((x) => x !== b)),
      });
    });
    
    // Other filters
    if (model) {
      list.push({ key: "model", label: model, onRemove: () => setModel("") });
    }
    if (fuel) {
      list.push({ key: "fuel", label: tFuel(fuel), onRemove: () => setFuel("") });
    }
    if (bodyStyle) {
      list.push({
        key: "body",
        label: tBodyType(bodyStyle),
        onRemove: () => setBodyStyle(""),
      });
    }
    if (priceFrom) {
      list.push({
        key: "pf",
        label: `${t("priceFromPlaceholder")}: ${priceFrom} €`,
        onRemove: () => setPriceFrom(""),
      });
    }
    if (priceTo) {
      list.push({
        key: "pt",
        label: `${t("priceToOption")}: ${priceTo} €`,
        onRemove: () => setPriceTo(""),
      });
    }
    if (mileageFrom) {
      list.push({
        key: "mf",
        label: `${t("mileageFromPlaceholder")}: ${mileageFrom} km`,
        onRemove: () => setMileageFrom(""),
      });
    }
    if (mileageTo) {
      list.push({
        key: "mt",
        label: `${t("mileageToPlaceholder")}: ${mileageTo} km`,
        onRemove: () => setMileageTo(""),
      });
    }
    if (yearFrom) {
      list.push({
        key: "yf",
        label: `${t("yearFromPlaceholder")}: ${yearFrom}`,
        onRemove: () => setYearFrom(""),
      });
    }
    if (yearTo) {
      list.push({
        key: "yt",
        label: `${t("yearToPlaceholder")}: ${yearTo}`,
        onRemove: () => setYearTo(""),
      });
    }
    
    return list;
  }, [
    q,
    selectedBrands,
    model,
    fuel,
    bodyStyle,
    priceFrom,
    priceTo,
    mileageFrom,
    mileageTo,
    yearFrom,
    yearTo,
    tFuel,
    tBodyType,
    t,
  ]);

  const hasAnyFilters = activeFilters.length > 0;
  const homeSearchQuery = useMemo(
    () =>
      buildHomeSearchParams({
        q,
        brands: Array.from(new Set([brand, ...selectedBrands])).filter(Boolean),
        model,
        fuel,
        bodyStyle,
        priceFrom,
        priceTo,
        mileageFrom,
        mileageTo,
        yearFrom,
        yearTo,
      }).toString(),
    [
      bodyStyle,
      brand,
      fuel,
      model,
      priceFrom,
      priceTo,
      q,
      mileageFrom,
      mileageTo,
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

        const payload = (await response.json()) as {
          count?: number;
          degraded?: boolean;
        };
        setPreviewCount(
          payload.degraded
            ? null
            : typeof payload.count === "number"
              ? payload.count
              : null,
        );
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
        Boolean(fuel),
        Boolean(bodyStyle),
        Boolean(priceFrom || priceTo),
        Boolean(mileageFrom || mileageTo),
        Boolean(yearFrom || yearTo),
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
    setBodyStyle("");
    setPriceFrom("");
    setPriceTo("");
    setMileageFrom("");
    setMileageTo("");
    setYearFrom("");
    setYearTo("");
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
      const newQueryString = matchedBrand ? `${matchedBrand} ${suggestion.value} ` : `${suggestion.value} `;
      setQ(newQueryString);
      
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return;
    }

    if (suggestion.type === "location") {
      // location is removed from UI input filters
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
          "mt-6 w-full max-w-none rounded-[26px] border border-[var(--home-cta)]/16 bg-background-secondary/95 p-3.5 text-text-primary shadow-xl sm:p-4.5",
          className,
        )}
      >
      <div className="relative">
        <SearchIcon className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[var(--home-mint)] transition-transform duration-300 group-focus-within:scale-110" />
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
          className="h-16 w-full rounded-2xl border-2 border-border-strong bg-background-secondary pl-14 pr-4 text-lg font-bold shadow-md outline-none transition-all duration-300 placeholder:text-text-tertiary focus:border-[var(--home-mint)] focus:ring-4 focus:ring-[var(--home-mint-soft)] focus:shadow-xl hover:border-[var(--home-mint)]"
        />

        {showSuggestions && suggestions.length > 0 ? (
          <div
            className="home-popover-surface home-subtle-mask absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-border-subtle bg-background-secondary shadow-xl"
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
        <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-2 touch-pan-x sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
          <div
            aria-label={t("categoryTabsLabel")}
            className="grid grid-flow-col auto-cols-[90px] grid-rows-1 gap-2 pr-1 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-5 sm:pr-0 xl:grid-cols-9"
          >
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
                    "home-pressable home-hover-surface flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-center transition-all group",
                    isActive
                      ? "border-[var(--home-brand)] bg-[var(--home-brand)] text-[var(--home-mint)] shadow-md"
                      : "border-border-subtle bg-white text-text-secondary",
                  )}
                  style={
                    {
                      "--home-hover-border": "var(--home-brand)",
                      "--home-hover-bg": "var(--home-brand)",
                      "--home-hover-text": "var(--home-mint)",
                      "--home-hover-shadow": isActive ? "var(--shadow-md)" : "var(--shadow-sm)",
                    } as CSSProperties
                  }
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isActive
                        ? "border-[var(--home-mint)] bg-[var(--home-mint)] text-[var(--home-brand)]"
                        : "border-border-subtle bg-white text-text-secondary group-hover:border-[var(--home-mint)] group-hover:bg-[var(--home-mint)] group-hover:text-[var(--home-brand)]",
                    )}
                  >
                    <VehicleTypeIcon src={tab.iconSrc} className="h-6 w-6" />
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold leading-tight transition-colors",
                      !isActive && "group-hover:text-[var(--home-mint)]",
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
            {t("popularBrandsLabel")}
          </p>
          {/* removed selectedBrands counter */}
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
                  "home-pressable home-hover-surface relative flex flex-col items-center gap-1.5 rounded-2xl border px-2.5 py-2.5 text-sm font-semibold transition-all group",
                  isActive
                    ? "border-[var(--home-brand)] bg-[var(--home-brand)] text-[var(--home-mint)] shadow-md"
                    : "border-border-subtle bg-white text-text-secondary",
                )}
                style={
                  {
                    "--home-hover-border": "var(--home-brand)",
                    "--home-hover-bg": "var(--home-brand)",
                    "--home-hover-text": "var(--home-mint)",
                    "--home-hover-shadow": isActive ? "var(--shadow-md)" : "var(--shadow-sm)",
                  } as CSSProperties
                }
              >
                {/* CHECK ICON HIDDEN */}
                <span
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg border transition-colors",
                    isActive
                      ? "border-[var(--home-mint)] bg-[var(--home-mint)] text-[var(--home-brand)]"
                      : "border-border-subtle bg-background-muted group-hover:border-[var(--home-mint)] group-hover:bg-[var(--home-mint)] group-hover:text-[var(--home-brand)]",
                  )}
                    >
                  {renderBrandLogo(option)}
                </span>
                <span
                  className={cn(
                    "text-[12px] leading-tight transition-colors",
                    !isActive && "group-hover:text-[var(--home-mint)]",
                  )}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>
        {/* removed selectedBrands chips row */}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HomeEditableNumberField
          label={t("priceFromPlaceholder")}
          value={priceFrom}
          onChange={setPriceFrom}
          options={[
            { label: "5 000 EUR", value: "5000" },
            { label: "10 000 EUR", value: "10000" },
            { label: "15 000 EUR", value: "15000" },
            { label: "20 000 EUR", value: "20000" },
            { label: "30 000 EUR", value: "30000" },
          ]}
        />

        <HomeEditableNumberField
          label={t("priceToOption")}
          value={priceTo}
          onChange={setPriceTo}
          options={[
            { label: "10 000 EUR", value: "10000" },
            { label: "20 000 EUR", value: "20000" },
            { label: "35 000 EUR", value: "35000" },
            { label: "50 000 EUR", value: "50000" },
          ]}
        />

        <HomeEditableNumberField
          label={t("mileageFromPlaceholder")}
          value={mileageFrom}
          onChange={setMileageFrom}
          options={[
            { label: "25 000 km", value: "25000" },
            { label: "50 000 km", value: "50000" },
            { label: "75 000 km", value: "75000" },
            { label: "100 000 km", value: "100000" },
            { label: "150 000 km", value: "150000" },
          ]}
        />

        <HomeEditableNumberField
          label={t("mileageToPlaceholder")}
          value={mileageTo}
          onChange={setMileageTo}
          options={[
            { label: "50 000 km", value: "50000" },
            { label: "100 000 km", value: "100000" },
            { label: "150 000 km", value: "150000" },
            { label: "200 000 km", value: "200000" },
            { label: "250 000 km", value: "250000" },
          ]}
        />

        <HomeEditableNumberField
          label={t("yearFromPlaceholder")}
          value={yearFrom}
          onChange={setYearFrom}
          options={yearOptions}
        />

        <HomeEditableNumberField
          label={t("yearToPlaceholder")}
          value={yearTo}
          onChange={setYearTo}
          options={yearOptions}
        />

        <HomeSelect
          label={t("bodyStyleOption")}
          value={bodyStyle}
          onChange={setBodyStyle}
          options={[
            { label: tBodyType("hatchback"), value: "hatchback" },
            { label: tBodyType("sedan"), value: "sedan" },
            { label: tBodyType("wagon"), value: "wagon" },
            { label: tBodyType("suv"), value: "suv" },
            { label: tBodyType("coupe"), value: "coupe" },
            { label: tBodyType("van"), value: "van" },
          ]}
        />

        <HomeSelect
          label={t("fuelOption")}
          value={fuel}
          onChange={setFuel}
          options={[
            { label: tFuel("petrol"), value: "petrol" },
            { label: tFuel("diesel"), value: "diesel" },
            { label: tFuel("electric"), value: "electric" },
            { label: tFuel("hybrid"), value: "hybrid" },
          ]}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.onRemove}
              className="flex items-center gap-1.5 rounded-full border border-[var(--home-mint)] bg-[var(--home-mint-soft)] px-2.5 py-1 text-xs font-bold text-[var(--home-mint-ink)] transition-colors hover:bg-[var(--home-mint-strong)]"
            >
              <span className="max-w-[120px] truncate">{filter.label}</span>
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/40 text-[10px]">&times;</span>
            </button>
          ))}
        </div>
        {hasAnyFilters ? (
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error-subtle)] px-4 text-sm font-black text-[var(--color-error)] shadow-sm transition-colors hover:bg-[var(--color-error)] hover:text-white"
          >
            {t("resetFilters")}
          </button>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSearching}
        aria-label={
          formattedPreviewCount
            ? t("showResultsCount", { count: formattedPreviewCount })
            : hasAnyFilters
              ? t("showResultsFallback")
              : t("viewAll")
        }
        className={cn(
          "mt-6 flex min-h-[72px] w-full items-center justify-between gap-3 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-left text-white shadow-xl transition-all hover:bg-[var(--color-accent-hover)] hover:-translate-y-0.5",
          isSearching && "cursor-not-allowed opacity-80",
        )}
      >
        {isSearching ? (
          <>
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            {t("searching")}
          </>
        ) : isPreviewLoading ? (
          <>
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            {t("updatingPreview")}
          </>
        ) : formattedPreviewCount ? (
          <>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
                {hasAnyFilters ? t("showResultsFallback") : t("viewAll")}
              </span>
              <span className="mt-1 text-[30px] font-black leading-none tabular-nums">
                {formattedPreviewCount}
              </span>
            </span>
            <ArrowRightIcon className="h-5 w-5 shrink-0 opacity-90" />
          </>
        ) : (
          <>
            <span className="text-[17px] font-black tracking-wide">
              {hasAnyFilters ? t("showResultsFallback") : t("viewAll")}
            </span>
            <ArrowRightIcon className="h-5 w-5 shrink-0 opacity-90" />
          </>
        )}
      </button>
      </form>
    </TooltipProvider>
  );
}
