import { algoliasearch } from "algoliasearch";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import path from "node:path";
import {
  type AlgoliaHit,
  evaluateAlgoliaSearchCoverage,
} from "./check-algolia-search-core";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function getActiveAdsCount(): Promise<number> {
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
    .eq("status", "active");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function main() {
  const appId = getEnv("NEXT_PUBLIC_ALGOLIA_APP_ID");
  const searchKey = getEnv("NEXT_PUBLIC_ALGOLIA_SEARCH_KEY");
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_ADS_INDEX?.trim() || "ads";

  const [activeAdsCount, searchResult] = await Promise.all([
    getActiveAdsCount(),
    algoliasearch(appId, searchKey).searchSingleIndex<AlgoliaHit>({
      indexName,
      searchParams: {
        query: "",
        hitsPerPage: 5,
        attributesToRetrieve: ["objectID", "brand", "model", "year", "price_eur"],
      },
    }),
  ]);

  const algoliaHits = searchResult.nbHits ?? 0;
  const sampleHit = searchResult.hits?.[0] as AlgoliaHit | undefined;
  const errors = evaluateAlgoliaSearchCoverage({
    activeAdsCount,
    algoliaHits,
    sampleHit,
  });

  console.log("Algolia search coverage");
  console.log(`- index: ${indexName}`);
  console.log(`- active ads in Supabase: ${activeAdsCount}`);
  console.log(`- records searchable in Algolia: ${algoliaHits}`);
  console.log(`- sample hits returned: ${searchResult.hits?.length ?? 0}`);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  console.log("- status: ok");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
