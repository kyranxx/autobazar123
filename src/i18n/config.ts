// Supported locales
export const locales = ['sk', 'en', 'hu'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'sk';

// Locale names for display
export const localeNames: Record<Locale, string> = {
    sk: 'Slovenčina',
    en: 'English',
    hu: 'Magyar',
};

// Locale flags (emoji)
export const localeFlags: Record<Locale, string> = {
    sk: '🇸🇰',
    en: '🇬🇧',
    hu: '🇭🇺',
};
