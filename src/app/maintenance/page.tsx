"use client";

import { Suspense, useState } from "react";

function formatUnlockError(rawMessage: string): string {
  if (rawMessage === "Server misconfigured.") {
    return "Prístup je dočasne nedostupný. Skúste to znova o pár minút.";
  }

  if (rawMessage === "Invalid password.") {
    return "Nesprávne heslo. Skúste to znova.";
  }

  if (rawMessage === "Password required.") {
    return "Zadajte heslo pre odomknutie.";
  }

  if (rawMessage === "Too many attempts. Please try again later.") {
    return "Príliš veľa pokusov. Počkajte chvíľu a skúste to znovu.";
  }

  return rawMessage;
}

function MaintenanceContent() {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Zadajte heslo pre odomknutie.");
      return;
    }

    setIsChecking(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/maintenance/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Full reload so the browser sends the newly-set maintenance cookie through proxy.
        window.location.href = "/";
        return;
      }

      let msg = `Error ${response.status}`;
      try {
        const data = await response.json();
        if (data?.error) {
          msg = formatUnlockError(data.error);
        }
      } catch {
        // Keep default message when body is not JSON.
      }
      setErrorMsg(msg);
    } catch (err) {
      setErrorMsg(`Network error: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-background-secondary p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 text-2xl font-bold text-primary">
            Autobazar<span className="text-[var(--color-accent)]">123</span>
          </div>
          <h1 className="mt-5 text-3xl font-black text-primary">Režim údržby</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Stránka je dočasne v údržbe.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="mt-6 space-y-3">
          <input
            type="password"
            id="maintenance-unlock-password"
            name="maintenance-unlock-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Prístupové heslo"
            className={`h-11 w-full rounded-xl border border-border-strong bg-background px-4 text-sm text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent ${errorMsg ? "border-error ring-error/30" : ""}`}
          />
          <button
            type="submit"
            disabled={isChecking || !password.trim()}
            className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChecking ? "Overujem..." : "Odomknúť"}
          </button>
        </form>

        {errorMsg && (
          <p className="mt-3 text-center text-xs font-medium text-error" role="alert" aria-live="polite">
            {errorMsg}
          </p>
        )}
      </div>
    </main>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      }
    >
      <MaintenanceContent />
    </Suspense>
  );
}
