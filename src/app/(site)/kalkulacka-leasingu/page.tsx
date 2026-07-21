import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import type { MarketCode } from "@/config/markets";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";
import { resolvePublicCopyMarketCode } from "@/lib/market/public-copy";
import LeasingCalculatorPageClient from "./LeasingCalculatorPageClient";

function getLeasingPageCopy(marketCode: MarketCode) {
  if (marketCode === "RO") {
    return {
      title: "Calculator leasing | AutoNinja",
      description:
        "Calculează rata lunară orientativă de leasing după prețul mașinii, avans și durata finanțării.",
      breadcrumb: "Calculator leasing",
    };
  }

  return {
    title: "Kalkulačka leasingu | Autobazar123",
    description:
      "Vypočítajte si orientačnú mesačnú splátku leasingu podľa ceny vozidla, akontácie a doby splácania.",
    breadcrumb: "Kalkulačka leasingu",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const copy = getLeasingPageCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `${market.origin}${getMarketPath("/kalkulacka-leasingu", market.code)}`,
    },
  };
}

export default async function Page() {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const copy = getLeasingPageCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );
  const breadcrumbItems: BreadcrumbTrailItem[] = [
    { label: copy.breadcrumb },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbSchemaItems({
          items: breadcrumbItems,
          currentHref: "/kalkulacka-leasingu",
          siteUrl: market.origin,
        })}
      />
      <LeasingCalculatorPageClient breadcrumbItems={breadcrumbItems} />
    </>
  );
}
