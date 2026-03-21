import { createClient } from "@supabase/supabase-js";
import { getTrimmedEnv } from "@/lib/env";

export function createAdminClient() {
  const supabaseUrl = getTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getTrimmedEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
