"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Demo count when database is empty
const DEMO_COUNT = 1247;

export default function ActiveAdsCount() {
    const [count, setCount] = useState<number>(DEMO_COUNT);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const supabase = createClient();

                const { count: adsCount, error } = await supabase
                    .from("ads")
                    .select("id", { count: "exact", head: true })
                    .eq("status", "active");

                if (!error && adsCount !== null && adsCount > 0) {
                    setCount(adsCount);
                }
                // If error or count is 0, keep demo count
            } catch (_err) {
                // Keep demo count on error
                console.log("Using demo ads count");
            }
        };

        fetchCount();
    }, []);

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm text-sm text-secondary">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span>{count.toLocaleString("sk-SK")} aktívnych inzerátov</span>
        </div>
    );
}

