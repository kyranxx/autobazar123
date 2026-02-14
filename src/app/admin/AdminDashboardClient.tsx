"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
// Tabs component imports removed - using custom sidebar navigation
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  AdminOverview,
  AdminModeration,
  AdminUsers,
  AdminRevenue,
  AdminSettings,
  AdminLogs,
  AdminFeatureFlags,
} from "./components";

const ADMIN_TABS = [
  { id: "overview", label: "PrehÄľad", icon: OverviewIcon },
  { id: "moderation", label: "ModerĂˇcia", icon: ModerationIcon },
  { id: "users", label: "PouĹľĂ­vatelia", icon: UsersIcon },
  { id: "revenue", label: "PrĂ­jmy", icon: RevenueIcon },
  { id: "flags", label: "Feature Flags", icon: FlagsIcon },
  { id: "logs", label: "Logy", icon: LogsIcon },
  { id: "settings", label: "Nastavenia", icon: SettingsIcon },
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

function FlagsIcon({ className }: { className?: string }) {
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
        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
      />
    </svg>
  );
}

function LogsIcon({ className }: { className?: string }) {
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
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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

function AdminHeader() {
  const { user, profile } = useAuth();

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg">
              <svg
                className="w-6 h-6"
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
              <h1 className="text-2xl font-bold text-text-primary">
                Admin Panel
              </h1>
              <p className="text-text-secondary">
                SprĂˇva platformy Autobazar123
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-primary">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-xs text-text-muted">AdministrĂˇtor</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold shadow-md">
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
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
              {tab.id === "moderation" && (
                <Badge variant="warning" size="sm" className="ml-auto">
                  5
                </Badge>
              )}
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
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
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
  const router = useRouter();
  const [isMfaVerifiedLocal, setIsMfaVerifiedLocal] = useState<boolean | null>(
    null,
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkMFA = async () => {
      const { data, error: mfaError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaError) {
        console.error("MFA check error:", mfaError);
        setIsMfaVerifiedLocal(true);
        onVerified?.();
        return;
      }

      if (data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
        setIsMfaVerifiedLocal(false);
      } else {
        setIsMfaVerifiedLocal(true);
        onVerified?.();
      }
    };
    checkMFA();
  }, [supabase, onVerified]);

  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChecking) return;

    setIsChecking(true);
    setError(null);

    try {
      const { data: factors, error: listError } =
        await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const verifiedFactor = factors?.all?.find((f) => f.status === "verified");

      if (!verifiedFactor) {
        setIsMfaVerifiedLocal(true);
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

      setIsMfaVerifiedLocal(true);
      onVerified?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "NesprĂˇvny kĂłd alebo chyba overenia";
      setError(message);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMfaVerifiedLocal === false) {
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMfaVerifiedLocal, router]);

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

  if (isMfaVerifiedLocal === null) return null;

  if (isMfaVerifiedLocal === false) {
    return (
      <div className="fixed inset-0 z-[60] bg-background-dark/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-background-secondary border border-border-subtle rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center relative">
          <button
            onClick={() => router.push("/")}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-hover transition-colors group"
            title="ZruĹˇiĹĄ a spĂ¤ĹĄ na domov"
          >
            <svg
              className="w-5 h-5 text-text-muted group-hover:text-text-primary"
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

          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg">
            <svg
              className="w-8 h-8"
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
            <h2 className="text-xl font-bold text-text-primary">
              DvojstupĹovĂ© overenie
            </h2>
            <p className="text-sm text-text-secondary">
              Zadajte kĂłd z vaĹˇej aplikĂˇcie Google Authenticator.
            </p>
          </div>
          <form onSubmit={handleChallenge} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-4 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
              autoFocus
            />
            {error && <p className="text-sm text-error font-medium">{error}</p>}
            <Button
              type="submit"
              variant="accent"
              className="w-full"
              disabled={code.length !== 6 || isChecking}
              loading={isChecking}
            >
              OdomknĂşĹĄ
            </Button>
          </form>
          <p className="text-xs text-text-muted">StlaÄŤte ESC pre zruĹˇenie</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminDashboardClient() {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [, setIsMfaVerified] = useState(false);

  if (loading) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 animate-pulse" />
          <Skeleton className="h-4 w-32" />
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-error/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-error"
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            PrĂ­stup zamietnutĂ˝
          </h1>
          <p className="text-text-secondary mb-6">
            TĂˇto strĂˇnka je dostupnĂˇ len pre administrĂˇtorov.
          </p>
          <Link href="/">
            <Button variant="accent">SpĂ¤ĹĄ na hlavnĂş strĂˇnku</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <MFAGuard onVerified={() => setIsMfaVerified(true)}>
      <main className="pt-20 pb-16 min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdminHeader />

          <div className="flex gap-8">
            <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="flex-1 min-w-0">
              <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="animate-fade-in">
                {activeTab === "overview" && <AdminOverview />}
                {activeTab === "moderation" && <AdminModeration />}
                {activeTab === "users" && <AdminUsers />}
                {activeTab === "revenue" && <AdminRevenue />}
                {activeTab === "flags" && <AdminFeatureFlags />}
                {activeTab === "logs" && <AdminLogs />}
                {activeTab === "settings" && <AdminSettings />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </MFAGuard>
  );
}

