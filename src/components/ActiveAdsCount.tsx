"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Fallback count when database is empty or errors
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
                // Use fallback on error
                setCount(FALLBACK_COUNT);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCount();
    }, []);

    // Show skeleton during loading to avoid flicker
    if (isLoading) {
        return (
            <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-background-tertiary animate-pulse" />
                <span className="w-24 h-4 bg-background-tertiary rounded animate-pulse" />
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>{(count ?? FALLBACK_COUNT).toLocaleString("sk-SK")} aktívnych inzerátov</span>
        </div>
    );
}
