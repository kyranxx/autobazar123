import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface CachedResponse {
  response: Record<string, unknown>;
  statusCode: number;
}

export async function checkIdempotencyKey(
  key: string,
): Promise<CachedResponse | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("idempotency_keys")
    .select("response, status_code")
    .eq("key", key)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    response: data.response as Record<string, unknown>,
    statusCode: data.status_code,
  };
}

export async function storeIdempotencyKey(
  key: string,
  response: Record<string, unknown>,
  statusCode: number = 200,
): Promise<void> {
  const supabase = getAdminClient();

  await supabase.from("idempotency_keys").upsert({
    key,
    response,
    status_code: statusCode,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  });
}
