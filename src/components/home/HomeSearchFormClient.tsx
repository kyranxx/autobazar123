"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/Icons";
import { HOME_BRANDS, HOME_LOCATIONS, HOME_MODELS } from "@/components/home/theme";

export default function HomeSearchFormClient() {
  const router = useRouter();
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

  const modelOptions = useMemo(() => HOME_MODELS[brand] ?? [], [brand]);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (brand) params.set("brand", brand);
    if (model) params.set("model", model);
    if (fuel) params.set("fuel", fuel);
    if (transmission) params.set("transmission", transmission);
    if (bodyStyle) params.set("bodyStyle", bodyStyle);
    if (location) params.set("location", location);
    if (priceFrom) params.set("priceFrom", priceFrom);
    if (priceTo) params.set("priceTo", priceTo);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);
    if (hasServiceBook) params.set("hasServiceBook", "true");
    if (notCrashed) params.set("notCrashed", "true");
    if (boughtInSk) params.set("boughtInSk", "true");

    router.push(params.toString() ? `/vysledky?${params.toString()}` : "/vysledky");
  };

  return (
    <form
      onSubmit={onSearch}
      className="mt-8 rounded-[26px] border border-border-strong/80 bg-background-secondary/95 p-4 text-text-primary shadow-xl sm:p-5"
    >
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="group relative lg:col-span-6">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Znacka, model alebo mesto"
            className="h-14 w-full rounded-2xl border-2 border-border-strong bg-background-secondary pl-12 pr-4 text-base font-semibold shadow-sm outline-none focus:border-[var(--home-link)] focus:ring-4 focus:ring-[var(--home-brand-soft)]"
          />
        </div>
        <select
          value={brand}
          onChange={(event) => {
            setBrand(event.target.value);
            setModel("");
          }}
          className="h-14 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold lg:col-span-2"
        >
          <option value="">Znacka</option>
          {HOME_BRANDS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={fuel}
          onChange={(event) => setFuel(event.target.value)}
          className="h-14 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold lg:col-span-2"
        >
          <option value="">Palivo</option>
          <option value="petrol">petrol</option>
          <option value="diesel">diesel</option>
          <option value="electric">electric</option>
          <option value="hybrid">hybrid</option>
        </select>
        <select
          value={priceTo}
          onChange={(event) => setPriceTo(event.target.value)}
          className="h-14 rounded-2xl border border-border bg-background-secondary px-3 text-sm font-semibold lg:col-span-2"
        >
          <option value="">Cena do</option>
          <option value="10000">10,000 EUR</option>
          <option value="20000">20,000 EUR</option>
          <option value="35000">35,000 EUR</option>
          <option value="50000">50,000 EUR</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((value) => !value)}
        className="mt-4 inline-flex h-11 items-center rounded-xl border border-border bg-background-muted px-4 text-xs font-bold uppercase tracking-wide text-text-secondary"
      >
        {showAdvanced ? "Skryt pokrocile filtre" : "Zobrazit pokrocile filtre"}
      </button>

      <div
        className={`grid gap-3 overflow-hidden transition-all sm:grid-cols-2 lg:grid-cols-4 ${showAdvanced ? "mt-4 max-h-[520px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <select
          value={model}
          onChange={(event) => setModel(event.target.value)}
          disabled={!brand}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold disabled:bg-background-muted"
        >
          <option value="">Model</option>
          {modelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Lokalita</option>
          {HOME_LOCATIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={transmission}
          onChange={(event) => setTransmission(event.target.value)}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Prevodovka</option>
          <option value="manual">manual</option>
          <option value="automatic">automatic</option>
        </select>
        <select
          value={bodyStyle}
          onChange={(event) => setBodyStyle(event.target.value)}
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        >
          <option value="">Karoseria</option>
          <option value="hatchback">hatchback</option>
          <option value="sedan">sedan</option>
          <option value="wagon">wagon</option>
          <option value="suv">suv</option>
          <option value="coupe">coupe</option>
          <option value="van">van</option>
        </select>
        <input
          type="number"
          min="0"
          value={priceFrom}
          onChange={(event) => setPriceFrom(event.target.value)}
          placeholder="Cena od"
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        />
        <input
          type="number"
          min="1900"
          value={yearFrom}
          onChange={(event) => setYearFrom(event.target.value)}
          placeholder="Rok od"
          className="h-12 rounded-xl border border-border bg-background-secondary px-3 text-sm font-semibold"
        />
        <input
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
              type="checkbox"
              checked={hasServiceBook}
              onChange={(event) => setHasServiceBook(event.target.checked)}
              className="h-4 w-4"
            />
            Servisna knizka
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={notCrashed}
              onChange={(event) => setNotCrashed(event.target.checked)}
              className="h-4 w-4"
            />
            Nehavarovane
          </label>
          <label className="inline-flex items-center gap-2">
            <input
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
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--home-cta)] px-5 py-3 text-base font-black text-[var(--home-cta-text)] shadow-lg"
      >
        Hladat auta
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
