"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
// Tabs component imports removed - using custom sidebar navigation
import { Button } from "@/components/ui/shadcn/button";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  AdminToday,
  AdminAds,
  AdminUsers,
  AdminRevenue,
  AdminSettings,
  AdminEmails,
  AdminAnalytics,
  AdminTechnical,
} from "./components";

const ADMIN_TABS = [
  { id: "today", href: "/admin/today", icon: OverviewIcon },
  { id: "users", href: "/admin/users", icon: UsersIcon },
  { id: "ads", href: "/admin/ads", icon: ModerationIcon },
  { id: "money", href: "/admin/money", icon: RevenueIcon },
  { id: "traffic", href: "/admin/traffic", icon: AnalyticsIcon },
  { id: "emails", href: "/admin/emails", icon: EmailsIcon },
  { id: "technical", href: "/admin/technical", icon: QualityIcon },
  { id: "settings", href: "/admin/settings", icon: SettingsIcon },
];

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  );
}

function ModerationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function RevenueIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 19.5h16M7.5 16V10.5M12 16V6.5M16.5 16V12"
      />
    </svg>
  );
}

function EmailsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 6.75A2.25 2.25 0 016.25 4.5h11.5A2.25 2.25 0 0120 6.75v10.5a2.25 2.25 0 01-2.25 2.25H6.25A2.25 2.25 0 014 17.25V6.75z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.5 7.5l7.5 5.25L19.5 7.5"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function QualityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m3.5-2.5a2.5 2.5 0 00-2.5-2.5h-9A2.5 2.5 0 005 7.5v9A2.5 2.5 0 007.5 19h9a2.5 2.5 0 002.5-2.5v-9z"
      />
    </svg>
  );
}

