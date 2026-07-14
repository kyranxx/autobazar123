import Script from "next/script";
import { BRAND_NAME, BRAND_SOCIAL_PROFILE_URLS, BRAND_URL } from "@/config/brand";
import { COMPANY_INFO } from "@/config/company";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import type { MarketConfig } from "@/config/markets";
import { getMarketPath } from "@/lib/routes";

const SITE_URL = BRAND_URL;

function buildOrganizationSchema(market: Pick<MarketConfig, "origin">) {
  return {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND_NAME,
  url: market.origin,
  logo: `${market.origin}/icon.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    email: COMPANY_INFO.infoEmail,
    contactType: "customer service",
    availableLanguage: ["Slovak", "Romanian", "Czech", "English"],
  },
  sameAs: BRAND_SOCIAL_PROFILE_URLS,
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY_INFO.streetAddress,
    postalCode: COMPANY_INFO.postalCode,
    addressLocality: COMPANY_INFO.city,
    addressCountry: "SK",
  },
  };
}

function buildWebsiteSchema(market: Pick<MarketConfig, "origin" | "locale">) {
  const marketCode = market.locale === "ro" ? "RO" : "SK";
  return {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND_NAME,
  url: market.origin,
  inLanguage: market.locale,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${market.origin}${getMarketPath("/vysledky", marketCode)}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  };
}

function createJsonLdId(prefix: string, suffix?: string) {
  return suffix ? `${prefix}-${suffix}` : prefix;
}

export function JsonLd({
  market = { origin: SITE_URL, locale: "sk" },
}: {
  market?: Pick<MarketConfig, "origin" | "locale">;
}) {
  const organizationJson = serializeJsonLd(buildOrganizationSchema(market));
  const websiteJson = serializeJsonLd(buildWebsiteSchema(market));

  return (
    <>
      <Script
        id={createJsonLdId("organization-jsonld")}
        type="application/ld+json"
      >
        {organizationJson}
      </Script>
      <Script
        id={createJsonLdId("website-jsonld")}
        type="application/ld+json"
      >
        {websiteJson}
      </Script>
    </>
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  const scriptId = createJsonLdId(
    "breadcrumb-jsonld",
    items
      .map((item) => item.name)
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "default",
  );

  return (
    <Script id={scriptId} type="application/ld+json">
      {serializeJsonLd(schema)}
    </Script>
  );
}
