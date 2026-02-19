"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isAal2RequiredErrorMessage = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes("aal2") && lower.includes("mfa");
  };

  const updatePasswordViaRecoveryApi = async (nextPassword: string) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    if (sessionError || !accessToken) {
      return {
        ok: false as const,
        error: "Chyba relacie. Otvorte znova odkaz z emailu a skuste to znovu.",
      };
    }

    const response = await fetch("/api/account/password/recovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ password: nextPassword }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    if (!response.ok) {
      return {
        ok: false as const,
        error: payload?.error || "Nepodarilo sa zmenit heslo",
      };
    }

    return { ok: true as const };
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Hesla sa nezhoduju");
      return;
    }

    if (password.length < 6) {
      setError("Heslo musi mat aspon 6 znakov");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      if (isAal2RequiredErrorMessage(updateError.message)) {
        try {
          const result = await updatePasswordViaRecoveryApi(password);
          if (!result.ok) {
            setError(result.error);
            setLoading(false);
            return;
          }

          setLoading(false);
          setMessage("Heslo bolo uspesne zmenene! Presmeruvame vas...");
          setTimeout(() => {
            router.push("/");
          }, 2000);
          return;
        } catch {
          setError("Nepodarilo sa zmenit heslo");
          setLoading(false);
          return;
        }
      }

      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setMessage("Heslo bolo uspesne zmenene! Presmeruvame vas...");
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background-tertiary via-background to-background opacity-60" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-lg transition-shadow">
              AB
            </div>
            <span className="text-2xl font-display font-bold text-text-primary">
              Autobazar<span className="text-accent font-light">123</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="card p-8 sm:p-10 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-digital-subtle flex items-center justify-center">
              <svg
                className="w-7 h-7 text-digital"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-text-primary">
              Nove heslo
            </h1>
            <p className="mt-2 text-text-tertiary text-sm">
              Zadajte svoje nove heslo pre vas ucet
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleResetPassword}>
            {error && (
              <div className="bg-error-subtle border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {message && (
              <div className="bg-success-subtle border border-success/20 text-success px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {message}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Nove heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Minimalne 6 znakov"
                minLength={6}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Potvrdte heslo
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Zopakujte heslo"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!message}
              className="btn btn-primary w-full py-3.5 text-base shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 mx-auto text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : message ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Hotovo
                </span>
              ) : (
                "Ulozit nove heslo"
              )}
            </button>
          </form>
        </div>

        {/* Back to login */}
        <div className="text-center mt-6">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors inline-flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Spat na prihlasenie
          </Link>
        </div>
      </div>
    </main>
  );
}
