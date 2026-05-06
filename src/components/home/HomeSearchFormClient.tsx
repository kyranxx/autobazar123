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
import {
  CalendarDots,
  Car,
  CurrencyEur,
  GasPump,
  Gauge,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CarIcon,
  SearchIcon,
  SpinnerIcon,
  TagIcon,
} from "@/components/ui/Icons";
import { useIconWeight } from "@/context/IconWeightContext";
import {
  TooltipProvider,
} from "@/components/ui/shadcn/tooltip";
import type { AlgoliaCarRecord } from "@/lib/algolia";
import { getCarsIndexName } from "@/lib/algolia/public-env";
import { usePublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/client";
import { cn } from "@/utils/cn";
import { HOME_LOCATIONS } from "@/components/home/theme";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

const HOME_MIN_SUGGESTION_LENGTH = 2;
const HOME_REMOTE_SUGGESTION_LIMIT = 8;
const HOME_REMOTE_SUGGESTION_DEBOUNCE_MS = 120;
const HOME_PREVIEW_COUNT_DEBOUNCE_MS = 420;

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
  icon,
  className,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside, true);
    return () => document.removeEventListener("pointerdown", handlePointerDownOutside, true);
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
    if (disabled || options.length === 0) {
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
          if (disabled) {
            return;
          }
          if (isOpen) {
            closeMenu();
            return;
          }
          openMenu();
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
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
        disabled={disabled}
        className={cn(
          "home-filter-control relative flex h-11 w-full items-center justify-between rounded-xl border-2 border-border bg-background-secondary px-3.5 pr-10 text-base font-semibold text-text-primary outline-none transition-all focus:border-[var(--home-mint)] focus:ring-0 focus-visible:border-[var(--home-mint)] focus-visible:outline-none focus-visible:ring-0 sm:h-12 sm:rounded-2xl sm:px-4 sm:pr-11 sm:text-sm",
          disabled && "cursor-not-allowed opacity-60",
        )}
        style={
          isFocused || isOpen
            ? {
                borderColor: "var(--home-mint)",
                boxShadow: "none",
                outline: "none",
              }
            : undefined
        }
      >
        <span className="flex min-w-0 items-center gap-2.5 pr-3">
          {icon ? (
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center text-[var(--home-mint-ink)]">
              {icon}
            </span>
          ) : null}
          <span className="truncate">
            {value ? options.find((option) => option.value === value)?.label || value : label}
          </span>
        </span>
        <span className="pointer-events-none absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center sm:right-4">
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("h-2 w-3 transition-transform duration-200", isOpen && "rotate-180")}
          >
            <path d="M1 1.5L6 6.5L11 1.5" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 -mt-px max-h-60 overflow-y-auto rounded-2xl border border-[var(--home-mint)]/28 bg-[var(--home-mint)]/12 py-2 shadow-lg shadow-[var(--home-brand)]/10 backdrop-blur-sm animate-modal-in"
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
                "flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--home-mint)]/16",
                highlightedIndex === index && "bg-[var(--home-mint)]/20",
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
  icon,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  icon?: ReactNode;
  className?: string;
}) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside, true);
    return () => document.removeEventListener("pointerdown", handlePointerDownOutside, true);
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
    <div className={cn("relative h-11 w-full self-start sm:h-12", className)} ref={containerRef}>
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
        onFocus={() => {
          setIsFocused(true);
          openMenu();
        }}
        onBlur={() => {
          setIsFocused(false);
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
        className={cn(
          "home-filter-input block h-11 w-full rounded-xl border-2 border-border bg-background-secondary pr-12 text-base font-semibold text-text-primary outline-none transition-all placeholder:text-text-primary focus:border-[var(--home-mint)] focus:ring-0 focus-visible:border-[var(--home-mint)] focus-visible:outline-none focus-visible:ring-0 sm:h-12 sm:rounded-2xl sm:pr-12 sm:text-sm",
          icon ? "pl-10 sm:pl-11" : "px-3.5 sm:px-4",
        )}
        style={
          isFocused || isOpen
            ? {
                borderColor: "var(--home-mint)",
                boxShadow: "none",
                outline: "none",
              }
            : undefined
        }
      />
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 flex h-4.5 w-4.5 -translate-y-1/2 items-center justify-center text-[var(--home-mint-ink)] sm:left-4">
          {icon}
        </span>
      ) : null}
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
        aria-label={isOpen ? `${label} close` : `${label} open`}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className="!absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-[var(--home-mint)]/10 sm:right-3"
        style={{ position: "absolute" }}
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
          className={cn("h-2 w-3 transition-transform duration-200", isOpen && "rotate-180")}
        >
          <path d="M1 1.5L6 6.5L11 1.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 -mt-px max-h-60 overflow-y-auto rounded-2xl border border-[var(--home-mint)]/28 bg-[var(--home-mint)]/12 py-2 shadow-lg shadow-[var(--home-brand)]/10 backdrop-blur-sm animate-modal-in"
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
                "flex w-full items-center px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-[var(--home-mint)]/16",
                highlightedIndex === index && "bg-[var(--home-mint)]/20",
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

