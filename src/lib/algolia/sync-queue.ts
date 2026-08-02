import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAdminClient,
  getCarsIndexName,
  transformCarToAlgoliaRecord,
  type AlgoliaCarRecord,
} from "@/lib/algolia";

export const ALGOLIA_AD_SELECT = `
  id,
  market_code,
  brand,
  model,
  generation,
  description,
  year,
  price_eur,
  mileage_km,
  fuel,
  transmission,
  body_style,
  power_kw,
  location_city,
  photos_json,
  promotion_tier,
  is_top_ad,
  is_highlighted,
  is_vat_deductible,
  has_service_book,
  not_crashed,
  is_bought_in_sk,
  is_hidden,
  status,
  created_at,
  brands:brand_id (name),
  models:model_id (name)
`;

type QueueRow = {
  id: number;
  ad_id: string;
  operation: "upsert" | "delete";
  attempts: number;
  claim_token: string | null;
};

type QueueAd = {
  id: string;
  status?: string | null;
  is_hidden?: boolean | null;
  [key: string]: unknown;
};

export type AlgoliaSyncQueueResult = {
  claimed: number;
  processed: number;
  requeued: number;
  failed: number;
};

type QueueProcessorOptions = {
  supabase: SupabaseClient;
  algolia?: ReturnType<typeof getAdminClient>;
  batchSize?: number;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function markProcessed(
  supabase: SupabaseClient,
  row: QueueRow,
): Promise<boolean> {
  if (!row.claim_token) {
    return false;
  }

  const { data, error } = await supabase
    .from("algolia_sync_queue")
    .update({
      processed_at: new Date().toISOString(),
      locked_at: null,
      claim_token: null,
      last_error: null,
    })
    .eq("id", row.id)
    .eq("claim_token", row.claim_token)
    .is("processed_at", null)
    .select("id");

  if (error) {
    throw error;
  }

  return (data?.length ?? 0) > 0;
}

async function requeue(
  supabase: SupabaseClient,
  row: QueueRow,
  error: unknown,
): Promise<void> {
  if (!row.claim_token) {
    return;
  }

  const backoffSeconds = Math.min(
    15 * 60,
    30 * 2 ** Math.max(0, Math.min(row.attempts - 1, 8)),
  );
  const availableAt = new Date(
    Date.now() + backoffSeconds * 1000,
  ).toISOString();

  const { error: updateError } = await supabase
    .from("algolia_sync_queue")
    .update({
      available_at: availableAt,
      locked_at: null,
      claim_token: null,
      last_error: errorMessage(error).slice(0, 2000),
    })
    .eq("id", row.id)
    .eq("claim_token", row.claim_token)
    .is("processed_at", null);

  if (updateError) {
    console.error("Failed to requeue Algolia sync item:", updateError);
  }
}

export async function processAlgoliaSyncQueue({
  supabase,
  algolia = getAdminClient(),
  batchSize = 100,
}: QueueProcessorOptions): Promise<AlgoliaSyncQueueResult> {
  const { data, error } = await supabase.rpc("claim_algolia_sync_queue", {
    p_batch_size: batchSize,
  });

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? (data as QueueRow[]) : [];
  const result: AlgoliaSyncQueueResult = {
    claimed: rows.length,
    processed: 0,
    requeued: 0,
    failed: 0,
  };

  for (const row of rows) {
    try {
      let ad: QueueAd | null = null;

      if (row.operation === "upsert") {
        const { data: adData, error: adError } = await supabase
          .from("ads")
          .select(ALGOLIA_AD_SELECT)
          .eq("id", row.ad_id)
          .maybeSingle();

        if (adError) {
          throw adError;
        }

        ad = adData as QueueAd | null;
      }

      const shouldIndex =
        row.operation === "upsert"
        && ad !== null
        && ad.status === "active"
        && ad.is_hidden !== true;

      if (shouldIndex) {
        await algolia.saveObjects({
          indexName: getCarsIndexName(),
          objects: [
            transformCarToAlgoliaRecord(
              ad as Parameters<typeof transformCarToAlgoliaRecord>[0],
            ) as AlgoliaCarRecord,
          ],
        });
      } else {
        await algolia.deleteObjects({
          indexName: getCarsIndexName(),
          objectIDs: [row.ad_id],
        });
      }

      if (await markProcessed(supabase, row)) {
        result.processed += 1;
      }
    } catch (error) {
      result.failed += 1;
      await requeue(supabase, row, error);
      result.requeued += 1;
      console.error("Algolia sync queue item failed:", {
        adId: row.ad_id,
        operation: row.operation,
        error,
      });
    }
  }

  return result;
}

export async function processAlgoliaSyncQueueBestEffort(
  options: QueueProcessorOptions,
): Promise<AlgoliaSyncQueueResult> {
  try {
    return await processAlgoliaSyncQueue(options);
  } catch (error) {
    console.error("Algolia sync queue is unavailable:", error);
    return {
      claimed: 0,
      processed: 0,
      requeued: 0,
      failed: 1,
    };
  }
}
