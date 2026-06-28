/**
 * Anonymous Supabase client for public read operations
 * Does NOT use cookies and never carries user session state.
 * Use this for public data that doesn't require authentication
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getTrimmedEnv } from "@/lib/env";

// Singleton instance for the anonymous client
let anonClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Get an anonymous Supabase client for public reads.
 */
export function getAnonClient() {
  if (!anonClient) {
    const supabaseUrl = getTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnonKey = getTrimmedEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing required runtime env vars for app: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    }

    anonClient = createSupabaseClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
  return anonClient;
}
