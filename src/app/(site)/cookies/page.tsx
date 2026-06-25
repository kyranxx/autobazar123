import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { BRAND_URL } from "@/config/brand";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";
import CookiesPageClient from "./CookiesPageClient";

const SITE_URL = BRAND_URL;
const BREADCRUMB_ITEMS: BreadcrumbTrailItem[] = [
  { label: "Nastavenia cookies" },
];

export const metadata: Metadata = {
  title: "Nastavenia cookies | Autobazar123",
  description: "Spravujte nastavenia analytickych a marketingovych cookies na Autobazar123.",
  alternates: {
    canonical: `${SITE_URL}/cookies`,
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbSchemaItems({
          items: BREADCRUMB_ITEMS,
          currentHref: "/cookies",
        })}
      />
      <CookiesPageClient breadcrumbItems={BREADCRUMB_ITEMS} />
    </>
  );
}
