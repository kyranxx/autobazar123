import type { Metadata } from "next";
import { BRAND_NAME } from "@/config/brand";
import type { MarketConfig } from "@/config/markets";

type MarketMetadataCopy = {
  title: string;
  twitterTitle: string;
  description: string;
  keywords: string[];
  openGraphLocale: string;
  alternateLocales: string[];
};

const MARKET_METADATA_COPY: Record<MarketConfig["code"], MarketMetadataCopy> = {
  SK: {
    title: `${BRAND_NAME} | Predaj áut a ojazdených vozidiel na Slovensku`,
    twitterTitle: `${BRAND_NAME} | Predaj áut na Slovensku`,
    description:
      "Rastúci online autobazár na Slovensku. Kúpte alebo predajte auto prehľadne a bezpečne. Reálne inzeráty, ojazdené aj nové vozidlá, autobazáre aj súkromní predajcovia.",
    keywords: [
      "autobazar",
      "autobazar slovensko",
      "predaj áut",
      "kúpa auta",
      "ojazdené autá",
      "bazár áut",
      "autá na predaj",
      "predaj ojazdených áut",
      "autobazár online",
      "inzeráty áut",
      "autá slovensko",
      "kúpiť auto",
      "predať auto",
      "auto inzercia",
      "autobazar bratislava",
      "autobazar košice",
    ],
    openGraphLocale: "sk_SK",
    alternateLocales: ["cs_CZ", "hu_HU", "en_US", "ro_RO"],
  },
  RO: {
    title: `${BRAND_NAME} | Masini second hand si autoturisme rulate in Romania`,
    twitterTitle: `${BRAND_NAME} | Masini de vanzare in Romania`,
    description:
      "Autobazar online pentru piata din Romania. Cauta masini second hand, autoturisme rulate si anunturi auto de la dealeri verificati.",
    keywords: [
      "masini second hand",
      "autoturisme rulate",
      "masini de vanzare",
      "dealer auto",
      "autobazar romania",
      "anunturi auto",
      "auto rulate",
      "cumpara masina",
      "vinde masina",
    ],
    openGraphLocale: "ro_RO",
    alternateLocales: ["sk_SK", "en_US", "hu_HU"],
  },
};

export function buildRootMetadata(
  market: MarketConfig,
  indexingEnabled: boolean,
): Metadata {
  const copy = MARKET_METADATA_COPY[market.code];

  return {
    metadataBase: new URL(market.origin),
    title: {
      default: copy.title,
      template: `%s`,
    },
    description: copy.description,
    keywords: copy.keywords,
    authors: [{ name: BRAND_NAME }],
    creator: BRAND_NAME,
    publisher: BRAND_NAME,
    alternates: {
      canonical: market.origin,
      languages: {
        sk: "https://www.autobazar123.sk",
        ro: "https://www.autobazar123.ro",
      },
    },
    openGraph: {
      type: "website",
      locale: copy.openGraphLocale,
      alternateLocale: copy.alternateLocales,
      url: market.origin,
      siteName: BRAND_NAME,
      title: copy.title,
      description: copy.description,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.twitterTitle,
      description: copy.description,
    },
    robots: {
      index: indexingEnabled,
      follow: indexingEnabled,
      googleBot: {
        index: indexingEnabled,
        follow: indexingEnabled,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    },
    category: "automotive",
  };
}
