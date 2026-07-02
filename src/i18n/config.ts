// Supported locales
export const locales = ["sk", "en", "hu", "ro"] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "sk";
