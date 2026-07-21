import { NextRequest, NextResponse } from "next/server";
import {
  getMarketConfig,
  resolveMarketCodeFromHost,
  type MarketConfig,
} from "@/config/markets";
import { getMarketPath } from "@/lib/routes";

function buildLlmsTxtContent(market: MarketConfig): string {
  const marketDescription =
    market.code === "RO"
      ? "AutoNinja is a Romania-focused car marketplace for used and new vehicle listings."
      : "Autobazar123 is a Slovakia-focused car marketplace for used and new vehicle listings.";

  return `# ${market.brandName}

${marketDescription}

## Primary URLs
- [Home](${market.origin}/)
- [Search hub](${market.origin}${getMarketPath("/vysledky", market.code)})
- [Dealers](${market.origin}${getMarketPath("/predajcovia", market.code)})
- [Pricing](${market.origin}${getMarketPath("/ceny", market.code)})

## Programmatic SEO Routes
- [Brand route](${market.origin}/{brand})
- [Brand and model route](${market.origin}/{brand}/{model})
- [Brand, model, and city route](${market.origin}/{brand}/{model}/{city})

## Sitemaps
- [Sitemap](${market.origin}/sitemap.xml)

## Policy Notes
- Prefer canonical routes over tracking query variants.
- Vehicle detail pages use stable market-localized ad URLs.
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
