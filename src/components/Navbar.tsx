"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import AuthModal from "@/components/AuthModal";
import { cn } from "@/utils/cn";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "U";

  const openAuthModal = () => {
    setMobileMenuOpen(false);
    setAuthModalOpen(true);
  };

  const navLinks = [
    { href: "/vysledky", label: t("cars") },
    { href: "/predajcovia", label: t("dealers") },
    { href: "/ceny", label: t("pricing") },
  ];

  return (
    <>
      <header className="relative z-50 bg-background border-b border-border-subtle">
        <div className="container-main">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
              aria-label="Autobazar123 - Domov"
            >
              <span className="text-xl font-display font-semibold tracking-tight text-text-primary">
                AB<span className="text-accent">123</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Hlavná navigácia">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Add Listing CTA */}
              <Link
                href="/pridat-inzerat"
                className="hidden sm:inline-flex btn-accent text-sm font-semibold px-4 py-2"
              >
                <span className="hidden lg:inline">+ {t("addListing")}</span>
                <span className="lg:hidden">+ Inzerát</span>
              </Link>

              {/* User Menu / Login */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      "bg-background-tertiary border border-border-subtle",
                      "text-sm font-semibold text-text-primary",
                      "transition-all hover:bg-background-muted hover:border-border-strong",
                      userMenuOpen && "ring-2 ring-accent/20"
                    )}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="Používateľské menu"
                  >
                    {userInitials}
                  </button>

                  {/* User Dropdown */}
                  <div
                    className={cn(
                      "absolute right-0 top-full mt-2 w-56",
                      "bg-background-secondary border border-border-subtle rounded-xl shadow-lg",
                      "origin-top-right transition-all duration-200",
                      userMenuOpen
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    )}
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="px-4 py-3 border-b border-border-subtle">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {profile?.full_name || "Používateľ"}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                    </div>
                    <div className="py-1.5">
                      {isAdmin && (
                        <DropdownItem href="/admin" onClick={() => setUserMenuOpen(false)}>
                          Admin
                        </DropdownItem>
                      )}
                      <DropdownItem href="/moj-ucet" onClick={() => setUserMenuOpen(false)}>
                        {t("myAccount")}
                      </DropdownItem>
                      <DropdownItem href="/moje-inzeraty" onClick={() => setUserMenuOpen(false)}>
                        Moje inzeráty
                      </DropdownItem>
                    </div>
                    <div className="border-t border-border-subtle py-1.5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-error hover:bg-background-tertiary transition-colors"
                        role="menuitem"
                      >
                        {t("logout")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  {t("login")}
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-text-primary hover:bg-background-tertiary transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Otvoriť menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={cn(
            "fixed inset-0 z-[150] md:hidden",
            mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
          aria-hidden={!mobileMenuOpen}
        >
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw]",
              "bg-background-secondary shadow-xl flex flex-col",
              "transition-transform duration-300 ease-out",
              mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigácie"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <span className="text-lg font-semibold text-text-primary">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-background-tertiary text-text-primary hover:bg-background-muted transition-colors"
                aria-label="Zavrieť menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4" aria-label="Mobilná navigácia">
              <div className="px-4 space-y-1">
                {navLinks.map((link) => (
                  <MobileMenuItem key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </MobileMenuItem>
                ))}
                <MobileMenuItem href="/o-nas" onClick={() => setMobileMenuOpen(false)}>
                  {t("about")}
                </MobileMenuItem>
                <MobileMenuItem href="/kontakt" onClick={() => setMobileMenuOpen(false)}>
                  {t("contact")}
                </MobileMenuItem>
              </div>

              <div className="border-t border-border-subtle my-4" />

              <div className="px-4 space-y-3">
                <Link
                  href="/pridat-inzerat"
                  className="btn-accent w-full py-3 text-center text-sm font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  + {t("addListing")}
                </Link>

                {!user && (
                  <button onClick={openAuthModal} className="btn-outline w-full py-3 text-center text-sm font-semibold">
                    {t("login")}
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

function MobileMenuItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-3 text-base font-medium text-text-primary rounded-lg hover:bg-background-tertiary transition-colors"
    >
      {children}
    </Link>
  );
}

function DropdownItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors"
      role="menuitem"
    >
      {children}
    </Link>
  );
}
