"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const { user, profile, loading, signOut } = useAuth();
    const t = useTranslations("common");
    const tDashboard = useTranslations("dashboard");

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close user menu when clicking outside
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
        console.log("Sign out initiated...");
        await signOut();
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
    };

    return (
        <nav
            className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled
                ? "glass border-b border-border shadow-sm"
                : "bg-transparent"
                }`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-1.5 group">
                    <span className="text-xl font-bold tracking-tight text-primary transition-transform group-hover:scale-[1.02]">
                        Autobazar
                        <span className="text-accent">123</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-8 md:flex">
                    <Link
                        href="/auta"
                        className="text-sm font-medium text-secondary hover:text-primary"
                    >
                        {t("cars")}
                    </Link>
                    <Link
                        href="/predajcovia"
                        className="text-sm font-medium text-secondary hover:text-primary"
                    >
                        {t("dealers")}
                    </Link>
                    <Link
                        href="/ceny"
                        className="text-sm font-medium text-secondary hover:text-primary"
                    >
                        {t("pricing")}
                    </Link>
                </div>

                {/* Right Side - Desktop */}
                <div className="hidden items-center gap-4 md:flex">
                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {loading ? (
                        <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />
                    ) : user ? (
                        /* Logged In State */
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 rounded-full bg-surface px-3 py-2 hover:bg-surface-hover transition-colors"
                            >
                                {/* Credit Balance */}
                                <div className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary">
                                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                                    </svg>
                                    <span>{profile?.credit_balance ?? 0}</span>
                                </div>

                                {/* Avatar */}
                                {(user.user_metadata?.avatar_url || profile?.avatar_url) ? (
                                    <Image
                                        src={user.user_metadata?.avatar_url || profile?.avatar_url || ''}
                                        alt="Profile"
                                        width={32}
                                        height={32}
                                        className="rounded-full object-cover border border-border"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                                        {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}

                                <svg className={`w-4 h-4 text-secondary transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-background border border-border shadow-lg py-2 animate-fade-in">
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            {(user.user_metadata?.avatar_url || profile?.avatar_url) ? (
                                                <Image
                                                    src={user.user_metadata?.avatar_url || profile?.avatar_url || ''}
                                                    alt="Profile"
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full object-cover border border-border"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                                    {(user.user_metadata?.full_name || profile?.full_name || user.email)?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-primary truncate">
                                                    {user.user_metadata?.full_name || profile?.full_name || 'Používateľ'}
                                                </p>
                                                <p className="text-sm text-secondary truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 mt-3 text-sm text-accent font-medium">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                                            </svg>
                                            {profile?.credit_balance ?? 0} {tDashboard("credits")}
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        <Link
                                            href="/moj-ucet?tab=ads"
                                            className="block px-4 py-2 text-sm text-primary hover:bg-surface"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            {tDashboard("myAds")}
                                        </Link>
                                        <Link
                                            href="/moj-ucet?tab=saved"
                                            className="block px-4 py-2 text-sm text-primary hover:bg-surface"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            {tDashboard("savedCars")}
                                        </Link>
                                        <Link
                                            href="/moj-ucet?tab=messages"
                                            className="block px-4 py-2 text-sm text-primary hover:bg-surface"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            {tDashboard("messages")}
                                        </Link>
                                        <Link
                                            href="/kredity"
                                            className="block px-4 py-2 text-sm text-accent font-medium hover:bg-surface"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            {tDashboard("credits")}
                                        </Link>
                                    </div>

                                    <div className="border-t border-border py-1">
                                        <Link
                                            href="/moj-ucet?tab=settings"
                                            className="block px-4 py-2 text-sm text-primary hover:bg-surface"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            {tDashboard("settings")}
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-surface"
                                        >
                                            {t("logout")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Logged Out State */
                        <>
                            <Link
                                href="/auth/login"
                                className="text-sm font-medium text-secondary hover:text-primary"
                            >
                                {t("login")}
                            </Link>
                            <Link
                                href="/pridat-inzerat"
                                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background shadow-sm hover:opacity-90 active:scale-[0.98]"
                            >
                                {t("addListing")}
                            </Link>
                        </>
                    )}

                    {/* Add Ad Button - Always visible when logged in */}
                    {user && (
                        <Link
                            href="/pridat-inzerat"
                            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background shadow-sm hover:opacity-90 active:scale-[0.98]"
                        >
                            {t("addListing")}
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        {mobileMenuOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="border-t border-border bg-background md:hidden animate-fade-in">
                    <div className="px-4 py-6 space-y-4">
                        <Link
                            href="/auta"
                            className="block text-base font-medium text-primary hover:text-accent"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {t("cars")}
                        </Link>
                        <Link
                            href="/predajcovia"
                            className="block text-base font-medium text-primary hover:text-accent"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {t("dealers")}
                        </Link>
                        <Link
                            href="/ceny"
                            className="block text-base font-medium text-primary hover:text-accent"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {t("pricing")}
                        </Link>
                        <hr className="border-border" />

                        {loading ? (
                            <div className="h-12 rounded-full bg-surface animate-pulse" />
                        ) : user ? (
                            <>
                                {/* Mobile User Info */}
                                <div className="flex items-center gap-3 py-2">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                        {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-primary">
                                            {profile?.full_name || 'Používateľ'}
                                        </p>
                                        <p className="text-sm text-accent font-medium">
                                            {profile?.credit_balance ?? 0} {tDashboard("credits")}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/moj-ucet?tab=ads"
                                    className="block text-base text-primary hover:text-accent"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {tDashboard("myAds")}
                                </Link>
                                <Link
                                    href="/moj-ucet?tab=saved"
                                    className="block text-base text-primary hover:text-accent"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {tDashboard("savedCars")}
                                </Link>
                                <Link
                                    href="/kredity"
                                    className="block text-base text-accent font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {tDashboard("credits")}
                                </Link>
                                <hr className="border-border" />
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSignOut}
                                        className="flex-1 rounded-full border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                        {t("logout")}
                                    </button>
                                    <Link
                                        href="/pridat-inzerat"
                                        className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-background text-center"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {t("addListing")}
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="flex gap-3">
                                <Link
                                    href="/auth/login"
                                    className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium text-primary hover:bg-surface text-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t("login")}
                                </Link>
                                <Link
                                    href="/pridat-inzerat"
                                    className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-background text-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t("addListing")}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
