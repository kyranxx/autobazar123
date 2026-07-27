"use client";

import { useEffect, useCallback, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapProps {
  clientId: string | null;
  enabled: boolean;
}

export default function GoogleOneTap({
  clientId,
  enabled,
}: GoogleOneTapProps) {
  const { user, loading } = useAuth();
  const { refresh } = useRouter();
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const getSupabaseClient = useCallback(async (): Promise<SupabaseClient | null> => {
    if (typeof window === "undefined") {
      return null;
    }

    if (supabaseRef.current) {
      return supabaseRef.current;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    supabaseRef.current = client;
    return client;
  }, []);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
          return;
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (!error) {
          refresh();
        }
      } catch {
        // Silent fail
      }
    },
    [getSupabaseClient, refresh],
  );

  useEffect(() => {
    if (loading || user) return;

    if (!enabled || !clientId) return;

    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const protocol = typeof window !== "undefined" ? window.location.protocol : "";
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isSecureOrigin = protocol === "https:";
    if (!isSecureOrigin || isLocalhost) return;

    if (typeof window !== "undefined") {
      const isWebDriver =
        typeof navigator !== "undefined" && navigator.webdriver;
      if (isWebDriver) return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        try {
          window.google.accounts.id.prompt();
        } catch {
          // Silent fail
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (window.google) {
        window.google.accounts.id.cancel();
      }
      document
        .querySelector('script[src="https://accounts.google.com/gsi/client"]')
        ?.remove();
    };
  }, [clientId, enabled, loading, user, handleCredentialResponse]);

  return null;
}
