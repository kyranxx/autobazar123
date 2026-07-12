import { createClient } from "@supabase/supabase-js";
import { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/config/config";
import {
  DEFAULT_MARKET_CODE,
  getMarketConfig,
  type MarketCode,
} from "@/config/markets";
import { buildAdPath } from "@/lib/cars/ad-path";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";
import {
  type InventoryBackedSeoTaxonomy,
  normalizeSeoSegment,
  resolveCitySlugFromValue,
} from "@/lib/seo/programmatic-taxonomy";

type SitemapTaxonomyRelation = { slug?: string | null } | null | undefined;

type SitemapAdRow = {
  id: string;
  market_code?: string | null;
  updated_at: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  location_city?: string | null;
  brands?: SitemapTaxonomyRelation;
  models?: SitemapTaxonomyRelation;
};

function normalizeRelationSlug(relation: SitemapTaxonomyRelation): string | null {
  const slug = relation?.slug?.trim();
  if (!slug) {
    return null;
  }

  return normalizeSeoSegment(slug);
}

function buildInventoryBackedSitemapTaxonomy(
  rows: readonly SitemapAdRow[],
  {
    cityMinActiveAds,
  }: {
    cityMinActiveAds: number;
  },
): InventoryBackedSeoTaxonomy {
  const brandSlugs = new Set<string>();
  const modelPairs = new Set<string>();
  const cityCounts = new Map<string, number>();

  for (const row of rows) {
    const brandSlug = normalizeRelationSlug(row.brands);
    const modelSlug = normalizeRelationSlug(row.models);
    if (!brandSlug || !modelSlug) {
      continue;
    }

    brandSlugs.add(brandSlug);

    const modelKey = `${brandSlug}/${modelSlug}`;
    modelPairs.add(modelKey);

    const citySlug = row.location_city
      ? resolveCitySlugFromValue(row.location_city)
      : null;
    if (!citySlug) {
      continue;
    }

    const cityKey = `${modelKey}/${citySlug}`;
    cityCounts.set(cityKey, (cityCounts.get(cityKey) ?? 0) + 1);
  }

  return {
    brandSlugs: [...brandSlugs].sort(),
    modelPairs: [...modelPairs].sort().map((pairKey) => {
      const [brandSlug, modelSlug] = pairKey.split("/");
      return { brandSlug, modelSlug };
    }),
    cityTriples: [...cityCounts.entries()]
      .filter(([, activeAds]) => activeAds >= cityMinActiveAds)
      .map(([cityKey]) => {
        const [brandSlug, modelSlug, citySlug] = cityKey.split("/");
        return { brandSlug, modelSlug, citySlug };
      })
      .sort((left, right) => {
        const leftKey = `${left.brandSlug}/${left.modelSlug}/${left.citySlug}`;
        const rightKey = `${right.brandSlug}/${right.modelSlug}/${right.citySlug}`;
        return leftKey.localeCompare(rightKey);
      }),
  };
}

function buildInventoryTaxonomyPages(
  taxonomy: InventoryBackedSeoTaxonomy,
  lastModified: Date,
  baseUrl: string,
): {
  brandPages: MetadataRoute.Sitemap;
  modelPages: MetadataRoute.Sitemap;
  cityPages: MetadataRoute.Sitemap;
} {
  const brandPages: MetadataRoute.Sitemap = taxonomy.brandSlugs.map((brandSlug) => ({
    url: `${baseUrl}/${brandSlug}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const modelPages: MetadataRoute.Sitemap = taxonomy.modelPairs.map(
    ({ brandSlug, modelSlug }) => {
      return {
        url: `${baseUrl}/${brandSlug}/${modelSlug}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.7,
      };
    },
  );

  const cityPages: MetadataRoute.Sitemap = taxonomy.cityTriples.map(
    ({ brandSlug, modelSlug, citySlug }) => {
      return {
        url: `${baseUrl}/${brandSlug}/${modelSlug}/${citySlug}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.6,
      };
    },
  );

  return { brandPages, modelPages, cityPages };
}

export async function buildSitemapForMarket(
  marketCode: MarketCode = DEFAULT_MARKET_CODE,
): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const market = getMarketConfig(marketCode);
  const baseUrl = market.origin;
  const marketUrl = (path: string) => `${baseUrl}${getMarketPath(path, marketCode)}`;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: marketUrl("/vysledky"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: marketUrl("/predajcovia"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: marketUrl("/kalkulacka-leasingu"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: marketUrl("/ceny"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: marketUrl("/kontakt"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: marketUrl("/o-nas"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: marketUrl("/obchodne-podmienky"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: marketUrl("/ochrana-udajov"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
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
      .select(
        `
        id,
        market_code,
        updated_at,
        brand,
        model,
        year,
        location_city,
        is_hidden,
        brands:brand_id (slug),
        models:model_id (slug)
      `,
      )
      .eq("status", "active")
      .eq("is_hidden", false)
      .eq("market_code", market.code)
      .order("updated_at", { ascending: false })
      .limit(SEO_CONFIG.sitemapListingLimit);

    if (ads) {
      const sitemapAds = ads as SitemapAdRow[];
      const taxonomy = buildInventoryBackedSitemapTaxonomy(sitemapAds, {
        cityMinActiveAds: SEO_CONFIG.sitemapCityPageMinActiveAds,
      });
      ({ brandPages, modelPages, cityPages } = buildInventoryTaxonomyPages(
        taxonomy,
        now,
        baseUrl,
      ));

      listingPages = sitemapAds.map((ad) => ({
        url: marketUrl(buildAdPath({
          id: ad.id,
          brand: ad.brand,
          model: ad.model,
          year: ad.year,
        })),
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const market = await getRequestMarketConfig();
  return buildSitemapForMarket(market.code);
}
