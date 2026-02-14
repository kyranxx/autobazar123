"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const FALLBACK_COUNT = 190;

export default function ActiveAdsCount() {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const supabase = createClient();

        const { count: adsCount, error } = await supabase
          .from("ads")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");

        if (!error && adsCount !== null) {
          setCount(adsCount);
        } else {
          setCount(FALLBACK_COUNT);
        }
      } catch (_err) {
        setCount(FALLBACK_COUNT);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-background-tertiary" />
        <span className="h-4 w-24 animate-pulse rounded bg-background-tertiary" />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      <span>{(count ?? FALLBACK_COUNT).toLocaleString("sk-SK")} aktívnych inzerátov</span>
    </div>
  );
}