function AdminHeader() {
  const { user, profile } = useAuth();
  const t = useTranslations("admin");

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-primary p-2.5 text-white shadow-sm">
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                {t("headerTitle")}
              </h1>
              <p className="text-text-secondary">
                {t("headerSubtitle")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher
            flagsOnly
            supportedLocales={["sk", "en"] as const}
            className="shrink-0"
          />
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-primary">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-xs text-text-muted">{t("adminRole")}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white font-bold shadow-sm">
            {(profile?.full_name || user?.email)?.charAt(0).toUpperCase() ||
              "A"}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const t = useTranslations("admin");

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <nav className="sticky top-24 space-y-1">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                isActive
                  ? "border border-primary bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <Icon className="size-5" />
              <span className="font-medium">{t(`tabs.${tab.id}`)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const t = useTranslations("admin");

  return (
    <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto">
      <div className="flex gap-2 pb-2">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "border border-primary bg-primary text-white shadow-sm"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="size-4" />
              {t(`tabs.${tab.id}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MFAGuard({
  children,
  onVerified,
}: {
  children: React.ReactNode;
  onVerified?: () => void;
}) {
  const [mfaState, setMfaState] = useState<{
    isVerified: boolean | null;
    shouldExit: boolean;
  }>({
    isVerified: null,
    shouldExit: false,
  });
  const t = useTranslations("admin");
  const [code, setCode] = useState("");
  const [challengeState, setChallengeState] = useState<{
    error: string | null;
    isChecking: boolean;
  }>({
    error: null,
    isChecking: false,
  });
  const supabase = createClient();
  const { replace } = useRouter();
  const { error, isChecking } = challengeState;

  useEffect(() => {
    let isMounted = true;

    const checkMFA = async () => {
      const { data, error: mfaError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      let isVerified = true;

      if (mfaError) {
        console.error("MFA check error:", mfaError);
      } else if (data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
        isVerified = false;
      }

      if (!isMounted) return;
      setMfaState((current) => ({ ...current, isVerified }));
      if (isVerified) onVerified?.();
    };
    checkMFA();

    return () => {
      isMounted = false;
    };
  }, [supabase, onVerified]);

  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChecking) return;

    setChallengeState({
      error: null,
      isChecking: true,
    });

    try {
      const { data: factors, error: listError } =
        await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const verifiedFactor = factors?.all?.find((f) => f.status === "verified");

      if (!verifiedFactor) {
        setMfaState((current) => ({ ...current, isVerified: true }));
        onVerified?.();
        return;
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: verifiedFactor.id,
        });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      setMfaState((current) => ({ ...current, isVerified: true }));
      onVerified?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("mfa.error");
      setChallengeState({
        error: message,
        isChecking: true,
      });
    } finally {
      setChallengeState((prev) => ({
        ...prev,
        isChecking: false,
      }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mfaState.isVerified === false) {
        setMfaState((current) => ({ ...current, shouldExit: true }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mfaState.isVerified]);

  const challengeRef = useRef(handleChallenge);
  challengeRef.current = handleChallenge;

  const lastAttemptedCode = useRef("");
  useEffect(() => {
    if (
      code.length === 6 &&
      !isChecking &&
      code !== lastAttemptedCode.current
    ) {
      lastAttemptedCode.current = code;
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      challengeRef.current(fakeEvent);
    } else if (code.length !== 6) {
      lastAttemptedCode.current = "";
    }
  }, [code, isChecking]);

  useEffect(() => {
    if (mfaState.shouldExit) {
      replace("/", { scroll: false });
    }
  }, [mfaState.shouldExit, replace]);

  if (mfaState.shouldExit) {
    return null;
  }

  return mfaState.isVerified === null ? null : mfaState.isVerified === false ? (
      <div className="fixed inset-0 z-[60] bg-background-dark/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-background-secondary border border-border-subtle rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center relative">
          <button
            onClick={() => setMfaState((current) => ({ ...current, shouldExit: true }))}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-hover transition-colors group"
            title={t("mfa.cancelTitle")}
          >
            <svg
              className="size-5 text-text-muted group-hover:text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary mx-auto text-white shadow-sm">
            <svg
              className="size-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-text-primary">
              {t("mfa.title")}
            </h2>
            <p className="text-sm text-text-secondary">
              {t("mfa.description")}
            </p>
          </div>
          <form onSubmit={handleChallenge} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t("mfa.inputPlaceholder")}
              className="w-full text-center tracking-[0.5em] text-2xl font-mono p-4 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
            />
            {error && <p className="text-sm text-error font-medium">{error}</p>}
            <Button
              type="submit"
              variant="accent"
              className="w-full"
              disabled={code.length !== 6 || isChecking}
              loading={isChecking}
            >
              {t("mfa.submit")}
            </Button>
          </form>
          <p className="text-xs text-text-muted">{t("mfa.escapeHint")}</p>
        </div>
      </div>
    ) : (
      <>{children}</>
    );
}

export default function AdminDashboardClient({
  initialTab = null,
  initialFounderRange = null,
}: {
  initialTab?: string | null;
  initialFounderRange?: number | null;
}) {
  const { user, loading, isAdmin } = useAuth();
  const { replace } = useRouter();
  const t = useTranslations("admin");
  const requestedTab = initialTab;
  const activeTab =
    requestedTab && ADMIN_TABS.some((tab) => tab.id === requestedTab)
      ? requestedTab
      : "today";
  const [, setIsMfaVerified] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) {
      return;
    }

    const targetTab = ADMIN_TABS.find((entry) => entry.id === tab);
    if (!targetTab) {
      return;
    }

    replace(targetTab.href, { scroll: false });
  };

  if (loading) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-primary animate-pulse" />
          <span className="sr-only">{t("loadingAdmin")}</span>
          <Skeleton className="h-4 w-32" />
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="size-20 mx-auto mb-6 rounded-2xl bg-error/10 flex items-center justify-center">
            <svg
              className="size-10 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {t("accessDeniedTitle")}
          </h1>
          <p className="text-text-secondary mb-6">
            {t("accessDeniedDescription")}
          </p>
          <Link href="/">
            <Button variant="accent">{t("backHome")}</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <MFAGuard onVerified={() => setIsMfaVerified(true)}>
      <main className="pt-14 pb-16 min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdminHeader />

          <div className="flex gap-8">
            <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="flex-1 min-w-0">
              <MobileTabBar activeTab={activeTab} onTabChange={handleTabChange} />

              <div className="animate-fade-in">
                {activeTab === "today" && (
                  <AdminToday
                    initialFounderRange={initialFounderRange}
                  />
                )}
                {activeTab === "ads" && <AdminAds />}
                {activeTab === "users" && <AdminUsers />}
                {activeTab === "money" && <AdminRevenue />}
                {activeTab === "traffic" && <AdminAnalytics />}
                {activeTab === "emails" && <AdminEmails />}
                {activeTab === "technical" && <AdminTechnical />}
                {activeTab === "settings" && <AdminSettings />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </MFAGuard>
  );
}
