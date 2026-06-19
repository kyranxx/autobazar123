import { createClient } from "@supabase/supabase-js";
import { MetadataRoute } from "next";
import { APP_URLS, SEO_CONFIG } from "@/config/config";
import { buildAdPath } from "@/lib/cars/ad-path";
import { buildInventoryBackedSeoTaxonomy } from "@/lib/seo/programmatic-taxonomy";

const BASE_URL = APP_URLS.siteOrigin;

function buildInventoryTaxonomyPages(
  taxonomy: Awaited<ReturnType<typeof buildInventoryBackedSeoTaxonomy>>,
  lastModified: Date,
): {
  brandPages: MetadataRoute.Sitemap;
  modelPages: MetadataRoute.Sitemap;
  cityPages: MetadataRoute.Sitemap;
} {
  const brandPages: MetadataRoute.Sitemap = taxonomy.brandSlugs.map((brandSlug) => ({
    url: `${BASE_URL}/${brandSlug}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const modelPages: MetadataRoute.Sitemap = taxonomy.modelPairs.map(
    ({ brandSlug, modelSlug }) => {
      return {
        url: `${BASE_URL}/${brandSlug}/${modelSlug}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.7,
      };
    },
  );

  const cityPages: MetadataRoute.Sitemap = taxonomy.cityTriples.map(
    ({ brandSlug, modelSlug, citySlug }) => {
      return {
        url: `${BASE_URL}/${brandSlug}/${modelSlug}/${citySlug}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.6,
      };
    },
  );

  return { brandPages, modelPages, cityPages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/vysledky`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/predajcovia`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/kalkulacka-leasingu`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/ceny`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/kontakt`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/o-nas`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/obchodne-podmienky`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/ochrana-udajov`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  let brandPages: MetadataRoute.Sitemap = [];
  let modelPages: MetadataRoute.Sitemap = [];
  let cityPages: MetadataRoute.Sitemap = [];
  let listingPages: MetadataRoute.Sitemap = [];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return [...staticPages, ...brandPages, ...modelPages, ...cityPages];
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: ads } = await supabase
      .from("ads")
      .select("id, updated_at, brand, model, year, location_city")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(SEO_CONFIG.sitemapListingLimit);

    if (ads) {
      const taxonomy = await buildInventoryBackedSeoTaxonomy(ads, {
        cityMinActiveAds: SEO_CONFIG.sitemapCityPageMinActiveAds,
      });
      ({ brandPages, modelPages, cityPages } = buildInventoryTaxonomyPages(
        taxonomy,
        now,
      ));

      listingPages = ads.map((ad) => ({
        url: `${BASE_URL}${buildAdPath({
          id: ad.id,
          brand: ad.brand,
          model: ad.model,
          year: ad.year,
        })}`,
        lastModified: new Date(ad.updated_at),
        changeFrequency: "weekly",
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch ads", error);
  }

  return [
    ...staticPages,
    ...brandPages,
    ...modelPages,
    ...cityPages,
    ...listingPages,
  ];
}
