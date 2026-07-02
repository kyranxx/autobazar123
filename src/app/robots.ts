import { MetadataRoute } from "next";
import type { MarketConfig } from "@/config/markets";
import { getRequestMarketConfig } from "@/lib/market/request";
import { isSiteIndexingEnabled } from "@/lib/seo/crawl-policy";

export function buildRobotsPolicy(
  market: MarketConfig,
  indexingEnabled: boolean,
): MetadataRoute.Robots {
  if (!indexingEnabled) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/moj-ucet/",
          "/moje-inzeraty/",
          "/nastavenia/",
          "/spravy/",
          "/ulozene/",
          "/maintenance/",
        ],
      },
    ],
    sitemap: `${market.origin}/sitemap.xml`,
  };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return buildRobotsPolicy(await getRequestMarketConfig(), isSiteIndexingEnabled());
}
