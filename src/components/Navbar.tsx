"use client";

import {
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
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import AuthModal from "@/components/AuthModal";
import { cn } from "@/utils/cn";
import { isCurrentNavigationTarget } from "@/components/navbar-navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { HeartIcon, LockIcon, PlusIcon } from "@/components/ui/Icons";

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
  | { type: "open-user-menu" }
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
    case "open-user-menu":
      return { ...state, userMenuOpen: true };
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

function createSafeNavigate(
  pathname: string,
  searchParamsSnapshot: string,
): (href: string, onAfterNavigate?: () => void) => MouseEventHandler<HTMLAnchorElement> {
  return (href: string, onAfterNavigate?: () => void) => (event) => {
    if (!isPlainLeftClick(event)) {
      return;
    }

    if (isCurrentNavigationTarget(pathname, searchParamsSnapshot, href)) {
      event.preventDefault();
      onAfterNavigate?.();
      window.scrollTo({ top: 0, left: 0 });
      return;
    }

    onAfterNavigate?.();
  };
}

function createSafeKeyboardNavigate(
  pathname: string,
  searchParamsSnapshot: string,
  push: (href: string) => void,
): (href: string, onAfterNavigate?: () => void) => (
  event: React.KeyboardEvent<HTMLAnchorElement>,
) => void {
  return (href: string, onAfterNavigate?: () => void) => (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    if (isCurrentNavigationTarget(pathname, searchParamsSnapshot, href)) {
      onAfterNavigate?.();
      window.scrollTo({ top: 0, left: 0 });
      return;
    }

    onAfterNavigate?.();
    push(href);
  };
}

export default function Navbar() {
  const [ui, dispatch] = useReducer(navbarUiReducer, INITIAL_NAVBAR_UI_STATE);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const { push } = useRouter();
  const pathname = usePathname();

  const { user, profile, signOut, isAdmin } = useAuth();
  const t = useTranslations("common");
  const tNav = useTranslations("navbar");
  const isHydrated = useHydrated();
  const searchParamsSnapshot =
    isHydrated && typeof window !== "undefined"
      ? window.location.search.slice(1)
      : "";
  const [hasDealerAccount, resolveDealerAccountState] = useReducer(
    (_current: boolean, next: boolean) => next,
    false,
  );

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        if (userMenuCloseTimerRef.current) {
          clearTimeout(userMenuCloseTimerRef.current);
          userMenuCloseTimerRef.current = null;
        }
        dispatch({ type: "close-user-menu" });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDealerAccountState() {
      if (!user) {
        resolveDealerAccountState(false);
        return;
      }

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("dealers")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1);

        if (cancelled) {
          return;
        }

        if (error) {
          console.error("Navbar dealer lookup failed:", error);
          resolveDealerAccountState(false);
          return;
        }

        resolveDealerAccountState(Array.isArray(data) && data.length > 0);
      } catch (error) {
        if (!cancelled) {
          console.error("Navbar dealer lookup exception:", error);
          resolveDealerAccountState(false);
        }
      }
    }

    void loadDealerAccountState();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = ui.mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ui.mobileMenuOpen]);

  useEffect(() => {
    return () => {
      if (userMenuCloseTimerRef.current) {
        clearTimeout(userMenuCloseTimerRef.current);
      }
    };
  }, []);

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
    tNav("userFallback");

  const userInitials =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    user?.email?.slice(0, 2).toUpperCase() ||
    tNav("userInitial");

  const navLinks: NavLink[] = [
    { href: "/vysledky", label: t("cars") },
    { href: "/predajcovia", label: t("dealers") },
    { href: "/ceny", label: t("pricing") },
  ];
  const mobileAccountLinks: NavLink[] = [
    ...(isAdmin ? [{ href: "/admin/today", label: tNav("adminLabel") }] : []),
    ...(hasDealerAccount
      ? [{ href: "/dealer", label: tNav("dealerDashboardLabel") }]
      : []),
    ...(user ? [{ href: "/moj-ucet", label: t("myAccount") }] : []),
  ];

  const safeNavigate = createSafeNavigate(pathname, searchParamsSnapshot);
  const safeKeyboardNavigate = createSafeKeyboardNavigate(
    pathname,
    searchParamsSnapshot,
    push,
  );
  const desktopNavLinks: NavLink[] = [...navLinks, { href: "/kontakt", label: t("contact") }];

  const openAuthModal = () => {
    dispatch({ type: "open-auth-modal" });
  };
  const closeAuthModal = () => dispatch({ type: "close-auth-modal" });
  const openMobileMenu = () => dispatch({ type: "open-mobile-menu" });
  const closeMobileMenu = () => dispatch({ type: "close-mobile-menu" });
  const closeMobileMenuAndRestoreFocus = () => {
    dispatch({ type: "close-mobile-menu" });
    requestAnimationFrame(() => {
      mobileMenuButtonRef.current?.focus();
    });
  };
  const openUserMenu = () => {
    if (userMenuCloseTimerRef.current) {
      clearTimeout(userMenuCloseTimerRef.current);
      userMenuCloseTimerRef.current = null;
    }
    dispatch({ type: "open-user-menu" });
  };

  const closeUserMenu = () => {
    if (userMenuCloseTimerRef.current) {
      clearTimeout(userMenuCloseTimerRef.current);
    }
    userMenuCloseTimerRef.current = setTimeout(() => {
      dispatch({ type: "close-user-menu" });
      userMenuCloseTimerRef.current = null;
    }, 180);
  };

  return (
    <>
      <header className="print:hidden relative z-[130] border-b border-black/10 bg-white shadow-[0_10px_32px_-30px_rgba(17,24,39,0.55)]">
        <div className="container-main">
          <div className="flex h-[4.35rem] items-center justify-between gap-4">
            <NavbarBrandLink
              label={tNav("logoAria")}
              onClick={safeNavigate("/")}
              onKeyDown={safeKeyboardNavigate("/")}
              prominent
            />

            <nav className="hidden items-center gap-2 md:flex" aria-label={tNav("mainNavAria")}>
              {desktopNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-background-muted hover:text-[var(--color-primary)]"
                  onClick={safeNavigate(link.href)}
                  onKeyDown={safeKeyboardNavigate(link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              <Link
                href="/ulozene"
                className="hidden min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-background-muted md:inline-flex max-[920px]:!hidden"
                onClick={safeNavigate("/ulozene")}
                onKeyDown={safeKeyboardNavigate("/ulozene")}
              >
                <HeartIcon className="size-5" />
                {t("saved")}
              </Link>

              {!user ? (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="hidden min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-background-muted md:inline-flex"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M20 21a8 8 0 10-16 0" strokeLinecap="round" />
                    <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                  {t("login")}
                </button>
              ) : (
                <NavbarAuthSlot
                  isHydrated={isHydrated}
                  user={user}
                  userMenuRef={userMenuRef}
                  userMenuOpen={ui.userMenuOpen}
                  onOpenMenu={openUserMenu}
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
                  email={user?.email}
                  userInitials={userInitials}
                  isAdmin={isAdmin}
                  hasDealerAccount={hasDealerAccount}
                  safeNavigate={safeNavigate}
                  safeKeyboardNavigate={safeKeyboardNavigate}
                  openAuthModal={openAuthModal}
                  loginLabel={t("login")}
                  myAccountLabel={t("myAccount")}
                  dealerDashboardLabel={tNav("dealerDashboardLabel")}
                  adminLabel={tNav("adminLabel")}
                  logoutLabel={t("logout")}
                  myAccountAria={tNav("myAccountAria")}
                  dealerDashboardAria={tNav("dealerDashboardAria")}
                  adminAria={tNav("adminAria")}
                  userFallback={tNav("userFallback")}
                />
              )}

              <Link
                href="/pridat-inzerat"
                className="hidden min-h-10 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-black text-white shadow-sm transition-colors hover:bg-[var(--color-accent-hover)] md:inline-flex"
                onClick={safeNavigate("/pridat-inzerat")}
                onKeyDown={safeKeyboardNavigate("/pridat-inzerat")}
              >
                <PlusIcon className="size-4" />
                {t("addListing")}
              </Link>

              <button
                type="button"
                ref={mobileMenuButtonRef}
                className="flex size-10 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-background-tertiary md:hidden"
                onClick={openMobileMenu}
                aria-label={tNav("openMenu")}
                aria-expanded={ui.mobileMenuOpen}
                aria-controls="mobile-nav-dialog"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isHydrated && ui.mobileMenuOpen && (
          <MobileMenuOverlay
            navLinks={navLinks}
            accountLinks={mobileAccountLinks}
            closeMobileMenu={closeMobileMenu}
            dismissMobileMenu={closeMobileMenuAndRestoreFocus}
            safeNavigate={safeNavigate}
            safeKeyboardNavigate={safeKeyboardNavigate}
            openAuthModal={openAuthModal}
            showLogin={!user}
            aboutLabel={t("about")}
            contactLabel={t("contact")}
            loginLabel={t("login")}
            closeMenuLabel={tNav("closeMenu")}
            mobileDialogLabel={tNav("mobileDialogLabel")}
            mobileNavAria={tNav("mobileNavAria")}
            menuTitle={tNav("menuTitle")}
          />
        )}

      </header>

      {ui.authModalOpen ? <AuthModal isOpen={ui.authModalOpen} onClose={closeAuthModal} /> : null}
    </>
  );
}

type NavbarAuthContextValue = ReturnType<typeof useAuth>;

function NavbarBrandLink({
  label,
  onClick,
  onKeyDown,
  prominent = false,
}: {
  label: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  onKeyDown: (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
  prominent?: boolean;
}) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2 transition-opacity hover:opacity-80"
      aria-label={label}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span
        className={cn(
          "font-display font-semibold tracking-tight",
          prominent ? "text-2xl text-[var(--color-primary)] sm:text-[1.7rem]" : "text-xl text-text-primary",
        )}
      >
        Autobazar<span className={prominent ? "text-[var(--color-accent)]" : "text-[var(--color-accent)] text-[1.12em]"}>123</span>
      </span>
    </Link>
  );
}

