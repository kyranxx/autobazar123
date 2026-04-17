import Script from "next/script";
import { BRAND_NAME, BRAND_SOCIAL_PROFILE_URLS, BRAND_URL } from "@/config/brand";
import { COMPANY_INFO } from "@/config/company";
import { serializeJsonLd } from "@/lib/seo/json-ld";

const SITE_URL = BRAND_URL;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    email: COMPANY_INFO.infoEmail,
    contactType: "customer service",
    availableLanguage: ["Slovak", "Czech", "English"],
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

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND_NAME,
  url: SITE_URL,
  inLanguage: "sk",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/vysledky?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

function createJsonLdId(prefix: string, suffix?: string) {
  return suffix ? `${prefix}-${suffix}` : prefix;
}

export function JsonLd() {
  const organizationJson = serializeJsonLd(organizationSchema);
  const websiteJson = serializeJsonLd(websiteSchema);

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
