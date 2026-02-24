"use client";

import { Suspense, useState } from "react";

function MaintenanceContent() {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
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
          msg = data.error;
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
    <div className="min-h-dvh bg-background px-4 py-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border bg-surface p-5 shadow-md sm:max-w-2xl sm:p-8">
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover shadow-xl">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <span className="text-2xl font-bold text-primary sm:text-3xl">
            Autobazar<span className="text-accent">123</span>
          </span>
        </div>

        <div className="space-y-4 text-center sm:text-left">
          <div className="mx-auto inline-flex rounded-full bg-accent/10 p-4 text-accent sm:mx-0">
            <svg
              className="h-10 w-10 sm:h-12 sm:w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Pracujeme na vylepseniach
          </h1>
          <p className="text-sm text-secondary sm:text-lg">
            Stranka je momentalne v rezime udrzby. Vratime sa coskoro s este
            lepsim zazitkom.
          </p>
        </div>

        <section className="rounded-xl border border-border bg-background-muted p-4 text-left">
          <h2 className="text-sm font-semibold text-primary">Operator pristup</h2>
          <p className="mt-1 text-xs text-secondary sm:text-sm">
            Ak mate pristupove heslo, odomknite stranku tu.
          </p>

          <form
            onSubmit={handleUnlock}
            className="mt-3 flex w-full flex-col gap-2 sm:flex-row"
          >
            <input
              type="password"
              id="maintenance-unlock-password"
              name="maintenance-unlock-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Pristupove heslo"
              className={`h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${errorMsg ? "border-red-500 ring-red-500" : ""}`}
            />
            <button
              type="submit"
              disabled={isChecking}
              className="h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[124px]"
            >
              {isChecking ? "Overujem..." : "Odomknut"}
            </button>
          </form>

          {errorMsg && (
            <p className="mt-2 text-xs font-medium text-red-500 sm:text-sm">
              {errorMsg}
            </p>
          )}
        </section>

        <div className="pt-2 text-center text-xs text-tertiary sm:text-sm">
          &copy; {new Date().getFullYear()} Autobazar123. Vsetky prava vyhradene.
        </div>
      </main>
    </div>
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
