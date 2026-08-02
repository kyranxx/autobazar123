import { algoliasearch } from "algoliasearch";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import path from "node:path";
import {
  type AlgoliaHit,
  evaluateAlgoliaSearchCoverage,
} from "./check-algolia-search-core";
import { MARKET_CODES, getAlgoliaMarketFilter } from "../src/config/markets";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function getActiveAdsCount(
  marketCode: (typeof MARKET_CODES)[number],
): Promise<number> {
  const supabase = createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { count, error } = await supabase
    .from("ads")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("is_hidden", false)
    .eq("market_code", marketCode);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function main() {
  const appId = getEnv("NEXT_PUBLIC_ALGOLIA_APP_ID");
  const searchKey = getEnv("NEXT_PUBLIC_ALGOLIA_SEARCH_KEY");
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX?.trim() || "ads";

  const algolia = algoliasearch(appId, searchKey);
  const checks = await Promise.all(
    MARKET_CODES.map(async (marketCode) => {
      const [activeAdsCount, searchResult] = await Promise.all([
        getActiveAdsCount(marketCode),
        algolia.searchSingleIndex<AlgoliaHit>({
          indexName,
          searchParams: {
            query: "",
            filters: getAlgoliaMarketFilter(marketCode),
            hitsPerPage: 5,
            attributesToRetrieve: [
              "objectID",
              "brand",
              "model",
              "year",
              "price_eur",
              "market_code",
            ],
          },
        }),
      ]);

      const algoliaHits = searchResult.nbHits ?? 0;
      const sampleHit = searchResult.hits?.[0] as AlgoliaHit | undefined;
      return {
        marketCode,
        activeAdsCount,
        algoliaHits,
        sampleHit,
        errors: evaluateAlgoliaSearchCoverage({
          activeAdsCount,
          algoliaHits,
          sampleHit,
          requireActiveAds: false,
        }),
      };
    }),
  );

  const errors = checks.flatMap((check) =>
    check.errors.map((error) => `${check.marketCode}: ${error}`),
  );

  console.log("Algolia search coverage");
  console.log(`- index: ${indexName}`);
  for (const check of checks) {
    console.log(`- ${check.marketCode} active ads in Supabase: ${check.activeAdsCount}`);
    console.log(`- ${check.marketCode} records searchable in Algolia: ${check.algoliaHits}`);
    console.log(`- ${check.marketCode} sample hits returned: ${check.sampleHit ? 1 : 0}`);
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  console.log("- status: ok");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
