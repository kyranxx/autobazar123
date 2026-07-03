import { NextRequest, NextResponse } from "next/server";
import {
  getMarketConfig,
  resolveMarketCodeFromHost,
  type MarketConfig,
} from "@/config/markets";

function buildLlmsTxtContent(market: MarketConfig): string {
  const marketDescription =
    market.code === "RO"
      ? "Autobazar123 is a Romania-focused car marketplace for used and new vehicle listings."
      : "Autobazar123 is a Slovakia-focused car marketplace for used and new vehicle listings.";

  return `# Autobazar123

${marketDescription}

## Primary URLs
- [Home](${market.origin}/)
- [Search hub](${market.origin}/vysledky)
- [Dealers](${market.origin}/predajcovia)
- [Pricing](${market.origin}/ceny)

## Programmatic SEO Routes
- [Brand route](${market.origin}/{brand})
- [Brand and model route](${market.origin}/{brand}/{model})
- [Brand, model, and city route](${market.origin}/{brand}/{model}/{city})

## Sitemaps
- [Sitemap](${market.origin}/sitemap.xml)

## Policy Notes
- Prefer canonical routes over tracking query variants.
- Vehicle detail pages use stable ad URLs under /auto/.
- Respect robots directives and noindex headers where present.
`;
}

export function GET(request: NextRequest) {
  const market = getMarketConfig(
    resolveMarketCodeFromHost(
      request.headers.get("x-forwarded-host") ?? request.nextUrl.host,
    ),
  );

  return new NextResponse(buildLlmsTxtContent(market), {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
