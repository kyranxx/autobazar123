import { MetadataRoute } from "next";
import { APP_URLS } from "@/config/config";

export default function robots(): MetadataRoute.Robots {
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
