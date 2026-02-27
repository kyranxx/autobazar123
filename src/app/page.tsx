"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/Icons";

const THEME = {
  brand: "#1F4D3B",
  link: "#1F4D3B",
  cta: "#E8621A",
  ctaText: "#FFFFFF",
  success: "#1E7B47",
  danger: "#B63B31",
  softSurface: "#F3F7F2",
  darkSurface: "#163126",
};

const BRANDS = ["Audi", "BMW", "Mercedes-Benz", "Skoda", "Toyota", "Volkswagen"];
const MODELS: Record<string, string[]> = {
  Audi: ["A3", "A4", "A6", "Q5"], BMW: ["1 Series", "3 Series", "5 Series", "X3"],
  "Mercedes-Benz": ["A", "C", "E", "GLC"], Skoda: ["Fabia", "Octavia", "Superb", "Kodiaq"],
  Toyota: ["Corolla", "Camry", "RAV4", "Yaris"], Volkswagen: ["Golf", "Passat", "Tiguan", "Touareg"],
};
const LOCATIONS = ["Bratislava", "Kosice", "Trnava", "Nitra", "Zilina", "Banska Bystrica"];

function withAlpha(hex: string, alpha: number) {
  const n = hex.replace("#", "");
  const h = n.length === 3 ? n.split("").map((c) => `${c}${c}`).join("") : n;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Home() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const h = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const modelOptions = useMemo(() => MODELS[brand] ?? [], [brand]);
  const avatar = profile?.avatar_url || (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined);
  const displayName = profile?.full_name || user?.email || "Pouzivatel";
  const initials = displayName.slice(0, 2).toUpperCase();

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim()); if (brand) p.set("brand", brand); if (model) p.set("model", model);
    if (fuel) p.set("fuel", fuel); if (transmission) p.set("transmission", transmission); if (bodyStyle) p.set("bodyStyle", bodyStyle);
    if (location) p.set("location", location); if (priceFrom) p.set("priceFrom", priceFrom); if (priceTo) p.set("priceTo", priceTo);
    if (yearFrom) p.set("yearFrom", yearFrom); if (yearTo) p.set("yearTo", yearTo);
    if (hasServiceBook) p.set("hasServiceBook", "true"); if (notCrashed) p.set("notCrashed", "true"); if (boughtInSk) p.set("boughtInSk", "true");
    router.push(p.toString() ? `/vysledky?${p.toString()}` : "/vysledky");
  };

  const vars = useMemo(() => ({
    "--home-brand": THEME.brand, "--home-link": THEME.link, "--home-cta": THEME.cta, "--home-cta-text": THEME.ctaText,
    "--home-soft-surface": THEME.softSurface, "--home-dark-surface": THEME.darkSurface, "--home-brand-soft": withAlpha(THEME.brand, 0.12),
  }) as CSSProperties, []);

  return (
    <div style={vars} className="min-h-screen bg-[var(--home-soft-surface)] text-zinc-900">
      <div className="w-full bg-[var(--home-brand)] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6">
          <div className="flex flex-wrap items-center gap-2 font-semibold uppercase tracking-wide"><span className="rounded-full bg-white/15 px-2 py-1">Overene inzeraty</span><span className="rounded-full bg-white/15 px-2 py-1">Bezpecny predaj</span><span className="rounded-full bg-white/15 px-2 py-1">Podpora 7/7</span></div>
          <div className="flex items-center gap-4 font-semibold"><Link href="/kontakt">Kontakt</Link><Link href="/kredity">Kredity</Link></div>
        </div>
      </div>

      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-2xl font-black uppercase tracking-tight">Autobazar<span className="ml-0.5 inline-block text-[1.12em] text-[var(--home-cta)]">123</span></Link>
          <div className="hidden gap-8 text-sm font-bold uppercase tracking-wider md:flex"><Link href="/vysledky" className="text-[var(--home-link)]">Vysledky</Link><Link href="/predajcovia" className="text-[var(--home-link)]">Predajcovia</Link></div>
          <div className="flex items-center gap-3">
            {loading ? <span className="inline-flex h-10 w-10 animate-pulse rounded-full bg-zinc-200" aria-hidden /> : user ? (
              <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setMenuOpen((v) => !v)} className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white text-xs font-bold" aria-expanded={menuOpen}>
                  {avatar ? <Image src={avatar} alt={displayName} fill sizes="40px" className="object-cover" /> : initials}
                </button>
                <div className={`absolute right-0 top-full mt-2 w-44 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} role="menu">
                  <Link href="/moj-ucet" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50" role="menuitem">Dashboard</Link>
                  <button type="button" onClick={() => { setMenuOpen(false); void signOut(); }} className="block w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50" role="menuitem">Sign out</button>
                </div>
              </div>
            ) : <Link href="/auth/login?redirect=%2Fmoj-ucet" className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold uppercase tracking-wide">Prihlasit sa</Link>}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <section className="relative overflow-hidden rounded-[36px] bg-[var(--home-dark-surface)] text-white shadow-xl">
          <Image src="/hero-forest-champagne.jpg" alt="SUV at sunset" fill className="object-cover" style={{ objectPosition: "center 58%" }} priority />
          <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${withAlpha(THEME.brand, 0.74)} 0%, rgba(10,10,10,0.58) 54%, ${withAlpha(THEME.cta, 0.28)} 100%)` }} />
          <div className="relative z-10 p-6 sm:p-10 lg:p-12">
            <span className="inline-flex rounded-full bg-[var(--home-brand-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">Rychle hladanie</span>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Najdite svoje dalsie auto za par sekund.</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-zinc-200 sm:text-base">Klucove filtre su hore. Ostatne su v rozbaleni.</p>

            <form onSubmit={onSearch} className="mt-8 rounded-[26px] border border-zinc-200/80 bg-white/95 p-4 text-zinc-900 shadow-2xl sm:p-5">
              <div className="grid gap-3 lg:grid-cols-12">
                <div className="group relative lg:col-span-6"><SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" /><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Znacka, model alebo mesto" className="h-14 w-full rounded-2xl border-2 border-zinc-300 bg-white pl-12 pr-4 text-base font-semibold shadow-sm outline-none focus:border-[var(--home-link)] focus:ring-4 focus:ring-[var(--home-brand-soft)]" /></div>
                <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); }} className="h-14 rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-semibold lg:col-span-2"><option value="">Znacka</option>{BRANDS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="h-14 rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-semibold lg:col-span-2"><option value="">Palivo</option><option value="petrol">petrol</option><option value="diesel">diesel</option><option value="electric">electric</option><option value="hybrid">hybrid</option></select>
                <select value={priceTo} onChange={(e) => setPriceTo(e.target.value)} className="h-14 rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-semibold lg:col-span-2"><option value="">Cena do</option><option value="10000">10,000 EUR</option><option value="20000">20,000 EUR</option><option value="35000">35,000 EUR</option><option value="50000">50,000 EUR</option></select>
              </div>

              <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="mt-4 inline-flex h-11 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-bold uppercase tracking-wide text-zinc-700">{showAdvanced ? "Skryt pokrocile filtre" : "Zobrazit pokrocile filtre"}</button>

              <div className={`grid gap-3 overflow-hidden transition-all sm:grid-cols-2 lg:grid-cols-4 ${showAdvanced ? "mt-4 max-h-[520px] opacity-100" : "max-h-0 opacity-0"}`}>
                <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand} className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold disabled:bg-zinc-100"><option value="">Model</option>{modelOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold"><option value="">Lokalita</option>{LOCATIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold"><option value="">Prevodovka</option><option value="manual">manual</option><option value="automatic">automatic</option></select>
                <select value={bodyStyle} onChange={(e) => setBodyStyle(e.target.value)} className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold"><option value="">Karoseria</option><option value="hatchback">hatchback</option><option value="sedan">sedan</option><option value="wagon">wagon</option><option value="suv">suv</option><option value="coupe">coupe</option><option value="van">van</option></select>
                <input type="number" min="0" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} placeholder="Cena od" className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold" />
                <input type="number" min="1900" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="Rok od" className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold" />
                <input type="number" min="1900" value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="Rok do" className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold" />
                <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-700 sm:col-span-2 lg:col-span-1">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={hasServiceBook} onChange={(e) => setHasServiceBook(e.target.checked)} className="h-4 w-4" />Servisna knizka</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={notCrashed} onChange={(e) => setNotCrashed(e.target.checked)} className="h-4 w-4" />Nehavarovane</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={boughtInSk} onChange={(e) => setBoughtInSk(e.target.checked)} className="h-4 w-4" />Kupene v SR</label>
                </div>
              </div>

              <button type="submit" className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--home-cta)] px-5 py-3 text-base font-black text-[var(--home-cta-text)] shadow-lg">Hladat auta<ArrowRightIcon className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
