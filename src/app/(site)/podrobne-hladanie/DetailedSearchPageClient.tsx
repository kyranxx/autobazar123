"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMarketCode } from "@/context/MarketContext";
import { usePublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/client";
import { detailedSearchStateFromParams, detailedSearchStateToParams, type DetailedSearchState } from "@/lib/algolia/detailed-search-state";
import { getMarketPath } from "@/lib/routes";
import { HOME_LOCATIONS } from "@/components/home/theme";
import { cn } from "@/utils/cn";

const FUEL_VALUES = ["petrol", "diesel", "electric", "hybrid", "lpg", "cng"] as const;
const BODY_STYLE_VALUES = [
  "sedan",
  "combi",
  "suv",
  "hatchback",
  "coupe",
  "cabriolet",
  "mpv",
  "pickup",
  "commercial",
] as const;
const TRANSMISSION_VALUES = ["manual", "automatic"] as const;

function textValue(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
  return event.target.value;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="!text-xl font-semibold tracking-tight text-text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-text-primary">
      {children}
    </label>
  );
}

function TextField({
  id,
  label,
  placeholder,
  value,
  onChange,
  icon,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        {icon ? <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span> : null}
        <input
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(textValue(event))}
          className={cn(
            "market-field h-12 w-full bg-background-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20",
            icon && "pl-10",
          )}
        />
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(textValue(event))}
          className="market-field h-12 w-full appearance-none bg-background-secondary px-3.5 pr-10 text-sm font-medium text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      </div>
    </div>
  );
}

function RangePair({
  label,
  fromLabel,
  toLabel,
  from,
  to,
  onFromChange,
  onToChange,
  suffix,
}: {
  label: string;
  fromLabel: string;
  toLabel: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  suffix: string;
}) {
  return (
    <fieldset className="rounded-xl border border-border-subtle bg-background-secondary/65 p-3">
      <legend className="px-1 text-sm font-semibold text-text-primary">{label}</legend>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="relative">
          <label htmlFor={`${label}-from`} className="sr-only">{fromLabel}</label>
          <input
            id={`${label}-from`}
            type="number"
            inputMode="numeric"
            min={0}
            value={from}
            placeholder={fromLabel}
            onChange={(event) => onFromChange(textValue(event))}
            className="market-field h-11 w-full bg-white px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">{suffix}</span>
        </div>
        <div className="relative">
          <label htmlFor={`${label}-to`} className="sr-only">{toLabel}</label>
          <input
            id={`${label}-to`}
            type="number"
            inputMode="numeric"
            min={0}
            value={to}
            placeholder={toLabel}
            onChange={(event) => onToChange(textValue(event))}
            className="market-field h-11 w-full bg-white px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">{suffix}</span>
        </div>
      </div>
    </fieldset>
  );
}

function ChoiceGroup({
  label,
  values,
  selected,
  labels,
  onToggle,
  selectedCount,
}: {
  label: string;
  values: readonly string[];
  selected: string[];
  labels: (value: string) => string;
  onToggle: (value: string) => void;
  selectedCount?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-text-primary">
        {label}
        {selectedCount ? <span className="ml-2 text-xs font-medium text-text-muted">{selectedCount}</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(value)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-border-subtle bg-white text-text-secondary hover:border-primary/45 hover:text-text-primary",
              )}
            >
              {isSelected ? <Check aria-hidden="true" className="size-4" /> : null}
              {labels(value)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ToggleChoice({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
        checked
          ? "border-primary bg-primary/5 text-text-primary"
          : "border-border-subtle bg-white text-text-secondary hover:border-primary/40 hover:text-text-primary",
      )}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded border-2",
          checked ? "border-primary bg-primary text-white" : "border-border-strong bg-background",
        )}
      >
        {checked ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  );
}

