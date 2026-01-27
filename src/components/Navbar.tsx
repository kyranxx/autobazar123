"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

export default function Navbar() {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const { user, profile, loading, signOut, isAdmin } = useAuth();
    const [isSignOutLoading, setIsSignOutLoading] = useState(false);
    const t = useTranslations("common");
    const tDashboard = useTranslations("dashboard");

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        setIsSignOutLoading(true);
        try {
            await signOut();
        } finally {
            setUserMenuOpen(false);
            setIsSignOutLoading(false);
        }
    };

    return (
        <nav className="fixed top-0 z-[100] w-full bg-white/80 backdrop-blur-xl border-b border-border/40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-display font-bold tracking-tight text-primary">
                            Autobazar<span className="text-secondary opacity-40 font-light">123</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-10">
                        <NavLink href="/auta" label={t("cars")} />
                        <NavLink href="/predajcovia" label={t("dealers")} />
                        <NavLink href="/ceny" label={t("pricing")} />
                    </div>

                    {/* Action Area */}
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>

                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />
                        ) : user ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 p-1 rounded-full border border-border bg-white hover:bg-surface transition-all duration-300"
                                >
                                    <div className="flex items-center gap-2 pl-3">
                                        <span className="text-[11px] font-bold text-primary mr-1">{profile?.credit_balance ?? 0} €</span>
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                                            {(profile?.full_name || user.email)?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white border border-border rounded-2xl shadow-premium py-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-6 py-4 border-b border-border/50">
                                            <p className="text-sm font-bold text-primary truncate">
                                                {profile?.full_name || 'Používateľ'}
                                            </p>
                                            <p className="text-xs text-secondary truncate">{user.email}</p>
                                        </div>
                                        <div className="py-2">
                                            {isAdmin && (
                                                <DropdownItem href="/admin" onClick={() => setUserMenuOpen(false)} label="Administrácia" highlight />
                                            )}
                                            <DropdownItem href="/moj-ucet?tab=ads" onClick={() => setUserMenuOpen(false)} label={tDashboard("myAds")} />
                                            <DropdownItem href="/moj-ucet?tab=saved" onClick={() => setUserMenuOpen(false)} label={tDashboard("savedCars")} />
                                            <DropdownItem href="/kredity" onClick={() => setUserMenuOpen(false)} label={tDashboard("credits")} />
                                            <DropdownItem href="/moj-ucet?tab=settings" onClick={() => setUserMenuOpen(false)} label={tDashboard("settings")} />
                                        </div>
                                        <div className="px-2 py-2 border-t border-border/50">
                                            <button
                                                onClick={handleSignOut}
                                                disabled={isSignOutLoading}
                                                className="w-full text-left px-4 py-3 text-xs font-bold text-error hover:bg-error/5 rounded-xl transition-colors"
                                            >
                                                {t("logout")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/auth/login" className="text-sm font-bold text-primary hover:opacity-70 transition-opacity">
                                    {t("login")}
                                </Link>
                                <Link
                                    href="/pridat-inzerat"
                                    className="px-6 py-2.5 bg-accent text-accent-foreground text-sm font-bold rounded-full hover:bg-[#f5a50b] transition-all shadow-lg shadow-accent/20"
                                >
                                    {t("addListing")}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="text-[13px] font-bold text-primary opacity-60 hover:opacity-100 transition-all duration-300"
        >
            {label}
        </Link>
    );
}

function DropdownItem({ href, onClick, label, highlight }: { href: string; onClick: () => void; label: string; highlight?: boolean }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "block px-6 py-3 text-sm font-medium transition-colors hover:bg-surface",
                highlight ? "text-accent font-bold" : "text-primary"
            )}
        >
            {label}
        </Link>
    );
}