function NavbarAuthSlot({
  isHydrated,
  user,
  userMenuRef,
  userMenuOpen,
  onOpenMenu,
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
  hasDealerAccount,
  safeNavigate,
  safeKeyboardNavigate,
  openAuthModal,
  loginLabel,
  myAccountLabel,
  dealerDashboardLabel,
  adminLabel,
  logoutLabel,
  myAccountAria,
  dealerDashboardAria,
  adminAria,
  userFallback,
}: {
  isHydrated: boolean;
  user: NavbarAuthContextValue["user"];
  userMenuRef: RefObject<HTMLDivElement | null>;
  userMenuOpen: boolean;
  onOpenMenu: () => void;
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
  hasDealerAccount: boolean;
  safeNavigate: (
    href: string,
    onAfterNavigate?: () => void,
  ) => MouseEventHandler<HTMLAnchorElement>;
  safeKeyboardNavigate: (
    href: string,
    onAfterNavigate?: () => void,
  ) => (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
  openAuthModal: () => void;
  loginLabel: string;
  myAccountLabel: string;
  dealerDashboardLabel: string;
  adminLabel: string;
  logoutLabel: string;
  myAccountAria: string;
  dealerDashboardAria: string;
  adminAria: string;
  userFallback: string;
}) {
  if (!isHydrated) {
    return <div className="w-[82px] h-9" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="inline-flex min-h-9 items-center justify-center rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-sm transition-[transform,background-color] duration-200 hover:bg-accent-hover active:scale-[0.95] transform-gpu will-change-transform cursor-pointer"
      >
        {loginLabel}
      </button>
    );
  }

  return (
    <AuthenticatedUserMenu
      userMenuRef={userMenuRef}
      userMenuOpen={userMenuOpen}
      onOpenMenu={onOpenMenu}
      onCloseMenu={onCloseMenu}
      onSignOut={onSignOut}
      avatarUrl={avatarUrl}
      avatarErrorUrl={avatarErrorUrl}
      onAvatarError={onAvatarError}
      displayName={displayName}
      fullName={fullName}
      email={email}
      userInitials={userInitials}
      isAdmin={isAdmin}
      hasDealerAccount={hasDealerAccount}
      safeNavigate={safeNavigate}
      safeKeyboardNavigate={safeKeyboardNavigate}
      myAccountLabel={myAccountLabel}
      dealerDashboardLabel={dealerDashboardLabel}
      adminLabel={adminLabel}
      logoutLabel={logoutLabel}
      myAccountAria={myAccountAria}
      dealerDashboardAria={dealerDashboardAria}
      adminAria={adminAria}
      userFallback={userFallback}
    />
  );
}

