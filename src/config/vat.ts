/**
 * 🇸🇰 Slovak VAT Configuration
 *
 * Slovakia uses a standard VAT rate of 23% (as of 2026).
 * This configuration is used throughout the application for:
 * - Displaying gross/net prices for VAT-deductible vehicles
 * - Calculating prices in the leasing calculator
 * - Invoice generation
 */

// Standard Slovak VAT rate for 2026
export const VAT_RATE = 0.23;

// VAT multiplier for quick calculations (1 + VAT_RATE)
export const VAT_MULTIPLIER = 1 + VAT_RATE;

/**
 * Calculate the net price (bez DPH) from a gross price
 * @param grossPrice - Price including VAT
 * @returns Net price without VAT
 */
export function calculateNetPrice(grossPrice: number): number {
  return Math.round((grossPrice / VAT_MULTIPLIER) * 100) / 100;
}

/**
 * Calculate the gross price (s DPH) from a net price
 * @param netPrice - Price without VAT
 * @returns Gross price including VAT
 */
export function calculateGrossPrice(netPrice: number): number {
  return Math.round(netPrice * VAT_MULTIPLIER * 100) / 100;
}

/**
 * Calculate the VAT amount from a gross price
 * @param grossPrice - Price including VAT
 * @returns The VAT portion of the price
 */
export function calculateVatAmount(grossPrice: number): number {
  const netPrice = calculateNetPrice(grossPrice);
  return Math.round((grossPrice - netPrice) * 100) / 100;
}

/**
 * Format a price with VAT breakdown for display
 * Used when is_vat_deductible is TRUE
 *
 * @param grossPrice - The gross price (s DPH)
 * @returns Object with formatted strings
 */
export function formatPriceWithVat(grossPrice: number): {
  gross: string;
  net: string;
  vatAmount: string;
  vatLabel: string;
} {
  const netPrice = calculateNetPrice(grossPrice);
  const vatAmount = calculateVatAmount(grossPrice);

  return {
    gross: formatCurrency(grossPrice),
    net: formatCurrency(netPrice),
    vatAmount: formatCurrency(vatAmount),
    vatLabel: `(${formatCurrency(netPrice)} bez DPH)`,
  };
}

/**
 * Format a number as Slovak currency (€)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as Slovak currency with decimals
 * @param amount - The amount to format
 * @returns Formatted currency string with 2 decimal places
 */
export function formatCurrencyWithDecimals(amount: number): string {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
