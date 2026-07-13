import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import type { MarketCode } from "@/config/markets";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";
import { getRequestMarketConfig } from "@/lib/market/request";
import CookiesPageClient from "./CookiesPageClient";

function getCookiesPageCopy(marketCode: MarketCode) {
  if (marketCode === "RO") {
    return {
      title: "Setări cookie | Autobazar123",
      description:
        "Gestionează setările pentru cookie-uri analitice și de marketing pe Autobazar123.",
      breadcrumb: "Setări cookie",
    };
  }

  return {
    title: "Nastavenia cookies | Autobazar123",
    description: "Spravujte nastavenia analytickych a marketingovych cookies na Autobazar123.",
    breadcrumb: "Nastavenia cookies",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();
  const copy = getCookiesPageCopy(market.code);

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `${market.origin}/cookies`,
    },
  };
}

export default async function Page() {
  const market = await getRequestMarketConfig();
  const copy = getCookiesPageCopy(market.code);
  const breadcrumbItems: BreadcrumbTrailItem[] = [
    { label: copy.breadcrumb },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbSchemaItems({
          items: breadcrumbItems,
          currentHref: "/cookies",
          siteUrl: market.origin,
        })}
      />
      <CookiesPageClient breadcrumbItems={breadcrumbItems} />
    </>
  );
}