export default function DetailedSearchPageClient() {
  const locale = useLocale();
  const t = useTranslations("detailedSearch");
  const tFuel = useTranslations("fuel");
  const tBodyType = useTranslations("bodyType");
  const tTransmission = useTranslations("transmission");
  const searchParams = useSearchParams();
  const router = useRouter();
  const marketCode = useMarketCode();
  const { brandNames, modelsByBrandName } = usePublicVehicleTaxonomy();
  const queryString = searchParams.toString();
  const routeState = useMemo(
    () => detailedSearchStateFromParams(new URLSearchParams(queryString)),
    [queryString],
  );
  const [draft, setDraft] = useState<{
    queryString: string;
    state: DetailedSearchState;
  }>(() => ({ queryString, state: routeState }));
  const state = draft.queryString === queryString ? draft.state : routeState;

  const updateField = <K extends keyof DetailedSearchState>(
    key: K,
    value: DetailedSearchState[K],
  ) => {
    setDraft({
      queryString,
      state: { ...state, [key]: value },
    });
  };

  const toggleListValue = (
    key: "fuels" | "bodyStyles" | "transmissions" | "locations",
    value: string,
  ) => {
    setDraft((currentDraft) => {
      const currentState =
        currentDraft.queryString === queryString ? currentDraft.state : routeState;
      const values = currentState[key];
      return {
        queryString,
        state: {
          ...currentState,
          [key]: values.includes(value)
            ? values.filter((item) => item !== value)
            : [...values, value],
        },
      };
    });
  };

  const modelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          state.brands.flatMap((brand) => modelsByBrandName[brand] ?? []),
        ),
      )
        .sort((left, right) => left.localeCompare(right, locale))
        .map((model) => ({ label: model, value: model })),
    [locale, modelsByBrandName, state.brands],
  );

  const brandOptions = useMemo(
    () => brandNames.map((brand) => ({ label: brand, value: brand })),
    [brandNames],
  );

  const currentStateQuery = detailedSearchStateToParams(state).toString();
  const resultsHref = getMarketPath(
    currentStateQuery ? `/vysledky?${currentStateQuery}` : "/vysledky",
    marketCode,
  );

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(resultsHref);
  };

  const addBrand = (brand: string) => {
    if (!brand || state.brands.includes(brand)) return;
    updateField("brands", [...state.brands, brand]);
  };

  return (
    <main id="main-content" className="market-page min-h-screen bg-background pb-16 pt-5 sm:pt-8">
      <div className="container-main">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <a href={resultsHref} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary">
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("backToResults")}
          </a>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {t("title")}
          </span>
        </div>

        <div className="mb-6 max-w-3xl">
          <h1 className="!text-3xl font-semibold tracking-tight text-text-primary sm:!text-4xl">{t("title")}</h1>
          <p className="mt-2 text-base leading-relaxed text-text-secondary">{t("description")}</p>
        </div>

        <form onSubmit={submitSearch} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="space-y-4">
            <SectionCard title={t("basicSection")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="detailed-search-query"
                  label={t("queryLabel")}
                  placeholder={t("queryPlaceholder")}
                  value={state.q}
                  onChange={(value) => updateField("q", value)}
                  icon={<Search aria-hidden="true" className="size-4" />}
                />
                <div>
                  <FieldLabel htmlFor="detailed-search-brand">{t("brandLabel")}</FieldLabel>
                  <div className="relative">
                    <select
                      id="detailed-search-brand"
                      value=""
                      onChange={(event) => addBrand(event.target.value)}
                      className="market-field h-12 w-full appearance-none bg-background-secondary px-3.5 pr-10 text-sm font-medium text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/20"
                    >
                      <option value="">{t("brandPlaceholder")}</option>
                      {brandOptions
                        .filter((option) => !state.brands.includes(option.value))
                        .map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  </div>
                  {state.brands.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {state.brands.map((brand) => (
                        <span key={brand} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-2 text-sm font-semibold text-accent">
                          {brand}
                          <button
                            type="button"
                            aria-label={t("selectedBrandRemove", { brand })}
                            onClick={() => updateField("brands", state.brands.filter((item) => item !== brand))}
                            className="rounded-full p-0.5 hover:bg-accent/15"
                          >
                            <X aria-hidden="true" className="size-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <SelectField
                  id="detailed-search-model"
                  label={t("modelLabel")}
                  value={state.model}
                  placeholder={state.brands.length > 0 ? t("modelPlaceholder") : t("selectBrandFirst")}
                  options={modelOptions}
                  disabled={state.brands.length === 0}
                  onChange={(value) => updateField("model", value)}
                />
              </div>
            </SectionCard>

            <SectionCard title={t("rangesSection")} description={t("hint")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <RangePair
                  label={t("priceLabel")}
                  fromLabel={t("from")}
                  toLabel={t("to")}
                  from={state.priceFrom}
                  to={state.priceTo}
                  onFromChange={(value) => updateField("priceFrom", value)}
                  onToChange={(value) => updateField("priceTo", value)}
                  suffix="EUR"
                />
                <RangePair
                  label={t("mileageLabel")}
                  fromLabel={t("from")}
                  toLabel={t("to")}
                  from={state.mileageFrom}
                  to={state.mileageTo}
                  onFromChange={(value) => updateField("mileageFrom", value)}
                  onToChange={(value) => updateField("mileageTo", value)}
                  suffix="km"
                />
                <RangePair
                  label={t("yearLabel")}
                  fromLabel={t("from")}
                  toLabel={t("to")}
                  from={state.yearFrom}
                  to={state.yearTo}
                  onFromChange={(value) => updateField("yearFrom", value)}
                  onToChange={(value) => updateField("yearTo", value)}
                  suffix=""
                />
                <RangePair
                  label={t("powerLabel")}
                  fromLabel={t("from")}
                  toLabel={t("to")}
                  from={state.powerFrom}
                  to={state.powerTo}
                  onFromChange={(value) => updateField("powerFrom", value)}
                  onToChange={(value) => updateField("powerTo", value)}
                  suffix="kW"
                />
              </div>
            </SectionCard>

            <SectionCard title={t("technicalSection")}>
              <div className="space-y-5">
                <ChoiceGroup
                  label={t("fuelLabel")}
                  values={FUEL_VALUES}
                  selected={state.fuels}
                  labels={(value) => tFuel(value as Parameters<typeof tFuel>[0])}
                  onToggle={(value) => toggleListValue("fuels", value)}
                  selectedCount={state.fuels.length > 0 ? t("selectedCount", { count: state.fuels.length }) : undefined}
                />
                <ChoiceGroup
                  label={t("bodyStyleLabel")}
                  values={BODY_STYLE_VALUES}
                  selected={state.bodyStyles}
                  labels={(value) => tBodyType(value as Parameters<typeof tBodyType>[0])}
                  onToggle={(value) => toggleListValue("bodyStyles", value)}
                  selectedCount={state.bodyStyles.length > 0 ? t("selectedCount", { count: state.bodyStyles.length }) : undefined}
                />
                <ChoiceGroup
                  label={t("transmissionLabel")}
                  values={TRANSMISSION_VALUES}
                  selected={state.transmissions}
                  labels={(value) => tTransmission(value as Parameters<typeof tTransmission>[0])}
                  onToggle={(value) => toggleListValue("transmissions", value)}
                  selectedCount={state.transmissions.length > 0 ? t("selectedCount", { count: state.transmissions.length }) : undefined}
                />
              </div>
            </SectionCard>

            <SectionCard title={t("locationTrustSection")}>
              <div className="space-y-5">
                <ChoiceGroup
                  label={t("locationLabel")}
                  values={HOME_LOCATIONS}
                  selected={state.locations}
                  labels={(value) => value}
                  onToggle={(value) => toggleListValue("locations", value)}
                  selectedCount={state.locations.length > 0 ? t("selectedCount", { count: state.locations.length }) : undefined}
                />
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-text-primary">{t("trustLabel")}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ToggleChoice checked={state.hasServiceBook} label={t("serviceBook")} onChange={() => updateField("hasServiceBook", !state.hasServiceBook)} />
                    <ToggleChoice checked={state.notCrashed} label={t("notCrashed")} onChange={() => updateField("notCrashed", !state.notCrashed)} />
                    <ToggleChoice checked={state.boughtInSk} label={t("boughtInMarket")} onChange={() => updateField("boughtInSk", !state.boughtInSk)} />
                    <ToggleChoice checked={state.vatDeductible} label={t("vatDeductible")} onChange={() => updateField("vatDeductible", !state.vatDeductible)} />
                  </div>
                </fieldset>
              </div>
            </SectionCard>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-primary/15 bg-primary p-4 text-white shadow-sm sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">{t("title")}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/85">{t("description")}</p>
              <button
                type="submit"
                className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                {t("submit")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
              <a href={resultsHref} className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/30 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                {t("backToResults")}
              </a>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
