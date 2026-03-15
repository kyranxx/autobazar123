import { BRAND_THEME } from "@/lib/theme/brand";

export const HOME_THEME = {
  brand: BRAND_THEME.success,
  link: BRAND_THEME.success,
  cta: BRAND_THEME.accent,
  ctaInk: BRAND_THEME.primary,
  ctaText: BRAND_THEME.accentForeground,
  mint: BRAND_THEME.mint,
  softSurface: BRAND_THEME.softSurface,
} as const;

export const HOME_BRANDS = [
  "Audi",
  "BMW",
  "Ford",
  "Kia",
  "Mercedes-Benz",
  "Nissan",
  "Skoda",
  "Toyota",
  "Volvo",
  "Volkswagen",
] as const;

export const HOME_MODELS: Record<string, string[]> = {
  Audi: ["A3", "A4", "A6", "Q5"],
  BMW: ["1 Series", "3 Series", "5 Series", "X3"],
  Ford: ["Fiesta", "Focus", "Kuga", "Mondeo"],
  Kia: ["Ceed", "Sportage", "Rio", "Sorento"],
  "Mercedes-Benz": ["A", "C", "E", "GLC"],
  Nissan: ["Qashqai", "X-Trail", "Juke", "Micra"],
  Skoda: ["Fabia", "Octavia", "Superb", "Kodiaq"],
  Toyota: ["Corolla", "Camry", "RAV4", "Yaris"],
  Volvo: ["XC40", "XC60", "S60", "V60"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Touareg"],
};

export const HOME_LOCATIONS = [
  "Bratislava",
  "Košice",
  "Trnava",
  "Nitra",
  "Žilina",
  "Banská Bystrica",
] as const;

export function withAlpha(hex: string, alpha: number) {
  const n = hex.replace("#", "");
  const h = n.length === 3 ? n.split("").map((c) => `${c}${c}`).join("") : n;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
