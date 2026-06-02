"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDots, CurrencyEur, GasPump } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { SearchIcon } from "@/components/ui/Icons";
import { useIconWeight } from "@/context/IconWeightContext";
import { usePublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/client";

function normalizeNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

export default function HomeFrontpageSearch() {
  const router = useRouter();
  const tHome = useTranslations("homePage");
  const tHomeSearch = useTranslations("homeSearch");
  const tSearch = useTranslations("search");
  const tFilters = useTranslations("filters");
  const tFuel = useTranslations("fuel");
  const { weight } = useIconWeight();
  const { taxonomy } = usePublicVehicleTaxonomy();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [fuel, setFuel] = useState("");

  const selectedBrand = useMemo(
    () => taxonomy.brands.find((entry) => entry.name === brand),
    [brand, taxonomy.brands],
  );

  const modelOptions = selectedBrand
    ? taxonomy.modelsByBrandId[selectedBrand.id] ?? []
    : [];

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 22 }, (_, index) => String(currentYear - index));
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (brand) params.append("brand", brand);
    if (model) params.set("model", model);
    if (priceFrom) params.set("priceFrom", normalizeNumber(priceFrom));
    if (priceTo) params.set("priceTo", normalizeNumber(priceTo));
    if (yearFrom) params.set("yearFrom", normalizeNumber(yearFrom));
    if (fuel) params.set("fuel", fuel);

    const query = params.toString();
    router.push(query ? `/vysledky?${query}` : "/vysledky");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-[18px] border border-black/10 bg-white p-4 text-text-primary shadow-[0_18px_45px_-28px_rgba(17,24,39,0.65)] sm:p-5 lg:p-6"
    >
      <div className="flex items-center gap-7 border-b border-border-subtle">
        <button
          type="button"
          className="relative -mb-px min-h-12 border-b-[3px] border-[var(--home-brand)] px-1 text-sm font-black text-[var(--home-brand)]"
        >
          {tHomeSearch("search")}
        </button>
        <Link
          href="/pridat-inzerat"
          className="min-h-12 px-1 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          {tHome("ctaSellCar")}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <SearchSelect
          label={tSearch("brand")}
          value={brand}
          onChange={(nextBrand) => {
            setBrand(nextBrand);
            setModel("");
          }}
          placeholder={tFilters("allBrands")}
          options={taxonomy.brands.map((entry) => ({
            value: entry.name,
            label: entry.name,
          }))}
        />
        <SearchSelect
          label={tSearch("model")}
          value={model}
          onChange={setModel}
          placeholder={brand ? tFilters("allModels") : tHomeSearch("selectBrandFirst")}
          options={modelOptions.map((entry) => ({
            value: entry.name,
            label: entry.name,
          }))}
          disabled={!brand}
        />
        <SearchTextField
          label={tSearch("priceFrom")}
          value={priceFrom}
          onChange={setPriceFrom}
          placeholder={tFilters("min")}
          icon={<CurrencyEur weight={weight} className="size-4" />}
        />
        <SearchTextField
          label={tSearch("priceTo")}
          value={priceTo}
          onChange={setPriceTo}
          placeholder={tFilters("max")}
          icon={<CurrencyEur weight={weight} className="size-4" />}
        />
        <SearchSelect
          label={tSearch("yearFrom")}
          value={yearFrom}
          onChange={setYearFrom}
          placeholder={tSearch("yearFrom")}
          options={yearOptions.map((year) => ({ value: year, label: year }))}
          icon={<CalendarDots weight={weight} className="size-4" />}
        />
        <SearchSelect
          label={tSearch("fuel")}
          value={fuel}
          onChange={setFuel}
          placeholder={tFilters("fuelTitle")}
          options={[
            { value: "petrol", label: tFuel("petrol") },
            { value: "diesel", label: tFuel("diesel") },
            { value: "electric", label: tFuel("electric") },
            { value: "hybrid", label: tFuel("hybrid") },
          ]}
          icon={<GasPump weight={weight} className="size-4" />}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/vysledky"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-[var(--home-brand)] transition-colors hover:text-[var(--home-brand-hover)]"
        >
          <SearchIcon className="size-4" />
          {tSearch("advancedSearch")}
        </Link>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[var(--home-brand)] px-8 text-sm font-black text-white shadow-[0_14px_28px_-18px_rgba(0,92,51,0.7)] transition-colors hover:bg-[var(--home-brand-hover)] sm:min-w-[17rem]"
        >
          {tHomeSearch("search")}
          <SearchIcon className="size-5" />
        </button>
      </div>
    </form>
  );
}

function SearchSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
  icon,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="group relative block min-w-0">
      <span className="absolute left-3 top-2 z-10 text-[10px] font-semibold text-text-secondary">
        {label}
      </span>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-[2.1rem] z-10 text-[var(--home-brand)]">
          {icon}
        </span>
      ) : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`h-[4.05rem] w-full appearance-none rounded-lg border border-border-subtle bg-white pb-2 pt-6 text-sm font-semibold text-text-primary shadow-sm outline-none transition-colors focus:border-[var(--home-brand)] focus:ring-2 focus:ring-[var(--home-mint)]/25 disabled:cursor-not-allowed disabled:opacity-60 ${
          icon ? "pl-10 pr-9" : "px-3 pr-9"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-[2.15rem] text-text-secondary">
        <svg className="size-3.5" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1.5L6 6.5L11 1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

function SearchTextField({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="absolute left-3 top-2 z-10 text-[10px] font-semibold text-text-secondary">
        {label}
      </span>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-[2.1rem] z-10 text-[var(--home-brand)]">
          {icon}
        </span>
      ) : null}
      <input
        value={value}
        onChange={(event) => onChange(normalizeNumber(event.target.value))}
        inputMode="numeric"
        placeholder={placeholder}
        className={`h-[4.05rem] w-full rounded-lg border border-border-subtle bg-white pb-2 pt-6 text-sm font-semibold text-text-primary shadow-sm outline-none transition-colors placeholder:text-text-secondary focus:border-[var(--home-brand)] focus:ring-2 focus:ring-[var(--home-mint)]/25 ${
          icon ? "pl-10 pr-3" : "px-3"
        }`}
      />
    </label>
  );
}
