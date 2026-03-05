export const HOME_THEME = {
  brand: "#2A6B52",
  link: "#2A6B52",
  cta: "#9B3F12",
  ctaText: "#FFFFFF",
  softSurface: "#F3F7F2",
  darkSurface: "#1E4337",
} as const;

export const HOME_BRANDS = [
  "Audi",
  "BMW",
  "Mercedes-Benz",
  "Skoda",
  "Toyota",
  "Volkswagen",
] as const;

export const HOME_MODELS: Record<string, string[]> = {
  Audi: ["A3", "A4", "A6", "Q5"],
  BMW: ["1 Series", "3 Series", "5 Series", "X3"],
  "Mercedes-Benz": ["A", "C", "E", "GLC"],
  Skoda: ["Fabia", "Octavia", "Superb", "Kodiaq"],
  Toyota: ["Corolla", "Camry", "RAV4", "Yaris"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Touareg"],
};

export const HOME_LOCATIONS = [
  "Bratislava",
  "Kosice",
  "Trnava",
  "Nitra",
  "Zilina",
  "Banska Bystrica",
] as const;

export function withAlpha(hex: string, alpha: number) {
  const n = hex.replace("#", "");
  const h = n.length === 3 ? n.split("").map((c) => `${c}${c}`).join("") : n;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
