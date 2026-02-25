"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  LocationIcon,
  PlusIcon,
  SearchIcon,
  TagIcon
} from "@/components/ui/Icons";

type ThemeKey =
  | "tealBurntOrange"
  | "navyAmber"
  | "charcoalRedOrange"
  | "forestChampagne"
  | "indigoCoral";

type HomeTheme = {
  buttonLabel: string;
  title: string;
  brand: string;
  link: string;
  cta: string;
  ctaText: string;
  success: string;
  danger: string;
  softSurface: string;
  darkSurface: string;
};

type FeaturedCar = {
  id: string;
  name: string;
  price: string;
  location: string;
  year: string;
  km: string;
  badge: string;
  image: string;
};

type HeroVisual = {
  image: string;
  alt: string;
  imagePosition: string;
};

const HOME_THEMES: Record<ThemeKey, HomeTheme> = {
  tealBurntOrange: {
    buttonLabel: "Teal + Burnt Orange",
    title: "Moderná, dôveryhodná",
    brand: "#0F5E5A",
    link: "#0F5E5A",
    cta: "#C84A00",
    ctaText: "#FFFFFF",
    success: "#0F7A3A",
    danger: "#C62828",
    softSurface: "#F2F7F7",
    darkSurface: "#163532"
  },
  navyAmber: {
    buttonLabel: "Navy + Amber",
    title: "Konzervatívna, inštitucionálna dôvera",
    brand: "#0B2E4A",
    link: "#0B2E4A",
    cta: "#E69F00",
    ctaText: "#111111",
    success: "#0F7A3A",
    danger: "#C62828",
    softSurface: "#F2F5F8",
    darkSurface: "#0A253B"
  },
  charcoalRedOrange: {
    buttonLabel: "Charcoal + Red Orange",
    title: "Energické trhovisko",
    brand: "#1F1F1F",
    link: "#0F5E5A",
    cta: "#D9480F",
    ctaText: "#FFFFFF",
    success: "#0F7A3A",
    danger: "#C62828",
    softSurface: "#F7F4F2",
    darkSurface: "#1F1F1F"
  },
  forestChampagne: {
    buttonLabel: "Forest + Champagne",
    title: "Prémiová pokojná istota",
    brand: "#1F4D3B",
    link: "#1F4D3B",
    cta: "#CFA15A",
    ctaText: "#111111",
    success: "#1E7B47",
    danger: "#B63B31",
    softSurface: "#F3F7F2",
    darkSurface: "#162A21"
  },
  indigoCoral: {
    buttonLabel: "Indigo + Coral",
    title: "Vysoký kontrast pre akciu",
    brand: "#1E3A8A",
    link: "#1E3A8A",
    cta: "#C73E1D",
    ctaText: "#FFFFFF",
    success: "#167A46",
    danger: "#C62828",
    softSurface: "#F3F5FB",
    darkSurface: "#14244F"
  }
};

const THEME_ORDER: ThemeKey[] = [
  "tealBurntOrange",
  "navyAmber",
  "charcoalRedOrange",
  "forestChampagne",
  "indigoCoral"
];

const FEATURED_CARS: FeaturedCar[] = [
  {
    id: "car-1",
    name: "Volkswagen Golf VII",
    price: "12,900 EUR",
    location: "Bratislava",
    year: "2019",
    km: "98,000 km",
    badge: "Top ponuka",
    image: "/placeholder-car.jpg"
  },
  {
    id: "car-2",
    name: "Skoda Octavia IV",
    price: "24,500 EUR",
    location: "Trnava",
    year: "2022",
    km: "34,000 km",
    badge: "Overený predajca",
    image: "/placeholder-car.jpg"
  },
  {
    id: "car-3",
    name: "Toyota RAV4 Hybrid",
    price: "32,000 EUR",
    location: "Žilina",
    year: "2021",
    km: "41,000 km",
    badge: "Znížená cena",
    image: "/placeholder-car.jpg"
  }
];

