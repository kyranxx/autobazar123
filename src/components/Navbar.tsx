"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
                        Autá
                    </Link>
                    <Link
                        href="/predajcovia"
                        className="text-sm font-medium text-secondary hover:text-primary"
                    >
                        Predajcovia
                    </Link>
                    <Link
                        href="/ceny"
                        className="text-sm font-medium text-secondary hover:text-primary"
                    >
                        Cenník
                    </Link>
                </div>

                {/* Right Side - Desktop */}
                <div className="hidden items-center gap-4 md:flex">
                    {/* Language Switcher */}
                    <div className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-secondary">
                        <button className="px-1.5 py-0.5 rounded-full bg-background text-primary shadow-sm">
                            SK
                        </button>
                        <button className="px-1.5 py-0.5 rounded-full hover:bg-surface-hover">
                            EN
                        </button>
                        <button className="px-1.5 py-0.5 rounded-full hover:bg-surface-hover">
                            HU
                        </button>
                    </div>

                    {/* Auth Buttons */}
                    <button className="text-sm font-medium text-secondary hover:text-primary">
                        Prihlásiť sa
                    </button>
                    <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background shadow-sm hover:opacity-90 active:scale-[0.98]">
                        Pridať inzerát
                    </button>
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
                        >
                            Autá
                        </Link>
                        <Link
                            href="/predajcovia"
                            className="block text-base font-medium text-primary hover:text-accent"
                        >
                            Predajcovia
                        </Link>
                        <Link
                            href="/ceny"
                            className="block text-base font-medium text-primary hover:text-accent"
                        >
                            Cenník
                        </Link>
                        <hr className="border-border" />
                        <div className="flex gap-3">
                            <button className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium text-primary hover:bg-surface">
                                Prihlásiť sa
                            </button>
                            <button className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-background">
                                Pridať inzerát
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
