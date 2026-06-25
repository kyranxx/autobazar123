import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { BRAND_URL } from "@/config/brand";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";
import LeasingCalculatorPageClient from "./LeasingCalculatorPageClient";

const SITE_URL = BRAND_URL;
const BREADCRUMB_ITEMS: BreadcrumbTrailItem[] = [
  { label: "Kalkulačka leasingu" },
];

export const metadata: Metadata = {
  title: "Kalkulačka leasingu | Autobazar123",
  description: "Vypocitajte si orientacnu mesacnu splatku leasingu podľa ceny vozidlá, akontacie a doby splacania.",
  alternates: {
    canonical: `${SITE_URL}/kalkulacka-leasingu`,
  },
};

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
