"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import AuthModal from "@/components/AuthModal";
import { cn } from "@/utils/cn";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [avatarErrorUrl, setAvatarErrorUrl] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, profile, signOut, isAdmin } = useAuth();
  const t = useTranslations("common");

  // Prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration fix pattern
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
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

  // Close mobile menu when screen is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    // Also check on mount in case the menu was somehow left open
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  const identityData = user?.identities?.[0]?.identity_data as
    | Record<string, unknown>
    | undefined;

  const avatarUrl =
    (typeof user?.user_metadata?.avatar_url === "string"
      ? (user.user_metadata.avatar_url as string)
      : undefined) ||
    (typeof user?.user_metadata?.picture === "string"
      ? (user.user_metadata.picture as string)
      : undefined) ||
    (identityData && typeof identityData.avatar_url === "string"
      ? (identityData.avatar_url as string)
      : undefined) ||
    (identityData && typeof identityData.picture === "string"
      ? (identityData.picture as string)
      : undefined) ||
    profile?.avatar_url;

  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string"
      ? (user.user_metadata.full_name as string)
      : undefined) ||
    user?.email ||
    "Používateľ";

  const userInitials =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    user?.email?.substring(0, 2).toUpperCase() ||
    "U";

  const openAuthModal = () => {
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const safeNavigate =
    (_href: string, onAfterNavigate?: () => void) =>
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Preserve native behaviors like open-in-new-tab, middle-click, etc.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      onAfterNavigate?.();
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
              onClick={safeNavigate("/")}
            >
              <span className="text-xl font-display font-semibold tracking-tight text-text-primary">
                AB<span className="text-accent">123</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex items-center gap-1"
              aria-label="Hlavná navigácia"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg"
                  onClick={safeNavigate(link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Add Listing CTA - Always visible, responsive */}
              <Link
                href="/pridat-inzerat"
                className="inline-flex items-center justify-center btn-primary text-sm font-semibold px-3 sm:px-4 py-2 min-h-[44px] gap-1.5"
                aria-label={t("addListing")}
                onClick={safeNavigate("/pridat-inzerat")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden xs:inline">{t("addListing")}</span>
              </Link>

              {/* User Menu / Login */}
              <div>
                {isMounted ? (
                  user ? (
                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={cn(
                          "relative overflow-hidden flex h-9 w-9 items-center justify-center rounded-full",
                          "bg-background-tertiary border border-border-subtle",
                          "text-sm font-semibold text-text-primary",
                          "transition-all hover:bg-background-muted hover:border-border-strong",
                          userMenuOpen && "ring-2 ring-accent/20",
                        )}
                        aria-expanded={userMenuOpen}
                        aria-haspopup="true"
                        aria-label="Používateľské menu"
                      >
                        {avatarUrl && avatarErrorUrl !== avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={displayName}
                            fill
                            sizes="36px"
                            className="object-cover"
                            onError={() => avatarUrl && setAvatarErrorUrl(avatarUrl)}
                          />
                        ) : (
                          userInitials
                        )}
                      </button>

                      {/* User Dropdown */}
                      <div
                        className={cn(
                          "absolute right-0 top-full mt-2 w-56",
                          "bg-background-secondary border border-border-subtle rounded-xl shadow-lg",
                          "origin-top-right transition-all duration-200",
                          userMenuOpen
                            ? "opacity-100 scale-100 pointer-events-auto"
                            : "opacity-0 scale-95 pointer-events-none",
                        )}
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <div className="px-4 py-3 border-b border-border-subtle">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {profile?.full_name || "Používateľ"}
                          </p>
                          <p className="text-xs text-text-tertiary truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-1.5">
                          {isAdmin && (
                            <DropdownItem
                              href="/admin"
                              onClick={safeNavigate("/admin", () =>
                                setUserMenuOpen(false),
                              )}
                            >
                              Admin
                            </DropdownItem>
                          )}
                          <DropdownItem
                            href="/moj-ucet"
                            onClick={safeNavigate("/moj-ucet", () =>
                              setUserMenuOpen(false),
                            )}
                          >
                            {t("myAccount")}
                          </DropdownItem>
                          <DropdownItem
                            href="/moje-inzeraty"
                            onClick={safeNavigate("/moje-inzeraty", () =>
                              setUserMenuOpen(false),
                            )}
                          >
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
                      type="button"
                      onClick={openAuthModal}
                      className="inline-flex px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {t("login")}
                    </button>
                  )
                ) : (
                  <div className="w-[82px] h-9" />
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-text-primary hover:bg-background-tertiary transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Otvoriť menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay - only render when open and mounted */}
        {isMounted && mobileMenuOpen && (
          <div
            className="fixed inset-0 z-[150] md:hidden"
            aria-hidden={!mobileMenuOpen}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <div
              className="absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-background-secondary shadow-xl flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Menu navigácie"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-subtle">
                <span className="text-lg font-semibold text-text-primary">
                  Menu
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-background-tertiary text-text-primary hover:bg-background-muted transition-colors"
                  aria-label="Zavrieť menu"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation */}
              <nav
                className="flex-1 overflow-y-auto py-4"
                aria-label="Mobilná navigácia"
              >
                <div className="px-4 space-y-1">
                  {navLinks.map((link) => (
                    <MobileMenuItem
                      key={link.href}
                      href={link.href}
                      onClick={safeNavigate(link.href, () =>
                        setMobileMenuOpen(false),
                      )}
                    >
                      {link.label}
                    </MobileMenuItem>
                  ))}
                  <MobileMenuItem
                    href="/o-nas"
                    onClick={safeNavigate("/o-nas", () => setMobileMenuOpen(false))}
                  >
                    {t("about")}
                  </MobileMenuItem>
                  <MobileMenuItem
                    href="/kontakt"
                    onClick={safeNavigate("/kontakt", () => setMobileMenuOpen(false))}
                  >
                    {t("contact")}
                  </MobileMenuItem>
                </div>

                <div className="border-t border-border-subtle my-4" />

                <div className="px-4 space-y-3">
                  <Link
                    href="/pridat-inzerat"
                    className="btn-accent w-full py-3 text-center text-sm font-semibold"
                    onClick={safeNavigate("/pridat-inzerat", () =>
                      setMobileMenuOpen(false),
                    )}
                  >
                    + {t("addListing")}
                  </Link>

                  <div>
                    {isMounted && !user && (
                      <button
                        onClick={openAuthModal}
                        className="btn-outline w-full py-3 text-center text-sm font-semibold"
                      >
                        {t("login")}
                      </button>
                    )}
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

function MobileMenuItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
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
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
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
