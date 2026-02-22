"use client";

import { useEffect, useReducer } from "react";
import { createClient } from "@/lib/supabase/client";

const FALLBACK_COUNT = 190;

interface ActiveAdsState {
  count: number | null;
  isLoading: boolean;
}

type ActiveAdsAction = {
  type: "loaded";
  count: number;
};

const initialState: ActiveAdsState = {
  count: null,
  isLoading: true,
};

function activeAdsReducer(
  _state: ActiveAdsState,
  action: ActiveAdsAction,
): ActiveAdsState {
  if (action.type === "loaded") {
    return {
      count: action.count,
      isLoading: false,
    };
  }

  return _state;
}

export default function ActiveAdsCount() {
  const [state, dispatch] = useReducer(activeAdsReducer, initialState);

  useEffect(() => {
    const fetchCount = async () => {
      let resolvedCount = FALLBACK_COUNT;

      try {
        const supabase = createClient();

        const { count: adsCount, error } = await supabase
          .from("ads")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");

        if (!error && adsCount !== null) {
          resolvedCount = adsCount;
        }
      } catch (_err) {
        // Fall back to static number when request fails.
      } finally {
        dispatch({ type: "loaded", count: resolvedCount });
      }
    };

    void fetchCount();
  }, []);

  if (state.isLoading) {
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
      <span>
        {(state.count ?? FALLBACK_COUNT).toLocaleString("sk-SK")} aktívnych
        inzerátov
      </span>
    </div>
  );
}
