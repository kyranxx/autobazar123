"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ActiveAdsCount() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchCount = async () => {
            const supabase = createClient();

            const { count: adsCount, error } = await supabase
                .from("ads")
                .select("id", { count: "exact", head: true })
                .eq("status", "active");

            if (!error && adsCount !== null) {
                setCount(adsCount);
            }
        };

        fetchCount();
    }, []);

    if (count === null) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm text-sm text-secondary">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
                <span className="animate-pulse bg-surface rounded w-24 h-4" />
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm text-sm text-secondary">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span>{count.toLocaleString("sk-SK")} aktívnych inzerátov</span>
        </div>
    );
}