const HOME_BRAND_LOGOS: Record<string, string> = {
  audi: "/brand-logos/audi.png",
  bmw: "/brand-logos/bmw.png",
  dacia: "/brand-logos/dacia.svg",
  ford: "/brand-logos/ford.png",
  hyundai: "/brand-logos/hyundai.svg",
  kia: "/brand-logos/kia.png",
  "mercedes-benz": "/brand-logos/mercedes-benz.png",
  nissan: "/brand-logos/nissan.png",
  opel: "/brand-logos/opel.svg",
  peugeot: "/brand-logos/peugeot.svg",
  renault: "/brand-logos/renault.svg",
  skoda: "/brand-logos/skoda.png",
  toyota: "/brand-logos/toyota.png",
  volvo: "/brand-logos/volvo.png",
  volkswagen: "/brand-logos/volkswagen.png",
};

const HOME_BRAND_LOGO_CLASSNAMES: Record<string, string> = {
  audi: "h-[21px] sm:h-7",
  bmw: "h-[25px] sm:h-8",
  dacia: "h-[20px] sm:h-6",
  ford: "h-[24px] sm:h-7",
  hyundai: "h-[17px] sm:h-5",
  kia: "h-[22px] sm:h-7",
  "mercedes-benz": "h-[22px] sm:h-7",
  nissan: "h-[22px] sm:h-7",
  opel: "h-[21px] sm:h-6",
  peugeot: "h-[20px] sm:h-6",
  renault: "h-[21px] sm:h-6",
  skoda: "h-[22px] sm:h-7",
  toyota: "h-[22px] sm:h-7",
  volvo: "h-[23px] sm:h-[30px]",
  volkswagen: "h-[25px] sm:h-8",
};

const HOME_FEATURED_BRAND_SLUGS = [
  "skoda",
  "volkswagen",
  "bmw",
  "mercedes-benz",
  "audi",
  "toyota",
  "ford",
  "hyundai",
  "peugeot",
  "renault",
] as const;

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

