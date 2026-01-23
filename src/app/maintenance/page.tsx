"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function MaintenanceContent() {
    const [password, setPassword] = useState("");
    const [mPassword, setMPassword] = useState("autobazar2026");
    const [error, setError] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchPassword = async () => {
            try {
                const { data } = await supabase
                    .from("site_settings")
                    .select("value")
                    .eq("key", "maintenance_password")
                    .single();
                if (data?.value) {
                    setMPassword(data.value);
                }
            } catch (err) {
                console.error("Error fetching maintenance password:", err);
            }
        };
        fetchPassword();
    }, [supabase]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        setIsChecking(true);

        if (password === mPassword) {
            document.cookie = "maintenance_bypass=true; path=/; max-age=86400; SameSite=Lax";
            router.push("/");
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
        setIsChecking(false);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Logo */}
                <div className="inline-flex items-center gap-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-hover rounded-2xl flex items-center justify-center shadow-xl">
                        <span className="text-white font-bold text-xl">A</span>
                    </div>
                    <span className="text-3xl font-bold text-primary">
                        Autobazar<span className="text-accent">123</span>
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-accent/10 text-accent mb-2">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-extrabold text-primary tracking-tight">
                        Pracujeme na vylepšeniach
                    </h1>
                    <p className="text-lg text-secondary">
                        Naša stránka je momentálne v režime údržby.
                        Vrátime sa čoskoro s ešte lepším zážitkom pre vás!
                    </p>
                </div>

                {/* Unlock Form (Hidden/Subtle) */}
                <div className="pt-8 opacity-20 hover:opacity-100 transition-opacity duration-300">
                    <form onSubmit={handleUnlock} className="flex gap-2 max-w-xs mx-auto">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Unlock password..."
                            className={`flex-1 px-4 py-2 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all ${error ? "border-error ring-error" : ""}`}
                        />
                        <button
                            type="submit"
                            disabled={isChecking}
                            className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors shadow-lg"
                        >
                            {isChecking ? "..." : "Unlock"}
                        </button>
                    </form>
                </div>

                <div className="pt-12 text-sm text-tertiary" suppressHydrationWarning>
                    &copy; {new Date().getFullYear()} Autobazar123. Všetky práva vyhradené.
                </div>
            </div>
        </div>
    );
}

export default function MaintenancePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
            </div>
        }>
            <MaintenanceContent />
        </Suspense>
    );
}
