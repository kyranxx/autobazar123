"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getRecoveryErrorMessageFromHash,
  parseRecoverySessionFromHash,
  parseRecoveryTokenHashFromSearch,
} from "@/lib/auth/recovery-session";
import { createClient } from "@/lib/supabase/client";

interface ResetPasswordState {
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string | null;
  message: string | null;
}

type ResetPasswordAction =
  | { type: "setField"; field: "password" | "confirmPassword"; value: string }
  | { type: "submitStarted" }
  | { type: "submitFailed"; error: string }
  | { type: "submitSucceeded"; message: string };

const INITIAL_STATE: ResetPasswordState = {
  password: "",
  confirmPassword: "",
  loading: false,
  error: null,
  message: null,
};

const INVALID_RECOVERY_LINK_MESSAGE =
  "Tento odkaz na nastavenie heslá je neplatny alebo vyprsal. Poziadajte o nový e-mail a otvorte iba najnovsi odkaz.";

function resetPasswordReducer(
  state: ResetPasswordState,
  action: ResetPasswordAction,
): ResetPasswordState {
  switch (action.type) {
    case "setField":
      return {
        ...state,
        [action.field]: action.value,
        error: null,
      };
    case "submitStarted":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "submitFailed":
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    case "submitSucceeded":
      return {
        ...state,
        loading: false,
        error: null,
        message: action.message,
      };
    default:
      return state;
  }
}

function StatusAlert({
  variant,
  message,
}: {
  variant: "error" | "success";
  message: string;
}) {
  if (variant === "error") {
    return (
      <div className="bg-error-subtle border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        {message}
      </div>
    );
  }

  return (
    <div className="bg-success-subtle border border-success/20 text-success px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </div>
  );
}

export default function ResetPasswordPage() {
  const [state, dispatch] = useReducer(resetPasswordReducer, INITIAL_STATE);
  const [isHydratingRecoverySession, setIsHydratingRecoverySession] = useState(false);
  const [isRecoveryLinkInvalid, setIsRecoveryLinkInvalid] = useState(false);
  const recoveryTokenHashRef = useRef<string | null>(null);
  const hasLegacyRecoverySessionRef = useRef(false);
  const router = useRouter();
  const supabase = createClient();

  const hydrateRecoverySessionFromUrl = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      return true;
    }

    const recoveryTokenHash = parseRecoveryTokenHashFromSearch(window.location.search);
    if (recoveryTokenHash) {
      recoveryTokenHashRef.current = recoveryTokenHash;
      hasLegacyRecoverySessionRef.current = false;
      setIsRecoveryLinkInvalid(false);
      return true;
    }

    const recoveryError = getRecoveryErrorMessageFromHash(window.location.hash);
    if (recoveryError) {
      recoveryTokenHashRef.current = null;
      hasLegacyRecoverySessionRef.current = false;
      setIsRecoveryLinkInvalid(true);
      dispatch({ type: "submitFailed", error: recoveryError });
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
      return false;
    }

    const recoverySession = parseRecoverySessionFromHash(window.location.hash);
    if (!recoverySession) {
      if (recoveryTokenHashRef.current || hasLegacyRecoverySessionRef.current) {
        setIsRecoveryLinkInvalid(false);
        return true;
      }

      setIsRecoveryLinkInvalid(true);
      dispatch({ type: "submitFailed", error: INVALID_RECOVERY_LINK_MESSAGE });
      return false;
    }

    recoveryTokenHashRef.current = null;
    hasLegacyRecoverySessionRef.current = true;
    setIsRecoveryLinkInvalid(false);
    setIsHydratingRecoverySession(true);

    try {
      const { error } = await supabase.auth.setSession({
        access_token: recoverySession.accessToken,
        refresh_token: recoverySession.refreshToken,
      });

      if (error) {
        setIsRecoveryLinkInvalid(true);
        dispatch({ type: "submitFailed", error: error.message });
        return false;
      }

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
      return true;
    } finally {
      setIsHydratingRecoverySession(false);
    }
  }, [supabase]);

  useEffect(() => {
    void hydrateRecoverySessionFromUrl();
  }, [hydrateRecoverySessionFromUrl]);

  const completeSuccess = useCallback(() => {
    dispatch({
      type: "submitSucceeded",
      message: "Heslo bolo úspešne zmenené! Presmerúvame vas...",
    });
    setTimeout(() => {
      router.push("/");
    }, 2000);
  }, [router]);

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();

    if (state.password !== state.confirmPassword) {
      dispatch({ type: "submitFailed", error: "Heslá sa nezhodujú" });
      return;
    }

    if (state.password.length < 6) {
      dispatch({
        type: "submitFailed",
        error: "Heslo musi mat aspoň 6 znakov",
      });
      return;
    }

    dispatch({ type: "submitStarted" });

    const recoveryReady = await hydrateRecoverySessionFromUrl();
    if (!recoveryReady) {
      return;
    }

    if (recoveryTokenHashRef.current) {
      try {
        const response = await fetch("/api/account/password/recovery", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: state.password,
            tokenHash: recoveryTokenHashRef.current,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          dispatch({
            type: "submitFailed",
            error: payload?.error || INVALID_RECOVERY_LINK_MESSAGE,
          });
          return;
        }

        completeSuccess();
        return;
      } catch (error) {
        dispatch({
          type: "submitFailed",
          error:
            error instanceof Error
              ? error.message
              : INVALID_RECOVERY_LINK_MESSAGE,
        });
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: state.password,
    });

    if (error) {
      if (hasLegacyRecoverySessionRef.current && error.message.toLowerCase().includes("aal2")) {
        dispatch({
          type: "submitFailed",
          error: INVALID_RECOVERY_LINK_MESSAGE,
        });
        return;
      }

      dispatch({ type: "submitFailed", error: error.message });
      return;
    }

    completeSuccess();
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background-tertiary via-background to-background opacity-60" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-lg transition-shadow">
              AB
            </div>
            <span className="text-2xl font-display font-bold text-text-primary">
              Autobazar<span className="text-[var(--color-accent)] font-light">123</span>
            </span>
          </Link>
        </div>

        <div className="card p-8 sm:p-10 shadow-lg">
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
              Zadajte svoje nove heslo pre vas účet
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleResetPassword}>
            {state.error && <StatusAlert variant="error" message={state.error} />}
            {state.message && <StatusAlert variant="success" message={state.message} />}

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
                value={state.password}
                onChange={(event) =>
                  dispatch({
                    type: "setField",
                    field: "password",
                    value: event.target.value,
                  })
                }
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
                Potvrďte heslo
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={state.confirmPassword}
                onChange={(event) =>
                  dispatch({
                    type: "setField",
                    field: "confirmPassword",
                    value: event.target.value,
                  })
                }
                className="input"
                placeholder="Zopakujte heslo"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={
                state.loading ||
                !!state.message ||
                isHydratingRecoverySession ||
                isRecoveryLinkInvalid
              }
              className="btn btn-primary w-full py-3.5 text-base shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {state.loading || isHydratingRecoverySession ? (
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : state.message ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Hotovo
                </span>
              ) : (
                "Uložiť nove heslo"
              )}
            </button>
          </form>
        </div>

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
            Spat na prihlásenie
          </Link>
        </div>
      </div>
    </main>
  );
}
