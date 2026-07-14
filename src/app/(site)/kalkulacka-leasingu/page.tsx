import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";
import LeasingCalculatorPageClient from "./LeasingCalculatorPageClient";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";

const BREADCRUMB_ITEMS: BreadcrumbTrailItem[] = [
  { label: "Kalkulačka leasingu" },
];

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();
  const isRomanian = market.code === "RO";
  return {
  title: isRomanian ? "Calculator leasing auto | Autobazar123" : "Kalkulačka leasingu | Autobazar123",
  description: isRomanian
    ? "Calculează rata lunară estimativă pentru leasing în funcție de preț, avans și perioada de finanțare."
    : "Vypočítajte si orientačnú mesačnú splátku leasingu podľa ceny vozidla, akontácie a doby splácania.",
  alternates: {
    canonical: `${market.origin}${getMarketPath("/kalkulacka-leasingu", market.code)}`,
  },
  };
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbSchemaItems({
          items: BREADCRUMB_ITEMS,
          currentHref: "/kalkulacka-leasingu",
        })}
      />
      <LeasingCalculatorPageClient breadcrumbItems={BREADCRUMB_ITEMS} />
    </>
  );
}
