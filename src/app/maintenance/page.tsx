"use client";

import { Suspense, useState } from "react";

function formatUnlockError(rawMessage: string): string {
  if (rawMessage === "Server misconfigured.") {
    return "Pristup je docasne nedostupny. Skuste to znova o par minut.";
  }

  if (rawMessage === "Invalid password.") {
    return "Nespravne heslo. Skuste to znova.";
  }

  if (rawMessage === "Password required.") {
    return "Zadajte heslo pre odomknutie.";
  }

  if (rawMessage === "Too many attempts. Please try again later.") {
    return "Prilis vela pokusov. Pockajte chvilu a skuste to znovu.";
  }

  return rawMessage;
}

function MaintenanceContent() {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-background-muted via-background-tertiary to-background px-4 py-6 sm:py-10">
      <div className="pointer-events-none absolute -left-20 top-20 h-52 w-52 rounded-full bg-digital/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_16px_48px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:max-w-2xl sm:p-8">
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover shadow-xl">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <span className="text-2xl font-bold text-primary sm:text-3xl">
            Autobazar<span className="text-accent">123</span>
          </span>
        </div>

        <div className="space-y-4 text-center sm:text-left">
          <div className="mx-auto inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent sm:mx-0">
            Rezim udrzby
          </div>

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
            Pracujeme na vylepseniach.
          </h1>
          <p className="text-sm leading-relaxed text-primary/70 sm:text-lg">
            Stranka je momentalne v rezime udrzby. Vratime sa co najskor s este
            lepsim zazitkom.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-background-muted/80 p-4 text-left sm:p-5">
          <h2 className="text-base font-semibold text-primary sm:text-lg">
            Operator pristup
          </h2>
          <p className="mt-1 text-xs text-primary/70 sm:text-sm">
            Ak mate pristupove heslo, odomknite stranku tu.
          </p>

          <form
            onSubmit={handleUnlock}
            className="mt-4 flex w-full flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                id="maintenance-unlock-password"
                name="maintenance-unlock-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Pristupove heslo"
                className={`h-11 w-full rounded-xl border border-border-strong bg-background-secondary px-4 pr-12 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:ring-2 focus:ring-accent ${errorMsg ? "border-error ring-error/30" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary/60 hover:text-primary"
              >
                {showPassword ? "Skryt" : "Zobrazit"}
              </button>
            </div>

            <button
              type="submit"
              disabled={isChecking || !password.trim()}
              className="h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[130px]"
            >
              {isChecking ? "Overujem..." : "Odomknut"}
            </button>
          </form>

          {errorMsg && (
            <p
              className="mt-2 text-xs font-medium text-error sm:text-sm"
              role="alert"
              aria-live="polite"
            >
              {errorMsg}
            </p>
          )}
        </section>

        <div className="pt-2 text-center text-xs text-primary/50 sm:text-sm">
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
