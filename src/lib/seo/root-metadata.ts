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
    title: `AutoNinja | Mașini second hand și autoturisme rulate în România`,
    twitterTitle: `AutoNinja | Mașini de vânzare în România`,
    description:
      "Autobazar online pentru piața din România. Caută mașini second hand, autoturisme rulate și anunțuri auto de la dealeri verificați.",
    keywords: [
      "mașini second hand",
      "autoturisme rulate",
      "mașini de vânzare",
      "dealer auto",
      "autobazar România",
      "anunțuri auto",
      "auto rulate",
      "cumpără mașină",
      "vinde mașină",
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
    authors: [{ name: market.brandName }],
    creator: market.brandName,
    publisher: market.brandName,
    alternates: {
      canonical: market.origin,
      languages: {
        sk: "https://www.autobazar123.sk",
        ro: "https://www.autoninja.ro",
      },
    },
    openGraph: {
      type: "website",
      locale: copy.openGraphLocale,
      alternateLocale: copy.alternateLocales,
      url: market.origin,
      siteName: market.brandName,
      title: copy.title,
      description: copy.description,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.twitterTitle,
      description: copy.description,
    },
    icons: {
      icon: "/icon.svg",
      apple: "/apple-touch-icon.png",
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
