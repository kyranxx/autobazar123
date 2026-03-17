
import React from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthView, AuthField, PasswordStrength, AuthState, AuthModalController } from "./types";

import { pushClass, InputIcon, Spinner, GoogleIcon } from "./shared";

/* ─── Login form ─── */

function LoginForm({
  email,
  password,
  loading,
  showPassword,
  loginEmailRef,
  onSubmit,
  onForgotPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  t,
}: {
  email: string;
  password: string;
  loading: boolean;
  showPassword: boolean;
  loginEmailRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (event: React.FormEvent) => void;
  onForgotPassword: () => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Email */}
      <div className="relative">
        <InputIcon><Mail className="w-4 h-4" /></InputIcon>
        <input
          ref={loginEmailRef}
          type="email"
          id="auth-login-email"
          name="auth-login-email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={t("login.emailPlaceholder")}
          className="input w-full h-12 !pl-12"
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div className="relative">
        <InputIcon><Lock className="w-4 h-4" /></InputIcon>
        <input
          type={showPassword ? "text" : "password"}
          id="auth-login-password"
          name="auth-login-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder={t("login.passwordPlaceholder")}
          className="input w-full h-12 !pl-12 !pr-12"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary cursor-pointer"
          aria-label={t("aria.togglePassword")}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Forgot password */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-accent hover:text-[var(--color-accent-hover)] hover:underline cursor-pointer transition-colors"
        >
          {t("login.forgotPassword")}
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-accent w-full h-12 rounded-xl font-semibold disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Spinner /> : t("login.submit")}
      </button>
    </form>
  );
}


export default LoginForm;
