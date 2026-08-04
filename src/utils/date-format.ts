import {
  getMarketConfig,
  getMarketConfigForLocale,
  type MarketCode,
} from "@/config/markets";

const SK_DATE_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  timeZone: "Europe/Bratislava",
});

const SK_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Bratislava",
});

function getLocalizedDateFormatter(
  locale: string,
  includeTime: boolean,
  marketCode?: MarketCode,
): Intl.DateTimeFormat {
  const market = marketCode
    ? getMarketConfig(marketCode)
    : getMarketConfigForLocale(locale);
  return new Intl.DateTimeFormat(locale, {
    ...(includeTime ? { dateStyle: "medium" as const, timeStyle: "short" as const } : {}),
    timeZone: market.timeZone,
  });
}

export function formatSkDate(value: string | number | Date): string {
  return SK_DATE_FORMATTER.format(new Date(value));
}

export function formatSkDateTime(value: string | number | Date): string {
  return SK_DATE_TIME_FORMATTER.format(new Date(value));
}

export function formatLocalizedDateTime(
  value: string | number | Date,
  locale = "sk-SK",
  marketCode?: MarketCode,
): string {
  if (locale === "sk-SK") {
    return formatSkDateTime(value);
  }

  return getLocalizedDateFormatter(locale, true, marketCode).format(new Date(value));
}