function renderBrandLogo(brand: string, slug: string): ReactNode {
  const src = HOME_BRAND_LOGOS[slug];
  if (!src) {
    return <CarIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />;
  }

  return (
    <span className="flex h-10 w-full items-center justify-center sm:h-10">
      <Image
        src={src}
        alt={`${brand} logo`}
        width={180}
        height={56}
        sizes="180px"
        className={cn(
          "w-auto max-w-full object-contain object-center",
          HOME_BRAND_LOGO_CLASSNAMES[slug] ?? "h-[22px] sm:h-7",
        )}
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

function getFallbackSuggestions(
  inputValue: string,
  brandNames: string[],
  modelsByBrandName: Record<string, string[]>,
): SuggestionItem[] {
  const needle = inputValue.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const modelEntries = Object.entries(modelsByBrandName).flatMap(([brand, models]) =>
    models.map((model) => ({ brand, model })),
  );

  const suggestions: SuggestionItem[] = [
    ...brandNames.filter((brand) => brand.toLowerCase().includes(needle))
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

function findBrandForModel(
  modelValue: string,
  modelsByBrandName: Record<string, string[]>,
): string | null {
  const normalizedModel = modelValue.trim().toLowerCase();

  for (const [brand, models] of Object.entries(modelsByBrandName)) {
    if (models.some((model) => model.toLowerCase() === normalizedModel)) {
      return brand;
    }
  }

  return null;
}

function findEffectiveHomeBrand(
  inputValue: string,
  selectedBrand: string,
  brandNames: string[],
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
    brandNames.find((candidate) => {
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
  brandNames: string[],
  modelsByBrandName: Record<string, string[]>,
): SuggestionItem[] {
  const trimmedValue = inputValue.trim();
  const effectiveBrand = findEffectiveHomeBrand(trimmedValue, selectedBrand, brandNames);

  if (!effectiveBrand) {
    return getFallbackSuggestions(trimmedValue, brandNames, modelsByBrandName);
  }

  const normalizedBrand = effectiveBrand.toLowerCase();
  const normalizedInput = trimmedValue.toLowerCase();
  const modelNeedle = normalizedInput.startsWith(normalizedBrand)
    ? trimmedValue.slice(effectiveBrand.length).trim().toLowerCase()
    : normalizedInput;
  const modelSuggestions = (modelsByBrandName[effectiveBrand] ?? [])
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
  brandNames: string[],
): Promise<SuggestionItem[]> {
  const trimmedValue = inputValue.trim();
  if (trimmedValue.length < HOME_MIN_SUGGESTION_LENGTH) {
    return [];
  }

  const effectiveBrand = findEffectiveHomeBrand(trimmedValue, selectedBrand, brandNames);
  const normalizedInput = trimmedValue.toLowerCase();
  const modelNeedle = effectiveBrand
    && normalizedInput.startsWith(`${effectiveBrand.toLowerCase()} `)
    ? trimmedValue.slice(effectiveBrand.length).trim().toLowerCase()
    : normalizedInput;

  try {
    const { searchSingleIndex } = await loadHomeAlgoliaModule();
    const searchResult = await searchSingleIndex<AlgoliaCarRecord>({
      indexName: getCarsIndexName(),
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
  const { weight } = useIconWeight();
  const {
    taxonomy,
    brandNames,
    modelsByBrandName,
  } = usePublicVehicleTaxonomy();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollerRef = useRef<HTMLDivElement>(null);
  const categoryDragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    dragged: boolean;
  } | null>(null);
  const categoryPreventClickRef = useRef(false);
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<
    (typeof HOME_CATEGORY_TABS)[number]["key"] | ""
  >("");
  const [showCategoryScrollLeft, setShowCategoryScrollLeft] = useState(false);
  const [showCategoryScrollRight, setShowCategoryScrollRight] = useState(false);
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
  const featuredBrands = useMemo(() => {
    const brandsBySlug = new Map(taxonomy.brands.map((option) => [option.slug, option]));
    const orderedFeaturedBrands = HOME_FEATURED_BRAND_SLUGS.map((slug) => brandsBySlug.get(slug))
      .filter((option): option is NonNullable<typeof option> => Boolean(option));

    if (orderedFeaturedBrands.length >= HOME_FEATURED_BRAND_SLUGS.length) {
      return orderedFeaturedBrands;
    }

    const usedSlugs = new Set(orderedFeaturedBrands.map((option) => option.slug));
    const fallbackBrands = taxonomy.brands.filter((option) => !usedSlugs.has(option.slug));

    return [...orderedFeaturedBrands, ...fallbackBrands].slice(0, HOME_FEATURED_BRAND_SLUGS.length);
  }, [taxonomy.brands]);

  const activeBrand = brand || selectedBrands[0] || "";
  const brandOptions = useMemo(
    () =>
      taxonomy.brands.map((option) => ({
        label: option.name,
        value: option.name,
      })),
    [taxonomy.brands],
  );
  const modelOptions = useMemo(() => {
    if (!activeBrand) {
      return [];
    }

    return (modelsByBrandName[activeBrand] ?? []).map((option) => ({
      label: option,
      value: option,
    }));
  }, [activeBrand, modelsByBrandName]);

  const applyPrimaryBrand = (nextBrand: string) => {
    setBrand(nextBrand);
    setSelectedBrands(nextBrand ? [nextBrand] : []);
    setModel((currentValue) => {
      if (!nextBrand) {
        return "";
      }

      return (modelsByBrandName[nextBrand] ?? []).includes(currentValue)
        ? currentValue
        : "";
    });
  };


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
        onRemove: () => {
          setBrand("");
          setSelectedBrands([]);
          setModel("");
        },
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
  const submitButtonLabel = formattedPreviewCount
    ? `${t("showResultsFallback")}: ${formattedPreviewCount}`
    : hasAnyFilters
      ? t("showResultsFallback")
      : t("viewAll");
  const homeSearchQuery = useMemo(
    () =>
      buildHomeSearchParams({
        q,
        brands: activeBrand ? [activeBrand] : [],
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
      fuel,
      model,
      priceFrom,
      priceTo,
      q,
      mileageFrom,
      mileageTo,
      yearFrom,
      yearTo,
      activeBrand,
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
      const algoliaSuggestions = await getAlgoliaHomeSuggestions(
        trimmedQuery,
        brand,
        brandNames,
      );
      if (suggestionRequestCounterRef.current !== requestId) {
        return;
      }

      if (algoliaSuggestions.length > 0) {
        setSuggestions(algoliaSuggestions);
        return;
      }

      setSuggestions(getHomeSuggestions(trimmedQuery, brand, brandNames, modelsByBrandName));
    }, HOME_REMOTE_SUGGESTION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [brand, brandNames, modelsByBrandName, q]);

  useEffect(() => {
    setIsSearching(false);
    const handlePageShow = () => setIsSearching(false);

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  useEffect(() => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) {
      return;
    }

    const updateCategoryScrollControls = () => {
      if (window.innerWidth >= 640) {
        setShowCategoryScrollLeft(false);
        setShowCategoryScrollRight(false);
        return;
      }

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const epsilon = 2;
      setShowCategoryScrollLeft(scroller.scrollLeft > epsilon);
      setShowCategoryScrollRight(maxScrollLeft - scroller.scrollLeft > epsilon);
    };

    updateCategoryScrollControls();
    scroller.addEventListener("scroll", updateCategoryScrollControls, { passive: true });
    window.addEventListener("resize", updateCategoryScrollControls);

    return () => {
      scroller.removeEventListener("scroll", updateCategoryScrollControls);
      window.removeEventListener("resize", updateCategoryScrollControls);
    };
  }, []);

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
    }, HOME_PREVIEW_COUNT_DEBOUNCE_MS);

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
        Boolean(activeBrand),
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

  const handleCategoryPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = categoryScrollerRef.current;
    if (
      !scroller ||
      event.pointerType !== "mouse" ||
      window.innerWidth >= 640 ||
      scroller.scrollWidth <= scroller.clientWidth
    ) {
      return;
    }

    categoryDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
      dragged: false,
    };
    scroller.setPointerCapture(event.pointerId);
  };

  const handleCategoryPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = categoryScrollerRef.current;
    const dragState = categoryDragStateRef.current;
    if (!scroller || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 4) {
      dragState.dragged = true;
      categoryPreventClickRef.current = true;
    }

    scroller.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const releaseCategoryPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = categoryScrollerRef.current;
    const dragState = categoryDragStateRef.current;
    if (!scroller || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }

    categoryDragStateRef.current = null;
    window.setTimeout(() => {
      categoryPreventClickRef.current = false;
    }, 0);
  };

  const scrollCategoryStripBy = (distance: number) => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) {
      return;
    }

    scroller.scrollLeft += distance;
    window.requestAnimationFrame(() => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const epsilon = 2;
      setShowCategoryScrollLeft(scroller.scrollLeft > epsilon);
      setShowCategoryScrollRight(maxScrollLeft - scroller.scrollLeft > epsilon);
    });
  };

  const applySuggestion = (suggestion: SuggestionItem) => {
    if (suggestion.type === "brand") {
      const nextValue = `${suggestion.value} `;

      setQ(nextValue);
      applyPrimaryBrand(suggestion.value);
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
      const matchedBrand =
        suggestion.brand ?? findBrandForModel(suggestion.value, modelsByBrandName);
      if (matchedBrand) {
        applyPrimaryBrand(matchedBrand);
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
          "mt-6 w-full min-w-0 max-w-full overflow-visible rounded-[26px] border border-[var(--home-cta)]/16 bg-background-secondary/95 p-3.5 text-text-primary shadow-xl sm:p-4.5",
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
              applyPrimaryBrand("");
            }

            setQ(nextValue);
            setHighlightedSuggestionIndex(-1);
            if (nextValue.trim().length < HOME_MIN_SUGGESTION_LENGTH) {
              setShowSuggestions(false);
              return;
            }
            setShowSuggestions(true);
          }}
          onFocus={() => {
            setIsSearchFocused(true);
            setShowSuggestions(
              q.trim().length >= HOME_MIN_SUGGESTION_LENGTH && suggestions.length > 0,
            );
          }}
          onBlur={() => {
            setIsSearchFocused(false);
            window.setTimeout(() => {
              setShowSuggestions(false);
              setHighlightedSuggestionIndex(-1);
            }, 120);
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder={t("searchPlaceholder")}
          className="home-search-input h-16 w-full rounded-2xl border-[3px] border-[var(--home-mint)] bg-background-secondary pl-14 pr-4 text-lg font-bold shadow-md outline-none transition-all duration-300 placeholder:font-medium placeholder:text-text-secondary placeholder:opacity-70 focus:border-[var(--home-mint)] focus:ring-0 focus-visible:border-[var(--home-mint)] focus-visible:outline-none focus-visible:ring-0 hover:border-[var(--home-mint)]"
          style={{
            borderColor: "var(--home-mint)",
            boxShadow: isSearchFocused
              ? "0 10px 24px -14px rgba(17,24,39,0.28)"
              : "inset 0 0 0 1px color-mix(in srgb, var(--home-mint) 72%, white 28%), 0 10px 24px -14px rgba(17,24,39,0.28)",
            outline: "none",
          }}
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
        <div className="relative w-full min-w-0 overflow-visible">
          <div
            ref={categoryScrollerRef}
            onPointerDown={handleCategoryPointerDown}
            onPointerMove={handleCategoryPointerMove}
            onPointerUp={releaseCategoryPointer}
            onPointerCancel={releaseCategoryPointer}
            onClickCapture={(event) => {
              if (!categoryPreventClickRef.current) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
            }}
            className="w-full min-w-0 overflow-visible px-0 pb-1 min-[360px]:overflow-x-auto min-[360px]:overflow-y-visible min-[360px]:[-ms-overflow-style:none] min-[360px]:[scrollbar-width:none] min-[360px]:[&::-webkit-scrollbar]:hidden sm:overflow-visible sm:pb-0"
          >
            <div
              aria-label={t("categoryTabsLabel")}
              className="grid w-full grid-cols-3 gap-2 pr-1 min-[360px]:flex min-[360px]:w-max min-[360px]:min-w-full min-[360px]:pr-2 sm:grid sm:w-auto sm:grid-cols-5 sm:pr-0 xl:grid-cols-9"
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
                      "home-pressable home-hover-surface flex min-h-[4.6rem] w-full flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-1.5 text-center transition-all group min-[360px]:w-[92px] min-[360px]:shrink-0 sm:min-h-[4.85rem] sm:w-full sm:rounded-2xl sm:px-2 sm:py-2",
                      isActive
                        ? "border-[var(--home-brand)] bg-[var(--home-brand)] text-[var(--home-mint)] shadow-md"
                        : "border-border-subtle bg-white text-text-primary",
                    )}
                    style={
                      (
                        isActive
                          ? {
                              "--home-hover-border": "var(--home-brand)",
                              "--home-hover-bg": "var(--home-brand)",
                              "--home-hover-text": "var(--home-mint)",
                              "--home-hover-shadow": "var(--shadow-md)",
                            }
                          : {
                              "--home-hover-border": "var(--home-mint)",
                              "--home-hover-bg": "var(--home-mint-soft)",
                              "--home-hover-text": "var(--home-brand)",
                              "--home-hover-shadow": "var(--shadow-sm)",
                            }
                      ) as CSSProperties
                    }
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10",
                        isActive
                          ? "bg-[var(--home-mint)] text-[var(--home-brand)]"
                          : "bg-white text-text-primary group-hover:bg-[var(--home-mint)] group-hover:text-[var(--home-brand)]",
                      )}
                    >
                      <VehicleTypeIcon src={tab.iconSrc} className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold leading-tight transition-colors sm:text-[11px]",
                        !isActive && "group-hover:text-[var(--home-brand)]",
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-1 top-[calc(50%-6px)] z-10 flex -translate-y-1/2 items-center justify-between sm:hidden">
            <div className="flex h-9 w-9 items-center justify-center">
              {showCategoryScrollLeft ? (
                <button
                  type="button"
                  aria-label={t("scrollCategoriesLeft")}
                  onClick={() => scrollCategoryStripBy(-224)}
                  className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--home-mint)]/28 bg-[var(--home-mint)]/12 text-[var(--home-brand)] shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--home-mint)]/18"
                >
                  <ArrowRightIcon className="h-4 w-4 rotate-180" />
                </button>
              ) : null}
            </div>
            <div className="flex h-9 w-9 items-center justify-center">
              {showCategoryScrollRight ? (
                <button
                  type="button"
                  aria-label={t("scrollCategoriesRight")}
                  onClick={() => scrollCategoryStripBy(224)}
                  className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--home-mint)]/28 bg-[var(--home-mint)]/12 text-[var(--home-brand)] shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--home-mint)]/18"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary">
            {t("popularBrandsLabel")}
          </p>
          {/* removed selectedBrands counter */}
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-10 lg:gap-1.5">
          {featuredBrands.map((option) => {
            const isActive = activeBrand === option.name;

            return (
              <button
                key={option.id}
                type="button"
                aria-label={option.name}
                onClick={() => {
                  applyPrimaryBrand(isActive ? "" : option.name);
                }}
                className={cn(
                  "home-pressable home-hover-surface relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[9px] font-semibold transition-all group sm:gap-1.5 sm:rounded-2xl sm:px-2.5 sm:py-2.5 sm:text-sm lg:gap-1 lg:px-1.5 lg:py-2 lg:text-[10px]",
                  isActive
                    ? "border-[var(--home-brand)] bg-[var(--home-brand)] text-[var(--home-mint)] shadow-md"
                    : "border-border-subtle bg-white text-text-primary",
                )}
                style={
                  (
                    isActive
                      ? {
                          "--home-hover-border": "var(--home-brand)",
                          "--home-hover-bg": "var(--home-brand)",
                          "--home-hover-text": "var(--home-mint)",
                          "--home-hover-shadow": "var(--shadow-md)",
                        }
                      : {
                          "--home-hover-border": "var(--home-mint)",
                          "--home-hover-bg": "var(--home-mint-soft)",
                          "--home-hover-text": "var(--home-brand)",
                          "--home-hover-shadow": "var(--shadow-sm)",
                        }
                  ) as CSSProperties
                }
              >
                {/* CHECK ICON HIDDEN */}
                <span className="flex h-10 w-full items-center justify-center rounded-md bg-white sm:h-10 sm:rounded-lg">
                  {renderBrandLogo(option.name, option.slug)}
                </span>
              </button>
            );
          })}
        </div>
        {/* removed selectedBrands chips row */}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-3">
        <HomeSelect
          label={t("brandOption")}
          value={activeBrand}
          onChange={(nextBrand) => applyPrimaryBrand(nextBrand)}
          icon={<CarIcon className="h-4 w-4" />}
          options={brandOptions}
        />

        <HomeSelect
          label={t("modelOption")}
          value={model}
          onChange={setModel}
          icon={<TagIcon className="h-4 w-4" />}
          options={modelOptions}
          disabled={!activeBrand}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <HomeEditableNumberField
          label={t("priceFromPlaceholder")}
          value={priceFrom}
          onChange={setPriceFrom}
          icon={<CurrencyEur weight={weight} className="h-4 w-4" />}
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
          icon={<CurrencyEur weight={weight} className="h-4 w-4" />}
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
          icon={<Gauge weight={weight} className="h-4 w-4" />}
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
          icon={<Gauge weight={weight} className="h-4 w-4" />}
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
          icon={<CalendarDots weight={weight} className="h-4 w-4" />}
          options={yearOptions}
        />

        <HomeEditableNumberField
          label={t("yearToPlaceholder")}
          value={yearTo}
          onChange={setYearTo}
          icon={<CalendarDots weight={weight} className="h-4 w-4" />}
          options={yearOptions}
        />

        <HomeSelect
          label={t("bodyStyleOption")}
          value={bodyStyle}
          onChange={setBodyStyle}
          icon={<Car weight={weight} className="h-4 w-4" />}
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
          icon={<GasPump weight={weight} className="h-4 w-4" />}
          options={[
            { label: tFuel("petrol"), value: "petrol" },
            { label: tFuel("diesel"), value: "diesel" },
            { label: tFuel("electric"), value: "electric" },
            { label: tFuel("hybrid"), value: "hybrid" },
          ]}
        />
      </div>

      {hasAnyFilters ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={filter.onRemove}
                className="flex items-center gap-1.5 rounded-full border border-[var(--home-mint)] bg-[var(--home-mint-soft)] px-2.5 py-1 text-xs font-bold text-[var(--home-mint-ink)] transition-colors hover:bg-[var(--home-mint-strong)]"
              >
                <span className="max-w-[120px] truncate">{filter.label}</span>
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/40 text-[10px]">
                  &times;
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error-subtle)] px-4 text-sm font-black text-[var(--color-error)] shadow-sm transition-colors hover:bg-[var(--color-error)] hover:text-white"
          >
            {t("resetFilters")}
          </button>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSearching}
        aria-label={submitButtonLabel}
        className={cn(
          "mt-3 flex min-h-[72px] w-full items-center justify-center rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-white shadow-xl transition-all hover:bg-[var(--color-accent-hover)] hover:-translate-y-0.5",
          isSearching && "cursor-not-allowed opacity-80",
        )}
      >
        {isSearching ? (
          <span className="inline-flex items-center gap-3">
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            {t("searching")}
          </span>
        ) : formattedPreviewCount ? (
          <span className="inline-flex min-w-0 items-center gap-3 text-center">
            <span className="min-w-0 text-[17px] font-black tracking-wide sm:text-[19px]">
              {submitButtonLabel}
            </span>
            <ArrowRightIcon className="h-5 w-5 shrink-0 opacity-90" />
          </span>
        ) : isPreviewLoading ? (
          <span className="inline-flex items-center gap-3">
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            {t("updatingPreview")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-3 text-center">
            <span className="text-[17px] font-black tracking-wide">
              {submitButtonLabel}
            </span>
            <ArrowRightIcon className="h-5 w-5 shrink-0 opacity-90" />
          </span>
        )}
      </button>
      </form>
    </TooltipProvider>
  );
}
