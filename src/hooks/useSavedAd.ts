"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface UseSavedAdOptions {
  initialSaved?: boolean;
  onToggle?: (nextSaved: boolean) => void;
}

export function useSavedAd(adId: string, options: UseSavedAdOptions = {}) {
  const { user } = useAuth();
  const initialSaved = Boolean(options.initialSaved);
  const onToggle = options.onToggle;
  const [saved, setSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const toggleSaved = useCallback(async () => {
    if (isSaving) return;
    if (!user) {
      toast.info("Pre ulozenie inzeratu sa musite prihlasit.");
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setIsSaving(true);

    try {
      const supabase = createClient();

      if (nextSaved) {
        const { error } = await supabase
          .from("saved_ads")
          .insert({ user_id: user.id, ad_id: adId });

        if (error && error.code !== "23505") {
          throw error;
        }
        toast.success("Inzerat ulozeny");
      } else {
        const { error } = await supabase
          .from("saved_ads")
          .delete()
          .eq("user_id", user.id)
          .eq("ad_id", adId);

        if (error) throw error;
        toast.success("Inzerat odstraneny z oblubenych");
      }

      onToggle?.(nextSaved);
    } catch (error) {
      console.error("Error toggling saved ad:", error);
      setSaved(!nextSaved);
      toast.error("Nieco sa pokazilo. Skuste to znova.");
    } finally {
      setIsSaving(false);
    }
  }, [adId, isSaving, onToggle, saved, user]);

  return { saved, isSaving, toggleSaved };
}