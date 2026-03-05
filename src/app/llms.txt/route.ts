import { NextResponse } from "next/server";

const BASE_URL = "https://autobazar123.sk";

const LLMSTXT_CONTENT = `# Autobazar123

Autobazar123 is a Slovakia-focused car marketplace for used and new vehicle listings.

## Primary URLs
- Home: ${BASE_URL}/
- Search hub: ${BASE_URL}/vysledky
- Dealers: ${BASE_URL}/predajcovia
- Pricing: ${BASE_URL}/ceny

## Programmatic SEO Routes
- Brand: ${BASE_URL}/{brand}
- Brand + model: ${BASE_URL}/{brand}/{model}
- Brand + model + city: ${BASE_URL}/{brand}/{model}/{city}

## Sitemaps
- ${BASE_URL}/sitemap.xml

## Policy Notes
- Prefer canonical routes over tracking query variants.
- Vehicle detail pages use stable ad URLs under /auto/.
- Respect robots directives and noindex headers where present.
`;

export function GET() {
  return new NextResponse(LLMSTXT_CONTENT, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

