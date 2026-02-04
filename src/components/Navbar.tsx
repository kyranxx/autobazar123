"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, profile, signOut, isAdmin } = useAuth();
  const t = useTranslations("common");

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
      <div className="w-full max-w-7xl bg-background-secondary border border-border shadow-lg rounded-full px-5 py-3 flex items-center justify-between pointer-events-auto transition-shadow hover:shadow-xl mt-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-accent text-text-inverse flex items-center justify-center text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
            AB
          </div>
          <span className="text-xl font-display font-bold text-text-primary tracking-tight">
            Autobazar<span className="text-accent font-light">123</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/vysledky", label: t("cars") },
            { href: "/predajcovia", label: t("dealers") },
            { href: "/ceny", label: t("pricing") },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-full transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <Link
            href="/pridat-inzerat"
            className="hidden sm:inline-flex btn-accent text-sm font-semibold px-5 py-2"
          >
            {t("addListing")}
          </Link>

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 rounded-full bg-background-tertiary border border-border flex items-center justify-center text-text-primary font-semibold transition-colors hover:bg-background-muted"
              >
                {userInitials}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-4 w-60 bg-background-secondary border border-border rounded-2xl shadow-lg py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {profile?.full_name || "User"}
                    </p>
                    <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    {isAdmin && (
                      <DropdownItem href="/admin" onClick={() => setUserMenuOpen(false)} label="Admin" />
                    )}
                    <DropdownItem href="/moj-ucet" onClick={() => setUserMenuOpen(false)} label="MĂ´j ĂşÄŤet" />
                    <DropdownItem href="/moje-inzeraty" onClick={() => setUserMenuOpen(false)} label="Moje inzerĂˇty" />
                  </div>
                  <div className="border-t border-border-subtle mt-1 pt-1">
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-background-tertiary transition-colors"
                    >
                      OdhlĂˇsiĹĄ sa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 transition-colors"
            >
              {t("login")}
            </Link>
          )}

          <button
            className="md:hidden text-text-primary p-2"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-background-secondary pointer-events-auto p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <span className="text-2xl font-display font-bold text-text-primary">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-text-primary p-2 bg-background-tertiary rounded-full"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 text-left">
            <Link href="/vysledky" className="text-2xl font-display text-text-primary" onClick={() => setMobileMenuOpen(false)}>
              Ponuka Ăˇut
            </Link>
            <Link href="/pridat-inzerat" className="text-2xl font-display text-accent" onClick={() => setMobileMenuOpen(false)}>
              PredaĹĄ auto
            </Link>
            <Link href="/predajcovia" className="text-lg text-text-secondary" onClick={() => setMobileMenuOpen(false)}>
              Predajcovia
            </Link>
            <Link href="/o-nas" className="text-lg text-text-secondary" onClick={() => setMobileMenuOpen(false)}>
              O nĂˇs
            </Link>
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
      className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors"
    >
      {label}
    </Link>
  );
}
