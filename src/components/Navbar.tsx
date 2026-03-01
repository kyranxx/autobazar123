"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useSyncExternalStore,
  type MouseEvent,
  type MouseEventHandler,
  type RefObject,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

const loadAuthModal = () => import("@/components/AuthModal");
const AuthModal = dynamic(loadAuthModal, { ssr: false });

type NavLink = {
  href: string;
  label: string;
};

interface NavbarUiState {
  mobileMenuOpen: boolean;
  userMenuOpen: boolean;
  authModalOpen: boolean;
  avatarErrorUrl: string | null;
}

type NavbarUiAction =
  | { type: "open-mobile-menu" }
  | { type: "close-mobile-menu" }
  | { type: "toggle-user-menu" }
  | { type: "close-user-menu" }
  | { type: "open-auth-modal" }
  | { type: "close-auth-modal" }
  | { type: "set-avatar-error-url"; url: string | null };

const INITIAL_NAVBAR_UI_STATE: NavbarUiState = {
  mobileMenuOpen: false,
  userMenuOpen: false,
  authModalOpen: false,
  avatarErrorUrl: null,
};

function navbarUiReducer(state: NavbarUiState, action: NavbarUiAction): NavbarUiState {
  switch (action.type) {
    case "open-mobile-menu":
      return { ...state, mobileMenuOpen: true, userMenuOpen: false };
    case "close-mobile-menu":
      return { ...state, mobileMenuOpen: false };
    case "toggle-user-menu":
      return { ...state, userMenuOpen: !state.userMenuOpen };
    case "close-user-menu":
      return { ...state, userMenuOpen: false };
    case "open-auth-modal":
      return { ...state, authModalOpen: true, mobileMenuOpen: false };
    case "close-auth-modal":
      return { ...state, authModalOpen: false };
    case "set-avatar-error-url":
      return { ...state, avatarErrorUrl: action.url };
    default:
      return state;
  }
}

function subscribeToHydration(): () => void {
  return () => { };
}

function getHydratedSnapshot(): boolean {
  return true;
}

function getServerHydratedSnapshot(): boolean {
  return false;
}

function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export default function Navbar() {
  const [ui, dispatch] = useReducer(navbarUiReducer, INITIAL_NAVBAR_UI_STATE);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, profile, signOut, isAdmin } = useAuth();
  const t = useTranslations("common");
  const isHydrated = useHydrated();

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        dispatch({ type: "close-user-menu" });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = ui.mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ui.mobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && ui.mobileMenuOpen) {
        dispatch({ type: "close-mobile-menu" });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [ui.mobileMenuOpen]);

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
    (profile?.avatar_url ?? undefined);

  useEffect(() => {
    dispatch({ type: "set-avatar-error-url", url: null });
  }, [avatarUrl]);

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
    user?.email?.slice(0, 2).toUpperCase() ||
    "U";

  const navLinks: NavLink[] = [
    { href: "/vysledky", label: t("cars") },
    { href: "/predajcovia", label: t("dealers") },
    { href: "/ceny", label: t("pricing") },
  ];

  const safeNavigate =
    (onAfterNavigate?: () => void): MouseEventHandler<HTMLAnchorElement> =>
      (event) => {
        if (!isPlainLeftClick(event)) {
          return;
        }
        onAfterNavigate?.();
      };

  const preloadAuthModal = useCallback(() => {
    void loadAuthModal();
  }, []);

  const openAuthModal = () => {
    preloadAuthModal();
    dispatch({ type: "open-auth-modal" });
  };
  const closeAuthModal = () => dispatch({ type: "close-auth-modal" });
  const openMobileMenu = () => dispatch({ type: "open-mobile-menu" });
  const closeMobileMenu = () => dispatch({ type: "close-mobile-menu" });
  const closeUserMenu = () => dispatch({ type: "close-user-menu" });
  const toggleUserMenu = () => dispatch({ type: "toggle-user-menu" });

  return (
    <>
      <header className="print:hidden relative z-50 bg-background border-b border-border-subtle">
        <div className="container-main">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
              aria-label="Autobazar123 - Domov"
              onClick={safeNavigate()}
            >
              <span className="text-xl font-display font-semibold tracking-tight text-text-primary">
                Autobazar<span className="text-accent text-[1.12em]">123</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Hlavná navigácia">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg"
                  onClick={safeNavigate()}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                {isHydrated ? (
                  user ? (
                    <AuthenticatedUserMenu
                      userMenuRef={userMenuRef}
                      userMenuOpen={ui.userMenuOpen}
                      onToggleMenu={toggleUserMenu}
                      onCloseMenu={closeUserMenu}
                      onSignOut={() => {
                        closeUserMenu();
                        signOut();
                      }}
                      avatarUrl={avatarUrl}
                      avatarErrorUrl={ui.avatarErrorUrl}
                      onAvatarError={(url) => dispatch({ type: "set-avatar-error-url", url })}
                      displayName={displayName}
                      fullName={profile?.full_name}
                      email={user.email}
                      userInitials={userInitials}
                      isAdmin={isAdmin}
                      safeNavigate={safeNavigate}
                      myAccountLabel={t("myAccount")}
                      logoutLabel={t("logout")}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={openAuthModal}
                      onPointerEnter={preloadAuthModal}
                      onFocus={preloadAuthModal}
                      className="inline-flex px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {t("login")}
                    </button>
                  )
                ) : (
                  <div className="w-[82px] h-9" />
                )}
              </div>

              <button
                type="button"
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-text-primary hover:bg-background-tertiary transition-colors"
                onClick={openMobileMenu}
                aria-label="Otvoriť menu"
                aria-expanded={ui.mobileMenuOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isHydrated && ui.mobileMenuOpen && (
          <MobileMenuOverlay
            navLinks={navLinks}
            closeMobileMenu={closeMobileMenu}
            safeNavigate={safeNavigate}
            openAuthModal={openAuthModal}
            preloadAuthModal={preloadAuthModal}
            showLogin={!user}
            addListingLabel={t("addListing")}
            aboutLabel={t("about")}
            contactLabel={t("contact")}
            loginLabel={t("login")}
          />
        )}
      </header>

      <AuthModal isOpen={ui.authModalOpen} onClose={closeAuthModal} />
    </>
  );
}

