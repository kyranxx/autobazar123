"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const t = useTranslations("common");
  const tDashboard = useTranslations("dashboard");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    setIsSignOutLoading(true);
    try {
      await signOut();
    } finally {
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      setIsSignOutLoading(false);
    }
  };

  const navLinks = [
    { href: "/auta", label: t("cars") },
    { href: "/predajcovia", label: t("dealers") },
    { href: "/ceny", label: t("pricing") },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e5e5e5]">
      <nav className="container-main">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg sm:text-xl font-[family-name:var(--font-display)] font-semibold tracking-tight text-[#0a0a0a]">
              Autobazar<span className="text-[#737373] font-normal">123</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-[#f5f5f5] animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#fafafa] transition-colors"
                >
                  <span className="hidden sm:block text-sm font-medium text-[#525252]">
                    {profile?.credit_balance ?? 0} €
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center text-white text-sm font-medium">
                    {(profile?.full_name || user.email)?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e5e5e5] rounded-lg shadow-lg py-1 animate-fade-in">
                    <div className="px-4 py-3 border-b border-[#f0f0f0]">
                      <p className="text-sm font-medium text-[#0a0a0a] truncate">
                        {profile?.full_name || 'Používateľ'}
                      </p>
                      <p className="text-xs text-[#737373] truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {isAdmin && (
                        <DropdownItem href="/admin" onClick={() => setUserMenuOpen(false)} label="Administrácia" isAdmin />
                      )}
                      <DropdownItem href="/moj-ucet?tab=ads" onClick={() => setUserMenuOpen(false)} label={tDashboard("myAds")} />
                      <DropdownItem href="/moj-ucet?tab=saved" onClick={() => setUserMenuOpen(false)} label={tDashboard("savedCars")} />
                      <DropdownItem href="/kredity" onClick={() => setUserMenuOpen(false)} label={tDashboard("credits")} />
                      <DropdownItem href="/moj-ucet?tab=settings" onClick={() => setUserMenuOpen(false)} label={tDashboard("settings")} />
                    </div>
                    <div className="border-t border-[#f0f0f0] px-1 py-1">
                      <button
                        onClick={handleSignOut}
                        disabled={isSignOutLoading}
                        className="w-full text-left px-3 py-2 text-sm text-[#dc2626] hover:bg-[#fef2f2] rounded-md transition-colors"
                      >
                        {isSignOutLoading ? 'Odhlasovanie...' : t("logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link 
                  href="/auth/login" 
                  className="hidden sm:block text-sm font-medium text-[#525252] hover:text-[#0a0a0a] transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/pridat-inzerat"
                  className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-[#0a0a0a] rounded-md hover:bg-[#262626] active:scale-[0.98] transition-all"
                >
                  <span className="hidden sm:inline">{t("addListing")}</span>
                  <span className="sm:hidden">+</span>
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -mr-2 rounded-md hover:bg-[#fafafa] transition-colors"
              aria-label={mobileMenuOpen ? "Zavrieť menu" : "Otvoriť menu"}
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1.5">
                <span className={cn(
                  "w-5 h-0.5 bg-[#0a0a0a] transition-all duration-200",
                  mobileMenuOpen && "rotate-45 translate-y-2"
                )} />
                <span className={cn(
                  "w-5 h-0.5 bg-[#0a0a0a] transition-all duration-200",
                  mobileMenuOpen && "opacity-0"
                )} />
                <span className={cn(
                  "w-5 h-0.5 bg-[#0a0a0a] transition-all duration-200",
                  mobileMenuOpen && "-rotate-45 -translate-y-2"
                )} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#e5e5e5] shadow-lg animate-fade-in"
        >
          <div className="container-main py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-base font-medium text-[#0a0a0a] hover:bg-[#fafafa] rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            <div className="border-t border-[#e5e5e5] my-3 pt-3">
              {!user && (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-[#0a0a0a] hover:bg-[#fafafa] rounded-md transition-colors"
                >
                  {t("login")}
                </Link>
              )}
              <div className="px-4 py-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-[#525252] hover:text-[#0a0a0a] rounded-md hover:bg-[#fafafa] transition-colors"
    >
      {label}
    </Link>
  );
}

function DropdownItem({ 
  href, 
  onClick, 
  label, 
  isAdmin 
}: { 
  href: string; 
  onClick: () => void; 
  label: string; 
  isAdmin?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block px-3 py-2 text-sm rounded-md transition-colors",
        isAdmin 
          ? "text-[#2563eb] font-medium hover:bg-[#eff6ff]" 
          : "text-[#525252] hover:text-[#0a0a0a] hover:bg-[#fafafa]"
      )}
    >
      {label}
    </Link>
  );
}