const HERO_VISUALS: Record<ThemeKey, HeroVisual> = {
  tealBurntOrange: {
    image: "/hero-teal-burnt-orange.jpg",
    alt: "Oranžové športové auto na otvorenej ceste pri západe slnka",
    imagePosition: "center 60%"
  },
  navyAmber: {
    image: "/hero-navy-amber.jpg",
    alt: "Modré luxusné auto vo večernom mestskom osvetlení",
    imagePosition: "center 62%"
  },
  charcoalRedOrange: {
    image: "/hero-charcoal-red-orange.jpg",
    alt: "Červené výkonné auto v tmavej mestskej scéne",
    imagePosition: "center 56%"
  },
  forestChampagne: {
    image: "/hero-forest-champagne.jpg",
    alt: "Prémiové auto zaparkované pri zelenom svahu",
    imagePosition: "center 58%"
  },
  indigoCoral: {
    image: "/hero-indigo-coral.jpg",
    alt: "Modré moderné kupé na širokej ceste za súmraku",
    imagePosition: "center 60%"
  }
};

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const isShortHex = normalized.length === 3;
  const fullHex = isShortHex
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  const red = Number.parseInt(fullHex.slice(0, 2), 16);
  const green = Number.parseInt(fullHex.slice(2, 4), 16);
  const blue = Number.parseInt(fullHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function Home() {
  const router = useRouter();
  const { user, profile, loading, isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [fuel, setFuel] = useState("all");
  const [transmission, setTransmission] = useState("all");
  const [budgetTo, setBudgetTo] = useState("any");
  const [activeThemeKey, setActiveThemeKey] = useState<ThemeKey>("tealBurntOrange");
  const activeTheme = HOME_THEMES[activeThemeKey];
  const activeHeroVisual = HERO_VISUALS[activeThemeKey];
  const identityData = user?.identities?.[0]?.identity_data as Record<string, unknown> | undefined;
  const avatarUrl =
    (typeof user?.user_metadata?.avatar_url === "string"
      ? (user.user_metadata.avatar_url as string)
      : undefined) ||
    (typeof user?.user_metadata?.picture === "string"
      ? (user.user_metadata.picture as string)
      : undefined) ||
    (identityData && typeof identityData.avatar_url === "string"
      ? (identityData.avatar_url as string)
      : undefined) ||
    (identityData && typeof identityData.picture === "string"
      ? (identityData.picture as string)
      : undefined) ||
    (profile?.avatar_url ?? undefined);
  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string"
      ? (user.user_metadata.full_name as string)
      : undefined) ||
    user?.email ||
    "Používateľ";
  const userInitials =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "U";

  const handleHeroSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const normalizedQuery = query.trim();

    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    }

    if (fuel !== "all") {
      params.set("fuel", fuel);
    }

    if (transmission !== "all") {
      params.set("transmission", transmission);
    }

    if (budgetTo !== "any") {
      params.set("priceTo", budgetTo);
    }

    const destination = params.toString() ? `/vysledky?${params.toString()}` : "/vysledky";
    router.push(destination);
  };

  const themeVars = useMemo(
    () =>
      ({
        "--home-brand": activeTheme.brand,
        "--home-link": activeTheme.link,
        "--home-cta": activeTheme.cta,
        "--home-cta-text": activeTheme.ctaText,
        "--home-success": activeTheme.success,
        "--home-danger": activeTheme.danger,
        "--home-soft-surface": activeTheme.softSurface,
        "--home-dark-surface": activeTheme.darkSurface,
        "--home-brand-soft": withAlpha(activeTheme.brand, 0.12),
        "--home-cta-soft": withAlpha(activeTheme.cta, 0.14),
        "--home-danger-soft": withAlpha(activeTheme.danger, 0.14)
      }) as CSSProperties,
    [activeTheme]
  );

  return (
    <div
      style={themeVars}
      className="min-h-screen bg-[var(--home-soft-surface)] font-sans text-zinc-900 selection:bg-[var(--home-cta)] selection:text-[var(--home-cta-text)]"
    >
      <div className="w-full bg-[var(--home-brand)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-semibold tracking-wide text-white/90">Paleta úvodnej stránky: {activeTheme.title}</p>
              <p className="text-xs font-medium text-white/70">Prepínajte témy a porovnajte odkazy, CTA, karty a stavy.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {THEME_ORDER.map((themeKey) => {
                const theme = HOME_THEMES[themeKey];
                const isActive = themeKey === activeThemeKey;

                return (
                  <button
                    key={themeKey}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveThemeKey(themeKey)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold transition ${
                      isActive ? "border-white bg-white text-zinc-900" : "border-white/50 bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.brand }} />
                    {theme.buttonLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--home-success)" }} />
                Úspech
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--home-danger)" }} />
                Riziko
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter sm:text-2xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--home-cta)] text-[var(--home-cta-text)]">
              <PlusIcon className="h-6 w-6 rotate-45" />
            </div>
            <span className="whitespace-nowrap">
              Autobazar<span className="text-[var(--home-link)]">123</span>
            </span>
          </Link>

          <div className="hidden gap-8 text-sm font-bold uppercase tracking-wider md:flex">
            <Link href="/vysledky" className="text-[var(--home-link)] hover:brightness-90">
              Výsledky
            </Link>
            <Link href="/moj-ucet" className="text-[var(--home-link)] hover:brightness-90">
              Môj účet
            </Link>
            {isAdmin ? (
              <Link href="/admin" className="text-[var(--home-link)] hover:brightness-90">
                Admin
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/vysledky"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-[var(--home-link)] transition hover:bg-zinc-50 sm:w-auto sm:gap-2 sm:px-3 sm:text-xs sm:font-bold sm:uppercase sm:tracking-wide"
              aria-label="Výsledky"
            >
              <SearchIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Výsledky</span>
            </Link>

            {loading ? (
              <span className="inline-flex h-10 w-10 animate-pulse rounded-full bg-zinc-200" aria-hidden />
            ) : user ? (
              <Link
                href="/moj-ucet"
                className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                aria-label={`Môj účet: ${displayName}`}
                title={displayName}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName} fill sizes="40px" className="object-cover" />
                ) : (
                  userInitials
                )}
              </Link>
            ) : (
              <Link
                href="/auth/login?redirect=%2Fmoj-ucet"
                className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-2.5 text-[11px] font-bold uppercase tracking-wide text-zinc-700 transition hover:bg-zinc-50 sm:px-3 sm:text-xs"
              >
                Prihlásiť sa
              </Link>
            )}

            <Link
              href="/pridat-inzerat"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--home-cta)] text-[var(--home-cta-text)] transition hover:brightness-95 active:scale-95 sm:w-auto sm:gap-2 sm:px-5 sm:text-sm sm:font-bold sm:tracking-normal"
              aria-label="Pridať inzerát"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Pridať inzerát</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[var(--home-dark-surface)] text-white shadow-xl"
        >
          <Image src={activeHeroVisual.image} alt={activeHeroVisual.alt} fill className="object-cover" style={{ objectPosition: activeHeroVisual.imagePosition }} priority />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(120deg, ${withAlpha(activeTheme.brand, 0.74)} 0%, rgba(10,10,10,0.58) 54%, ${withAlpha(activeTheme.cta, 0.28)} 100%)`
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 80% 15%, ${withAlpha(activeTheme.cta, 0.28)}, transparent 46%)`
            }}
          />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ backgroundColor: "var(--home-brand-soft)" }}>
                Úvodný blok s vyhľadávaním a filtrami
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight !text-white sm:text-5xl lg:text-6xl">
                Nájdite svoje ďalšie auto rýchlejšie <span className="text-white">pomocou presných filtrov</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-medium text-zinc-200 sm:text-base">
                Preskočte zdĺhavé prehliadanie. Začnite s jasným zámerom vyhľadávania, použite kľúčové filtre v jednom kroku a choďte rovno na relevantnú ponuku.
              </p>
            </div>

            <form onSubmit={handleHeroSearch} className="mt-8 rounded-[28px] border border-zinc-200/80 bg-white/95 p-4 text-zinc-900 shadow-2xl backdrop-blur-sm sm:p-5">
              <div className="grid gap-3 lg:grid-cols-12">
                <div className="group relative lg:col-span-5">
                  <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-[var(--home-link)]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Značka, model, mesto..."
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-[var(--home-link)] focus:ring-2 focus:ring-[var(--home-brand-soft)]"
                  />
                </div>

                <select
                  value={fuel}
                  onChange={(event) => setFuel(event.target.value)}
                  className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[var(--home-link)] focus:ring-2 focus:ring-[var(--home-brand-soft)] lg:col-span-2"
                >
                  <option value="all">Palivo: všetko</option>
                  <option value="petrol">Benzín</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Elektro</option>
                  <option value="hybrid">Hybrid</option>
                </select>

                <select
                  value={transmission}
                  onChange={(event) => setTransmission(event.target.value)}
                  className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[var(--home-link)] focus:ring-2 focus:ring-[var(--home-brand-soft)] lg:col-span-2"
                >
                  <option value="all">Prevodovka: všetko</option>
                  <option value="manual">Manuálna</option>
                  <option value="automatic">Automatická</option>
                </select>

                <select
                  value={budgetTo}
                  onChange={(event) => setBudgetTo(event.target.value)}
                  className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[var(--home-link)] focus:ring-2 focus:ring-[var(--home-brand-soft)] lg:col-span-2"
                >
                  <option value="any">Rozpočet: bez limitu</option>
                  <option value="10000">Do 10,000 EUR</option>
                  <option value="20000">Do 20,000 EUR</option>
                  <option value="35000">Do 35,000 EUR</option>
                  <option value="50000">Do 50,000 EUR</option>
                </select>

                <button
                  type="submit"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--home-cta)] px-4 text-sm font-black text-[var(--home-cta-text)] transition hover:brightness-95 active:scale-[0.98] lg:col-span-1"
                >
                  Hľadať
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setFuel("hybrid");
                    setBudgetTo("20000");
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 transition hover:border-[var(--home-link)] hover:text-[var(--home-link)]"
                >
                  <TagIcon className="h-3 w-3" />
                  Hybrid do 20k
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransmission("automatic");
                    setBudgetTo("35000");
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 transition hover:border-[var(--home-link)] hover:text-[var(--home-link)]"
                >
                  <TagIcon className="h-3 w-3" />
                  Automat do 35k
                </button>
                <button
                  type="button"
                  onClick={() => setQuery("SUV")}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 transition hover:border-[var(--home-link)] hover:text-[var(--home-link)]"
                >
                  <TagIcon className="h-3 w-3" />
                  Obľúbené: SUV
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1" style={{ color: "var(--home-success)", backgroundColor: withAlpha(activeTheme.success, 0.18) }}>
                <CheckCircleIcon className="h-3 w-3" /> overená ponuka
              </span>
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1" style={{ color: "var(--home-danger)", backgroundColor: "var(--home-danger-soft)" }}>
                <CheckCircleIcon className="h-3 w-3" /> kontroly rizika zapnuté
              </span>
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-white/90" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>
                12 482 aktívnych vozidiel
              </span>
            </div>
          </div>
        </motion.section>

        <section className="mt-16 grid gap-4 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-zinc-200 md:grid-cols-3">
          <div className="rounded-2xl border p-4" style={{ borderColor: "var(--home-brand-soft)" }}>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--home-link)" }}>
              Farba odkazov v kontexte
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Inzeráty, záložky a navigačné odkazy používajú farbu odkazov danej schémy.
            </p>
            <Link href="/vysledky" className="mt-3 inline-flex text-sm font-bold" style={{ color: "var(--home-link)" }}>
              Preskúmať všetky autá
            </Link>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: "var(--home-cta-soft)" }}>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Náhľad kontrastu CTA</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-black"
                style={{ backgroundColor: "var(--home-cta)", color: "var(--home-cta-text)" }}
              >
                Primárne CTA
              </button>
              <button type="button" className="rounded-xl px-4 py-2 text-sm font-bold" style={{ backgroundColor: "var(--home-brand-soft)" }}>
                Sekundárne
              </button>
            </div>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: "var(--home-danger-soft)" }}>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Ukážka stavových farieb</p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: "var(--home-success)", backgroundColor: withAlpha(activeTheme.success, 0.14) }}>
                Pozitívny stav
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: "var(--home-danger)", backgroundColor: "var(--home-danger-soft)" }}>
                Rizikový stav
              </span>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[var(--home-link)]">Odporúčané ponuky</span>
              <h2 className="mt-2 text-4xl font-black tracking-tight">Karty inzerátov vo farebných schémach</h2>
            </div>
            <Link
              href="/vysledky"
              className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[var(--home-link)] shadow-sm ring-1 ring-zinc-200 transition hover:brightness-95"
            >
              Otvoriť výsledky
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURED_CARS.map((car, index) => (
              <motion.div
                key={car.id}
                whileHover={{ y: -5 }}
                transition={{ delay: index * 0.03 }}
                className="group flex flex-col rounded-[36px] bg-white p-3 shadow-sm ring-1 ring-zinc-200"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px]">
                  <Image src={car.image} alt={car.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase text-white" style={{ backgroundColor: "var(--home-brand)" }}>
                      {car.badge}
                    </span>
                  </div>
                </div>
                <div className="flex flex-grow flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-black leading-tight tracking-tight">{car.name}</h3>
                    <span className="shrink-0 text-xl font-black text-[var(--home-link)]">{car.price}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-500">{car.km}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-400">
                      <span className="flex items-center gap-1">
                        <LocationIcon className="h-3 w-3" /> {car.location}
                      </span>
                      <span>{car.year}</span>
                    </div>
                    <Link
                      href={`/auto/${car.id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 transition group-hover:bg-[var(--home-cta)] group-hover:text-[var(--home-cta-text)]"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Krok 1: Vyhľadajte",
              text: "Začnite filtrami a spresnite zámer vyhľadávania.",
              bg: "var(--home-brand-soft)",
              fg: "var(--home-link)"
            },
            {
              title: "Krok 2: Porovnajte",
              text: "Skontrolujte kvalitu ponuky a dôveryhodnosť predajcu.",
              bg: "var(--home-cta-soft)",
              fg: "var(--home-link)"
            },
            {
              title: "Krok 3: Rozhodnite sa",
              text: "Použite stavové karty a rýchly kontakt.",
              bg: "var(--home-danger-soft)",
              fg: "var(--home-danger)"
            }
          ].map((item) => (
            <div key={item.title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-black uppercase" style={{ backgroundColor: item.bg, color: item.fg }}>
                {item.title}
              </span>
              <p className="mt-4 text-sm font-medium text-zinc-600">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="relative mt-20 overflow-hidden rounded-[48px] bg-[var(--home-dark-surface)] p-12 text-white lg:p-16">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-[120px]" />
          <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">Otestujte finálnu paletu pri reálnom CTA zaťažení.</h2>
              <p className="text-lg font-medium leading-relaxed text-zinc-300">
                Tento blok testuje kontrast a čitateľnosť na tmavom pozadí s aktívnym CTA a stavovými prvkami.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/pridat-inzerat"
                  className="inline-flex h-14 items-center rounded-2xl bg-[var(--home-cta)] px-8 text-sm font-black text-[var(--home-cta-text)] transition hover:brightness-95 active:scale-95"
                >
                  Spustiť predaj
                </Link>
                <Link href="/vysledky" className="inline-flex h-14 items-center rounded-2xl border border-white/30 px-8 text-sm font-bold text-white transition hover:bg-white/10">
                  Prehliadať všetky ponuky
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-3xl font-black text-[var(--home-success)]">100%</p>
                <p className="mt-2 text-xs font-bold uppercase text-zinc-400">Kontroly profilov aktívne</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-3xl font-black text-white">2.5k</p>
                <p className="mt-2 text-xs font-bold uppercase text-zinc-400">Predajcovia</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-3xl font-black text-white">4.8</p>
                <p className="mt-2 text-xs font-bold uppercase text-zinc-400">Hodnotenie trhoviska</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-3xl font-black text-[var(--home-danger)]">&lt; 1h</p>
                <p className="mt-2 text-xs font-bold uppercase text-zinc-400">Cieľ reakcie na riziko</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-[11px] font-black uppercase leading-relaxed tracking-[0.3em] text-zinc-400">
            &copy; 2026 Autobazar123. Vytvorené pre praktických kupujúcich a serióznych predajcov.
          </p>
        </div>
      </footer>
    </div>
  );
}
