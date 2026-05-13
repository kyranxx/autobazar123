"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getRecoveryErrorReasonFromHash,
  parseRecoverySessionFromHash,
  parseRecoveryTokenHashFromSearch,
} from "@/lib/auth/recovery-session";
import { createCsrfHeaders } from "@/lib/security/client-csrf";
import { createClient } from "@/lib/supabase/client";
import {
  createResetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "@/lib/validation/forms";

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
        <svg className="size-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
      <svg className="size-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

function ResetPasswordSubmitButton({
  disabled,
  isLoading,
  isSuccess,
  doneLabel,
  submitLabel,
}: {
  disabled: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  doneLabel: string;
  submitLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="btn btn-primary w-full py-3.5 text-base shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <svg
          className="animate-spin size-5 mx-auto text-white"
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
      ) : isSuccess ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {doneLabel}
        </span>
      ) : (
        submitLabel
      )}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isHydratingRecoverySession, setIsHydratingRecoverySession] = useState(false);
  const [isRecoveryLinkInvalid, setIsRecoveryLinkInvalid] = useState(false);
  const recoveryTokenHashRef = useRef<string | null>(null);
  const hasLegacyRecoverySessionRef = useRef(false);
  const { push } = useRouter();
  const supabase = createClient();
  const t = useTranslations("resetPassword");
  const invalidRecoveryLinkMessage = t("invalidLinkExpired");
  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(
      createResetPasswordFormSchema({
        passwordMinLength: t("passwordMinLength"),
        passwordMismatch: t("passwordMismatch"),
      }),
    ),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

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

    const recoveryErrorReason = getRecoveryErrorReasonFromHash(window.location.hash);
    if (recoveryErrorReason) {
      recoveryTokenHashRef.current = null;
      hasLegacyRecoverySessionRef.current = false;
      setIsRecoveryLinkInvalid(true);
      setErrorMessage(
        recoveryErrorReason === "expired"
          ? t("invalidLinkExpired")
          : t("invalidLink"),
      );
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
      setErrorMessage(invalidRecoveryLinkMessage);
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
        setErrorMessage(error.message);
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
  }, [invalidRecoveryLinkMessage, supabase, t]);

  useEffect(() => {
    void hydrateRecoverySessionFromUrl();
  }, [hydrateRecoverySessionFromUrl]);

  const completeSuccess = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(t("successRedirect"));
    setTimeout(() => {
      push("/");
    }, 2000);
  }, [push, t]);

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    const recoveryReady = await hydrateRecoverySessionFromUrl();
    if (!recoveryReady) {
      return;
    }

    if (recoveryTokenHashRef.current) {
      try {
        const response = await fetch("/api/account/password/recovery", {
          method: "POST",
          headers: createCsrfHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            password: values.password,
            tokenHash: recoveryTokenHashRef.current,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          setErrorMessage(payload?.error || invalidRecoveryLinkMessage);
          return;
        }

        completeSuccess();
        return;
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : invalidRecoveryLinkMessage,
        );
        return;
      }
    }

    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: createCsrfHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        password: values.password,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setErrorMessage(payload?.error || invalidRecoveryLinkMessage);
      return;
    }

    completeSuccess();
  });

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background-tertiary via-background to-background opacity-60" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-lg transition-shadow">
              AB
            </div>
            <span className="text-2xl font-display font-bold text-text-primary">
              Autobazar<span className="text-[var(--color-accent)] font-light">123</span>
            </span>
          </Link>
        </div>

        <div className="card p-8 sm:p-10 shadow-lg">
          <div className="text-center mb-8">
            <div className="size-14 mx-auto mb-4 rounded-2xl bg-digital-subtle flex items-center justify-center">
              <svg
                className="size-7 text-digital"
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
            <h1 className="text-2xl font-display font-semibold text-text-primary">
              {t("title")}
            </h1>
            <p className="mt-2 text-text-tertiary text-sm">
              {t("subtitle")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            {errorMessage && <StatusAlert variant="error" message={errorMessage} />}
            {successMessage && <StatusAlert variant="success" message={successMessage} />}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                {t("passwordLabel")}
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder={t("passwordPlaceholder")}
                {...register("password")}
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-error">{errors.password.message}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                {t("confirmPasswordLabel")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                placeholder={t("confirmPasswordPlaceholder")}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="mt-1 text-xs text-error">{errors.confirmPassword.message}</p>
              ) : null}
            </div>

            <ResetPasswordSubmitButton
              disabled={
                isSubmitting
                || !!successMessage
                || isHydratingRecoverySession
                || isRecoveryLinkInvalid
              }
              isLoading={isSubmitting || isHydratingRecoverySession}
              isSuccess={!!successMessage}
              doneLabel={t("done")}
              submitLabel={t("submit")}
            />
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors inline-flex items-center gap-1"
          >
            <svg
              className="size-4"
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
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </main>
  );
}