function AuthenticatedUserMenu({
  userMenuRef,
  userMenuOpen,
  onOpenMenu,
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
  hasDealerAccount,
  safeNavigate,
  safeKeyboardNavigate,
  myAccountLabel,
  dealerDashboardLabel,
  adminLabel,
  logoutLabel,
  myAccountAria,
  dealerDashboardAria,
  adminAria,
  userFallback,
}: {
  userMenuRef: RefObject<HTMLDivElement | null>;
  userMenuOpen: boolean;
  onOpenMenu: () => void;
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
  hasDealerAccount: boolean;
  safeNavigate: (
    href: string,
    onAfterNavigate?: () => void,
  ) => MouseEventHandler<HTMLAnchorElement>;
  safeKeyboardNavigate: (
    href: string,
    onAfterNavigate?: () => void,
  ) => (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
  myAccountLabel: string;
  dealerDashboardLabel: string;
  adminLabel: string;
  logoutLabel: string;
  myAccountAria: string;
  dealerDashboardAria: string;
  adminAria: string;
  userFallback: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative"
        ref={userMenuRef}
        onMouseEnter={onOpenMenu}
        onMouseLeave={onCloseMenu}
      >
        <Link
          href="/moj-ucet"
          className={cn(
            "relative overflow-hidden flex size-9 items-center justify-center rounded-full",
            "bg-background-tertiary border border-border-subtle",
            "text-sm font-semibold text-text-primary",
            "transition-all hover:scale-[1.03] hover:border-accent hover:ring-4 hover:ring-accent",
            userMenuOpen && "border-accent ring-4 ring-accent",
          )}
          aria-label={myAccountAria}
          onClick={safeNavigate("/moj-ucet", onCloseMenu)}
          onKeyDown={safeKeyboardNavigate("/moj-ucet", onCloseMenu)}
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
        </Link>

        <div
          className={cn(
            "absolute right-0 top-[calc(100%-2px)] z-20 mt-1 w-56",
            "overflow-hidden bg-background-secondary border border-border-subtle rounded-xl shadow-lg",
            "origin-top-right transition-all duration-200",
            userMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
          )}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-4 py-3 border-b border-border-subtle">
            <p className="text-sm font-semibold text-text-primary truncate">{fullName || userFallback}</p>
            <p className="text-xs text-text-tertiary truncate">{email}</p>
          </div>

          <div className="py-1.5">
            {isAdmin && (
              <DropdownItem
                href="/admin/today"
                ariaLabel={adminAria}
                onClick={safeNavigate("/admin/today", onCloseMenu)}
                onKeyDown={safeKeyboardNavigate("/admin/today", onCloseMenu)}
              >
                {adminLabel}
              </DropdownItem>
            )}
            {hasDealerAccount && (
              <DropdownItem
                href="/dealer"
                ariaLabel={dealerDashboardAria}
                onClick={safeNavigate("/dealer", onCloseMenu)}
                onKeyDown={safeKeyboardNavigate("/dealer", onCloseMenu)}
              >
                {dealerDashboardLabel}
              </DropdownItem>
            )}
            <DropdownItem
              href="/moj-ucet"
              onClick={safeNavigate("/moj-ucet", onCloseMenu)}
              onKeyDown={safeKeyboardNavigate("/moj-ucet", onCloseMenu)}
            >
              {myAccountLabel}
            </DropdownItem>
          </div>

          <div className="border-t border-border-subtle p-1.5">
            <button
              type="button"
              onClick={onSignOut}
              className="w-full rounded-lg px-4 py-2 text-left text-sm text-error transition-colors hover:bg-background-tertiary"
              role="menuitem"
            >
              {logoutLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMenuOverlay({
  navLinks,
  accountLinks,
  closeMobileMenu,
  dismissMobileMenu,
  safeNavigate,
  safeKeyboardNavigate,
  openAuthModal,
  showLogin,
  aboutLabel,
  contactLabel,
  loginLabel,
  closeMenuLabel,
  mobileDialogLabel,
  mobileNavAria,
  menuTitle,
}: {
  navLinks: NavLink[];
  accountLinks: NavLink[];
  closeMobileMenu: () => void;
  dismissMobileMenu: () => void;
  safeNavigate: (
    href: string,
    onAfterNavigate?: () => void,
  ) => MouseEventHandler<HTMLAnchorElement>;
  safeKeyboardNavigate: (
    href: string,
    onAfterNavigate?: () => void,
  ) => (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
  openAuthModal: () => void;
  showLogin: boolean;
  aboutLabel: string;
  contactLabel: string;
  loginLabel: string;
  closeMenuLabel: string;
  mobileDialogLabel: string;
  mobileNavAria: string;
  menuTitle: string;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismissMobileMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dismissMobileMenu]);

  return (
    <div className="fixed inset-0 z-[220] md:hidden" aria-hidden={false}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={dismissMobileMenu}
        aria-label={closeMenuLabel}
      />

      <div
        id="mobile-nav-dialog"
        className="absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-background-secondary shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={mobileDialogLabel}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <span className="text-lg font-semibold text-text-primary">{menuTitle}</span>
          <button
            type="button"
            onClick={dismissMobileMenu}
            className="flex size-9 items-center justify-center rounded-lg bg-background-tertiary text-text-primary hover:bg-background-muted transition-colors"
            aria-label={closeMenuLabel}
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4" aria-label={mobileNavAria}>
          <div className="border-b border-border-subtle px-4 pb-4">
            {showLogin ? (
              <button
                type="button"
                onClick={openAuthModal}
                className="btn-accent inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
              >
                <LockIcon className="size-4" />
                <span>{loginLabel}</span>
              </button>
            ) : null}

            <div className="mt-3">
              <LanguageSwitcher flagsOnly className="w-fit" />
            </div>
          </div>

          <div className="px-4 pt-4 space-y-1">
            {accountLinks.map((link, index) => (
              <MobileMenuItem
                key={link.href}
                href={link.href}
                onClick={safeNavigate(link.href, closeMobileMenu)}
                onKeyDown={safeKeyboardNavigate(link.href, closeMobileMenu)}
                primary={index === 0 && link.href.startsWith("/admin")}
              >
                {link.label}
              </MobileMenuItem>
            ))}
            {navLinks.map((link) => (
              <MobileMenuItem
                key={link.href}
                href={link.href}
                onClick={safeNavigate(link.href, closeMobileMenu)}
                onKeyDown={safeKeyboardNavigate(link.href, closeMobileMenu)}
              >
                {link.label}
              </MobileMenuItem>
            ))}
            <MobileMenuItem
              href="/o-nas"
              onClick={safeNavigate("/o-nas", closeMobileMenu)}
              onKeyDown={safeKeyboardNavigate("/o-nas", closeMobileMenu)}
            >
              {aboutLabel}
            </MobileMenuItem>
            <MobileMenuItem
              href="/kontakt"
              onClick={safeNavigate("/kontakt", closeMobileMenu)}
              onKeyDown={safeKeyboardNavigate("/kontakt", closeMobileMenu)}
            >
              {contactLabel}
            </MobileMenuItem>
          </div>
        </nav>
      </div>
    </div>
  );
}

function MobileMenuItem({
  href,
  onClick,
  onKeyDown,
  children,
  primary = false,
}: {
  href: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  onKeyDown?: (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "block rounded-lg p-3 text-base font-medium transition-colors",
        primary
          ? "bg-primary text-white hover:bg-[var(--color-primary-hover)]"
          : "text-text-primary hover:bg-background-tertiary",
      )}
    >
      {children}
    </Link>
  );
}

function DropdownItem({
  href,
  ariaLabel,
  onClick,
  onKeyDown,
  children,
}: {
  href: string;
  ariaLabel?: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  onKeyDown?: (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors"
      role="menuitem"
    >
      {children}
    </Link>
  );
}
