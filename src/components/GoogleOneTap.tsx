"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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

export default function GoogleOneTap() {
  const { user, loading } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (!error) {
          router.refresh();
        }
      } catch {
        // Silent fail
      }
    },
    [supabase.auth, router],
  );

  useEffect(() => {
    if (loading || user) return;

    const oneTapFlag = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP;
    const oneTapEnabled =
      oneTapFlag === "true" ||
      (oneTapFlag !== "false" &&
        Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID));
    if (!oneTapEnabled) return;

    if (typeof window !== "undefined") {
      const isWebDriver =
        typeof navigator !== "undefined" && navigator.webdriver;
      if (isWebDriver) return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: true,
          cancel_on_tap_outside: false,
        });
        window.google.accounts.id.prompt();
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
  }, [loading, user, handleCredentialResponse]);

  return null;
}