function AuthenticatedUserMenu({
  userMenuRef,
  userMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onSignOut,
  avatarUrl,
  avatarErrorUrl,
  onAvatarError,
  displayName,
  fullName,
  email,
  userInitials,
  isAdmin,
  safeNavigate,
  myAccountLabel,
  logoutLabel,
}: {
  userMenuRef: RefObject<HTMLDivElement | null>;
  userMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onSignOut: () => void;
  avatarUrl?: string;
  avatarErrorUrl: string | null;
  onAvatarError: (url: string | null) => void;
  displayName: string;
  fullName?: string | null;
  email?: string | null;
  userInitials: string;
  isAdmin: boolean;
  safeNavigate: (onAfterNavigate?: () => void) => MouseEventHandler<HTMLAnchorElement>;
  myAccountLabel: string;
  logoutLabel: string;
}) {
  return (
    <div className="relative" ref={userMenuRef}>
      <button
        type="button"
        onClick={onToggleMenu}
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
            onError={() => onAvatarError(avatarUrl)}
          />
        ) : (
          userInitials
        )}
      </button>

      <div
        className={cn(
          "absolute right-0 top-full mt-2 w-56",
          "bg-background-secondary border border-border-subtle rounded-xl shadow-lg",
          "origin-top-right transition-all duration-200",
          userMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
        )}
        role="menu"
        aria-orientation="vertical"
      >
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-sm font-semibold text-text-primary truncate">{fullName || "Používateľ"}</p>
          <p className="text-xs text-text-tertiary truncate">{email}</p>
        </div>

        <div className="py-1.5">
          {isAdmin && (
            <DropdownItem href="/admin" onClick={safeNavigate(onCloseMenu)}>
              Admin
            </DropdownItem>
          )}
          <DropdownItem href="/moj-ucet" onClick={safeNavigate(onCloseMenu)}>
            {myAccountLabel}
          </DropdownItem>
        </div>

        <div className="border-t border-border-subtle py-1.5">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full px-4 py-2 text-left text-sm text-error hover:bg-background-tertiary transition-colors"
            role="menuitem"
          >
            {logoutLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileMenuOverlay({
  navLinks,
  closeMobileMenu,
  safeNavigate,
  openAuthModal,
  preloadAuthModal,
  showLogin,
  addListingLabel,
  aboutLabel,
  contactLabel,
  loginLabel,
}: {
  navLinks: NavLink[];
  closeMobileMenu: () => void;
  safeNavigate: (onAfterNavigate?: () => void) => MouseEventHandler<HTMLAnchorElement>;
  openAuthModal: () => void;
  preloadAuthModal: () => void;
  showLogin: boolean;
  addListingLabel: string;
  aboutLabel: string;
  contactLabel: string;
  loginLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-[150] md:hidden" aria-hidden={false}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeMobileMenu}
        aria-label="Zavrieť menu"
      />

      <div
        className="absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-background-secondary shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigacie"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <span className="text-lg font-semibold text-text-primary">Menu</span>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-background-tertiary text-text-primary hover:bg-background-muted transition-colors"
            aria-label="Zavrieť menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4" aria-label="Mobilná navigácia">
          <div className="px-4 space-y-1">
            {navLinks.map((link) => (
              <MobileMenuItem key={link.href} href={link.href} onClick={safeNavigate(closeMobileMenu)}>
                {link.label}
              </MobileMenuItem>
            ))}
            <MobileMenuItem href="/o-nas" onClick={safeNavigate(closeMobileMenu)}>
              {aboutLabel}
            </MobileMenuItem>
            <MobileMenuItem href="/kontakt" onClick={safeNavigate(closeMobileMenu)}>
              {contactLabel}
            </MobileMenuItem>
          </div>

          <div className="border-t border-border-subtle my-4" />

          <div className="px-4 space-y-3">
            <Link
              href="/pridat-inzerat"
              className="btn-accent w-full py-3 text-center text-sm font-semibold"
              onClick={safeNavigate(closeMobileMenu)}
            >
              {addListingLabel}
            </Link>

            {showLogin && (
              <button
                type="button"
                onClick={openAuthModal}
                onPointerEnter={preloadAuthModal}
                onFocus={preloadAuthModal}
                className="btn-outline w-full py-3 text-center text-sm font-semibold"
              >
                {loginLabel}
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

function MobileMenuItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
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
  onClick: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
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

