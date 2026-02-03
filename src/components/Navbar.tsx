"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const t = useTranslations("common");

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 h-0 overflow-visible pointer-events-none">
      <div className="w-full max-w-7xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto transition-all duration-300 hover:bg-[#0f172a]/90 mt-2">

        {/* Logo - Pure & Bold */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shadow-lg group-hover:scale-110 transition-transform">
            AB
          </div>
          <span className="text-xl font-display font-bold text-white tracking-tight">
            Autobazar<span className="text-accent font-light">123</span>
          </span>
        </Link>

        {/* Desktop Navigation - Centered Pills */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/vysledky", label: t("cars") }, // Translated labels would be better but keeping simple for now
            { href: "/predajcovia", label: t("dealers") },
            { href: "/ceny", label: t("pricing") },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions - Right Side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Add Listing - Primary Action */}
          <Link
            href="/pridat-inzerat"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2 rounded-full bg-white text-primary text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            {t("addListing")}
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 rounded-full bg-white/20 border border-white/10 flex items-center justify-center text-white font-medium hover:bg-white/30 transition-colors"
              >
                {userInitials}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-4 w-60 bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl py-2 animate-fade-in overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-semibold text-white truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    {isAdmin && (
                      <DropdownItem href="/admin" onClick={() => setUserMenuOpen(false)} label="Admin" />
                    )}
                    <DropdownItem href="/moj-ucet" onClick={() => setUserMenuOpen(false)} label="Môj účet" />
                    <DropdownItem href="/moje-inzeraty" onClick={() => setUserMenuOpen(false)} label="Moje inzeráty" />
                  </div>
                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      Odhlásiť sa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium text-white/80 hover:text-white px-3 py-2"
            >
              {t("login")}
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#0f172a]/98 backdrop-blur-xl pointer-events-auto p-6 flex flex-col animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <span className="text-2xl font-display font-bold text-white">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2 bg-white/10 rounded-full">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 text-center">
            <Link href="/vysledky" className="text-3xl font-display text-white" onClick={() => setMobileMenuOpen(false)}>Ponuka áut</Link>
            <Link href="/pridat-inzerat" className="text-3xl font-display text-accent" onClick={() => setMobileMenuOpen(false)}>Predať auto</Link>
            <Link href="/predajcovia" className="text-xl text-gray-400" onClick={() => setMobileMenuOpen(false)}>Predajcovia</Link>
            <Link href="/o-nas" className="text-xl text-gray-400" onClick={() => setMobileMenuOpen(false)}>O nás</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function DropdownItem({ href, onClick, label }: { href: string; onClick: () => void; label: string }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
    >
      {label}
    </Link>
  );
}
