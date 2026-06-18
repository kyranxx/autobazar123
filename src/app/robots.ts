import { MetadataRoute } from "next";
import { APP_URLS } from "@/config/config";
import { isSiteIndexingEnabled } from "@/lib/seo/crawl-policy";

export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexingEnabled()) {
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
    sitemap: `${APP_URLS.siteOrigin}/sitemap.xml`,
  };
}
