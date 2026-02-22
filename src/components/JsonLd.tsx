import { serializeJsonLd } from "@/lib/seo/json-ld";

const SITE_URL = "https://autobazar123.sk";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Autobazar123",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@autobazar123.sk",
    contactType: "customer service",
    availableLanguage: ["Slovak", "Czech", "English"],
  },
  sameAs: [],
  address: {
    "@type": "PostalAddress",
    addressCountry: "SK",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Autobazar123",
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

export function JsonLd() {
  const organizationJson = serializeJsonLd(organizationSchema);
  const websiteJson = serializeJsonLd(websiteSchema);

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning>
        {organizationJson}
      </script>
      <script type="application/ld+json" suppressHydrationWarning>
        {websiteJson}
      </script>
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

  return (
    <script type="application/ld+json" suppressHydrationWarning>
      {serializeJsonLd(schema)}
    </script>
  );
}
