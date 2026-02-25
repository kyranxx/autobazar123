"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";

type ThemeKey =
  | "tealBurntOrange"
  | "navyAmber"
  | "charcoalRedOrange"
  | "forestChampagne"
  | "forestRedOrange"
  | "midnightCopper"
  | "deepForestSunsetOrange"
  | "slateLimeAccent"
  | "petrolBlueGold"
  | "graphiteCrimson"
  | "indigoCoral";

type PreviewTheme = {
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

const PREVIEW_THEMES: Record<ThemeKey, PreviewTheme> = {
  tealBurntOrange: {
    buttonLabel: "Teal + Burnt Orange",
    title: "Modern, trustworthy",
    brand: "#0F5E5A",
    link: "#0F5E5A",
    cta: "#C84A00",
    ctaText: "#FFFFFF",
    success: "#0F7A3A",
    danger: "#C62828",
    softSurface: "#F2F7F7",
    darkSurface: "#163532",
  },
  navyAmber: {
    buttonLabel: "Navy + Amber",
    title: "Conservative, institutional trust",
    brand: "#0B2E4A",
    link: "#0B2E4A",
    cta: "#E69F00",
    ctaText: "#111111",
    success: "#0F7A3A",
    danger: "#C62828",
    softSurface: "#F2F5F8",
    darkSurface: "#0A253B",
  },
  charcoalRedOrange: {
    buttonLabel: "Charcoal + Red Orange",
    title: "Energetic marketplace",
    brand: "#1F1F1F",
    link: "#0F5E5A",
    cta: "#D9480F",
    ctaText: "#FFFFFF",
    success: "#0F7A3A",
    danger: "#C62828",
    softSurface: "#F7F4F2",
    darkSurface: "#1F1F1F",
  },
  forestChampagne: {
    buttonLabel: "Forest + Champagne",
    title: "Premium calm confidence",
    brand: "#1F4D3B",
    link: "#1F4D3B",
    cta: "#CFA15A",
    ctaText: "#111111",
    success: "#1E7B47",
    danger: "#B63B31",
    softSurface: "#F3F7F2",
    darkSurface: "#162A21",
  },
  forestRedOrange: {
    buttonLabel: "Forest + Red Orange",
    title: "Grounded trust with bold action",
    brand: "#1F4D3B",
    link: "#1F4D3B",
    cta: "#D9480F",
    ctaText: "#FFFFFF",
    success: "#1E7B47",
    danger: "#B63B31",
    softSurface: "#F3F7F2",
    darkSurface: "#162A21",
  },
  midnightCopper: {
    buttonLabel: "Midnight + Copper",
    title: "Premium depth with warm urgency",
    brand: "#0F172A",
    link: "#1D4ED8",
    cta: "#C76A2A",
    ctaText: "#FFFFFF",
    success: "#16A34A",
    danger: "#C62828",
    softSurface: "#F4F6FA",
    darkSurface: "#0B1322",
  },
  deepForestSunsetOrange: {
    buttonLabel: "Deep Forest + Sunset Orange",
    title: "Trusted green with energetic conversion",
    brand: "#1B4332",
    link: "#2D6A4F",
    cta: "#E85D04",
    ctaText: "#FFFFFF",
    success: "#1E7B47",
    danger: "#B63B31",
    softSurface: "#F2F8F3",
    darkSurface: "#142E24",
  },
  slateLimeAccent: {
    buttonLabel: "Slate + Lime Accent",
    title: "Modern utility and high scanability",
    brand: "#334155",
    link: "#0F766E",
    cta: "#65A30D",
    ctaText: "#111111",
    success: "#15803D",
    danger: "#C62828",
    softSurface: "#F4F7FA",
    darkSurface: "#243243",
  },
  petrolBlueGold: {
    buttonLabel: "Petrol Blue + Gold",
    title: "Dealer-grade confidence and premium feel",
    brand: "#0B3C5D",
    link: "#0E7490",
    cta: "#D4A017",
    ctaText: "#111111",
    success: "#0F7A3A",
    danger: "#B63B31",
    softSurface: "#F2F6F9",
    darkSurface: "#082B43",
  },
  graphiteCrimson: {
    buttonLabel: "Graphite + Crimson",
    title: "Performance-forward and decisive",
    brand: "#262626",
    link: "#2563EB",
    cta: "#DC2626",
    ctaText: "#FFFFFF",
    success: "#15803D",
    danger: "#B91C1C",
    softSurface: "#F7F5F5",
    darkSurface: "#1B1B1B",
  },
  indigoCoral: {
    buttonLabel: "Indigo + Coral",
    title: "High-clarity action contrast",
    brand: "#1E3A8A",
    link: "#1E3A8A",
    cta: "#C73E1D",
    ctaText: "#FFFFFF",
    success: "#167A46",
    danger: "#C62828",
    softSurface: "#F3F5FB",
    darkSurface: "#14244F",
  },
};

const THEME_ORDER: ThemeKey[] = [
  "tealBurntOrange",
  "navyAmber",
  "charcoalRedOrange",
  "forestChampagne",
  "forestRedOrange",
  "midnightCopper",
  "deepForestSunsetOrange",
  "slateLimeAccent",
  "petrolBlueGold",
  "graphiteCrimson",
  "indigoCoral",
];

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

function darkenHex(hex: string, amount = 0.14): string {
  const normalized = hex.replace("#", "");
  const isShortHex = normalized.length === 3;
  const fullHex = isShortHex
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  const red = Math.max(
    0,
    Math.round(Number.parseInt(fullHex.slice(0, 2), 16) * (1 - amount)),
  );
  const green = Math.max(
    0,
    Math.round(Number.parseInt(fullHex.slice(2, 4), 16) * (1 - amount)),
  );
  const blue = Math.max(
    0,
    Math.round(Number.parseInt(fullHex.slice(4, 6), 16) * (1 - amount)),
  );

  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export default function ThemePreviewShell({
  children,
  scopeLabel,
}: {
  children: ReactNode;
  scopeLabel: string;
}) {
  const [activeThemeKey, setActiveThemeKey] =
    useState<ThemeKey>("tealBurntOrange");
  const activeTheme = PREVIEW_THEMES[activeThemeKey];

  const themeVars = useMemo(
    () =>
      ({
        "--preview-brand": activeTheme.brand,
        "--preview-link": activeTheme.link,
        "--preview-cta": activeTheme.cta,
        "--preview-cta-text": activeTheme.ctaText,
        "--preview-soft-surface": activeTheme.softSurface,
        "--preview-dark-surface": activeTheme.darkSurface,
        "--preview-brand-soft": withAlpha(activeTheme.brand, 0.12),
        "--preview-danger-soft": withAlpha(activeTheme.danger, 0.14),
        "--color-primary": activeTheme.brand,
        "--color-primary-hover": darkenHex(activeTheme.brand, 0.12),
        "--color-primary-foreground": "#ffffff",
        "--color-accent": activeTheme.cta,
        "--color-accent-hover": darkenHex(activeTheme.cta, 0.12),
        "--color-accent-foreground": activeTheme.ctaText,
        "--color-accent-subtle": withAlpha(activeTheme.cta, 0.14),
        "--color-digital": activeTheme.link,
        "--color-digital-subtle": withAlpha(activeTheme.link, 0.18),
        "--color-success": activeTheme.success,
        "--color-success-subtle": withAlpha(activeTheme.success, 0.15),
        "--color-error": activeTheme.danger,
        "--color-error-subtle": withAlpha(activeTheme.danger, 0.14),
        "--color-border-focus": activeTheme.link,
        "--color-ring": activeTheme.cta,
        "--color-background-muted": withAlpha(activeTheme.brand, 0.06),
      }) as CSSProperties,
    [activeTheme],
  );

  return (
    <div
      style={themeVars}
      className="bg-[var(--preview-soft-surface)] selection:bg-[var(--preview-cta)] selection:text-[var(--preview-cta-text)]"
    >
      <section className="w-full bg-[var(--preview-brand)] text-white">
        <div className="container-main py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-semibold tracking-wide text-white/90">
                Palette preview: {scopeLabel}
              </p>
              <p className="text-xs font-medium text-white/70">
                {activeTheme.title}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {THEME_ORDER.map((themeKey) => {
                const theme = PREVIEW_THEMES[themeKey];
                const isActive = themeKey === activeThemeKey;

                return (
                  <button
                    key={themeKey}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveThemeKey(themeKey)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold transition ${
                      isActive
                        ? "border-white bg-white text-zinc-900"
                        : "border-white/50 bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.brand }}
                    />
                    {theme.buttonLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--color-success)" }}
                />
                Success
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--color-error)" }}
                />
                Danger
              </span>
            </div>
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}
