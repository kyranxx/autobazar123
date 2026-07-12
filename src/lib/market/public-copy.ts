import type { MarketCode, MarketConfig } from "@/config/markets";

export type PublicMarketCopy = {
  languageTag: "sk-SK" | "ro-RO";
  openGraphLocale: "sk_SK" | "ro_RO";
  countryName: string;
  countryInPhrase: string;
  listingsLabel: string;
  offersLabel: string;
  viewOffers: string;
  notFound: string;
  vehiclePriceOnRequest: string;
  mileageUnknown: string;
  fuelUnknown: string;
  yearUnknown: string;
  notProvided: string;
  locationFallback: string;
  sellerLabel: string;
  privateSeller: string;
  verifiedSeller: string;
};

export type PublicCarValueCategory = "fuel" | "transmission" | "bodyStyle";

export const PUBLIC_MARKET_COPY: Record<MarketCode, PublicMarketCopy> = {
  SK: {
    languageTag: "sk-SK",
    openGraphLocale: "sk_SK",
    countryName: "Slovensko",
    countryInPhrase: "na Slovensku",
    listingsLabel: "Inzeráty",
    offersLabel: "ponuky",
    viewOffers: "Zobraziť ponuky",
    notFound: "Nenájdené",
    vehiclePriceOnRequest: "Cena na vyžiadanie",
    mileageUnknown: "Najazdené neuvedené",
    fuelUnknown: "Palivo neuvedené",
    yearUnknown: "Rok neuvedený",
    notProvided: "Neuvedené",
    locationFallback: "Slovensko",
    sellerLabel: "Predajca",
    privateSeller: "Súkromný predajca",
    verifiedSeller: "Overený predajca",
  },
  RO: {
    languageTag: "ro-RO",
    openGraphLocale: "ro_RO",
    countryName: "România",
    countryInPhrase: "în România",
    listingsLabel: "Anunțuri",
    offersLabel: "anunțuri",
    viewOffers: "Vezi anunțurile",
    notFound: "Nu a fost găsit",
    vehiclePriceOnRequest: "Preț la cerere",
    mileageUnknown: "Kilometraj nespecificat",
    fuelUnknown: "Combustibil nespecificat",
    yearUnknown: "An nespecificat",
    notProvided: "Nespecificat",
    locationFallback: "România",
    sellerLabel: "Vânzător",
    privateSeller: "Vânzător privat",
    verifiedSeller: "Dealer verificat",
  },
};

const PUBLIC_CAR_VALUE_LABELS: Record<
  MarketCode,
  Record<PublicCarValueCategory, Record<string, string>>
> = {
  SK: {
    fuel: {
      petrol: "Benzín",
      benzin: "Benzín",
      benzín: "Benzín",
      diesel: "Nafta",
      nafta: "Nafta",
      electric: "Elektro",
      elektro: "Elektro",
      hybrid: "Hybrid",
      lpg: "LPG",
      gpl: "LPG",
      cng: "CNG",
      gnc: "CNG",
    },
    transmission: {
      manual: "Manuál",
      manuál: "Manuál",
      automat: "Automat",
      automatic: "Automat",
    },
    bodyStyle: {
      sedan: "Sedan",
      hatchback: "Hatchback",
      suv: "SUV",
      combi: "Kombi",
      kombi: "Kombi",
      wagon: "Kombi",
      break: "Kombi",
      coupe: "Kupé",
      kupé: "Kupé",
      convertible: "Kabriolet",
      cabriolet: "Kabriolet",
      kabriolet: "Kabriolet",
      van: "Van",
      pickup: "Pickup",
      mpv: "MPV",
      commercial: "Úžitkové",
      motorcycle: "Motocykel",
    },
  },
  RO: {
    fuel: {
      petrol: "Benzină",
      benzin: "Benzină",
      benzín: "Benzină",
      diesel: "Diesel",
      nafta: "Diesel",
      electric: "Electric",
      elektro: "Electric",
      hybrid: "Hibrid",
      lpg: "GPL",
      gpl: "GPL",
      cng: "GNC",
      gnc: "GNC",
    },
    transmission: {
      manual: "Manuală",
      manuál: "Manuală",
      automat: "Automată",
      automatic: "Automată",
    },
    bodyStyle: {
      sedan: "Sedan",
      hatchback: "Hatchback",
      suv: "SUV",
      combi: "Break",
      kombi: "Break",
      wagon: "Break",
      break: "Break",
      coupe: "Coupe",
      kupé: "Coupe",
      convertible: "Cabriolet",
      cabriolet: "Cabriolet",
      kabriolet: "Cabriolet",
      van: "Van",
      pickup: "Pickup",
      mpv: "MPV",
      commercial: "Comerciale",
      motorcycle: "Motocicletă",
    },
  },
};

export function getPublicMarketCopy(
  market: Pick<MarketConfig, "code" | "languageTag">,
): PublicMarketCopy {
  return {
    ...PUBLIC_MARKET_COPY[market.code],
    languageTag: market.languageTag,
  };
}

export function resolvePublicCopyMarketCode(
  locale: string | null | undefined,
  fallbackMarketCode: MarketCode,
): MarketCode {
  const normalizedLocale = locale?.trim().toLowerCase();
  if (normalizedLocale?.startsWith("ro")) return "RO";
  if (normalizedLocale?.startsWith("sk")) return "SK";
  return fallbackMarketCode;
}

export function getPublicMarketCopyForLocale(
  market: Pick<MarketConfig, "code" | "languageTag">,
  locale: string | null | undefined,
): PublicMarketCopy {
  return PUBLIC_MARKET_COPY[
    resolvePublicCopyMarketCode(locale, market.code)
  ];
}

export function formatMarketNumber(
  value: number,
  copy: Pick<PublicMarketCopy, "languageTag">,
): string {
  return value.toLocaleString(copy.languageTag);
}

export function formatMarketCurrency(
  value: number,
  copy: Pick<PublicMarketCopy, "languageTag">,
): string {
  return new Intl.NumberFormat(copy.languageTag, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPublicCarValue(
  value: string | null | undefined,
  marketCode: MarketCode,
  category: PublicCarValueCategory,
): string {
  if (!value) {
    return "";
  }

  const normalizedValue = value.toLowerCase().trim();
  return PUBLIC_CAR_VALUE_LABELS[marketCode][category][normalizedValue] ?? value;
}
