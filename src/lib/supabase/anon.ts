/**
 * Anonymous Supabase client for public read operations
 * Does NOT use cookies, allowing Next.js to cache these requests
 * Use this for public data that doesn't require authentication
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Singleton instance for the anonymous client
let anonClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Get an anonymous Supabase client that can be cached by Next.js
 * This client doesn't access cookies, so requests using it are cacheable
 */
export function getAnonClient() {
  if (!anonClient) {
    anonClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: (url, options = {}) => {
            // Add cache headers for Next.js to cache these requests
            return fetch(url, {
              ...options,
              next: {
                revalidate: 300, // Cache for 5 minutes
              },
            } as RequestInit);
          },
        },
      },
    );
  }
  return anonClient;
}
