// Normalize text for matching (remove accents, lowercase)
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function formatPrice(price: number, locale = "sk-SK"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateString: string, locale = "sk-SK"): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
