import {
  getMarketConfig,
  isMarketCode,
  resolveKnownMarketCodeFromHost,
  type MarketCode,
} from "@/config/markets";
import { defaultLocale, locales, type Locale } from "./config";

type RequestLocaleInput = {
  localeCookie: string | null | undefined;
  acceptLanguage: string | null | undefined;
  host: string | null | undefined;
  marketCode?: string | null | undefined;
};

type RequestLocaleSettings = {
  locale: Locale;
  timeZone: string;
};

function normalizeLocale(value: string | null | undefined): Locale | null {
  const candidate = value?.trim().toLowerCase().slice(0, 2);
  return candidate && locales.includes(candidate as Locale)
    ? (candidate as Locale)
    : null;
}

function resolveAcceptLanguageLocale(
  acceptLanguage: string | null | undefined,
): Locale | null {
  if (!acceptLanguage) {
    return null;
  }

  for (const language of acceptLanguage.split(",")) {
    const locale = normalizeLocale(language.split(";", 1)[0]);
    if (locale) {
      return locale;
    }
  }

  return null;
}

export function resolveRequestLocaleSettings({
  localeCookie,
  acceptLanguage,
  host,
  marketCode: forwardedMarketCode,
}: RequestLocaleInput): RequestLocaleSettings {
  const marketCode: MarketCode | null = isMarketCode(forwardedMarketCode)
    ? forwardedMarketCode
    : resolveKnownMarketCodeFromHost(host);
  const market = marketCode ? getMarketConfig(marketCode) : null;
  const timeZone = market?.timeZone ?? getMarketConfig("SK").timeZone;

  return {
    locale:
      normalizeLocale(localeCookie) ??
      (market?.locale as Locale | undefined) ??
      resolveAcceptLanguageLocale(acceptLanguage) ??
      defaultLocale,
    timeZone,
  };
}
