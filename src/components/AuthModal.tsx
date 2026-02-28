"use client";

import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  oauthProviderUrlMatchesExpectedCallback,
  resolveOAuthCallbackUrl,
} from "@/lib/auth/oauth-redirect";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, X } from "lucide-react";

type AuthView = "login" | "register" | "reset" | "verify";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

type PasswordStrength = "weak" | "medium" | "strong" | null;

interface AuthState {
  view: AuthView;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  loading: boolean;
  resendLoading: boolean;
  resendCooldown: number;
  showPassword: boolean;
  agreedToTerms: boolean;
}

type AuthField = "email" | "password" | "confirmPassword" | "fullName";

type AuthAction =
  | { type: "setField"; field: AuthField; value: string }
  | { type: "setView"; view: AuthView }
  | { type: "resetAll"; view: AuthView }
  | { type: "setLoading"; value: boolean }
  | { type: "setResendLoading"; value: boolean }
  | { type: "setResendCooldown"; value: number }
  | { type: "tickResendCooldown" }
  | { type: "toggleShowPassword" }
  | { type: "setAgreedToTerms"; value: boolean };

interface AuthModalController {
  state: AuthState;
  passwordStrength: PasswordStrength;
  hasMinLength: boolean;
  hasLetterAndNumber: boolean;
  passwordsMatch: boolean;
  canSubmitRegister: boolean;
  loginEmailRef: React.RefObject<HTMLInputElement | null>;
  registerNameRef: React.RefObject<HTMLInputElement | null>;
  resetEmailRef: React.RefObject<HTMLInputElement | null>;
  closeModal: () => void;
  changeView: (nextView: AuthView) => void;
  handleLogin: (event: React.FormEvent) => Promise<void>;
  handleRegister: (event: React.FormEvent) => Promise<void>;
  handleResetPassword: (event: React.FormEvent) => Promise<void>;
  handleResendConfirmation: () => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  setField: (field: AuthField, value: string) => void;
  toggleShowPassword: () => void;
  setAgreedToTerms: (checked: boolean) => void;
}

function createInitialState(initialView: AuthView): AuthState {
  return {
    view: initialView,
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    loading: false,
    resendLoading: false,
    resendCooldown: 0,
    showPassword: false,
    agreedToTerms: false,
  };
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setView":
      return {
        ...state,
        view: action.view,
        password: "",
        confirmPassword: "",
        showPassword: false,
      };
    case "resetAll":
      return createInitialState(action.view);
    case "setLoading":
      return { ...state, loading: action.value };
    case "setResendLoading":
      return { ...state, resendLoading: action.value };
    case "setResendCooldown":
      return { ...state, resendCooldown: action.value };
    case "tickResendCooldown":
      return {
        ...state,
        resendCooldown: state.resendCooldown > 0 ? state.resendCooldown - 1 : 0,
      };
    case "toggleShowPassword":
      return { ...state, showPassword: !state.showPassword };
    case "setAgreedToTerms":
      return { ...state, agreedToTerms: action.value };
    default:
      return state;
  }
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return null;

  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 10 && hasLetters && hasNumbers && hasSymbols) {
    return "strong";
  }

  if (password.length >= 7 && hasLetters && hasNumbers) {
    return "medium";
  }

  return "weak";
}

function getPasswordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "strong":
      return "Silná";
    case "medium":
      return "Stredná";
    case "weak":
      return "Slabá";
    default:
      return "";
  }
}

function getPasswordStrengthWidth(strength: PasswordStrength): string {
  switch (strength) {
    case "strong":
      return "100%";
    case "medium":
      return "66%";
    case "weak":
      return "33%";
    default:
      return "0%";
  }
}

function getPasswordStrengthBarClass(strength: PasswordStrength): string {
  switch (strength) {
    case "strong":
      return "bg-success";
    case "medium":
      return "bg-warning";
    case "weak":
      return "bg-error";
    default:
      return "bg-transparent";
  }
}

function useAuthModalController({
  isOpen,
  onClose,
  initialView,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialView: AuthView;
}): AuthModalController {
  const [state, dispatch] = useReducer(authReducer, initialView, createInitialState);
  const router = useRouter();
  const supabase = createClient();
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const registerNameRef = useRef<HTMLInputElement>(null);
  const resetEmailRef = useRef<HTMLInputElement>(null);

  const closeModal = useCallback(() => {
    dispatch({ type: "resetAll", view: initialView });
    onClose();
  }, [initialView, onClose]);

  const changeView = (nextView: AuthView) => {
    dispatch({ type: "setView", view: nextView });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeModal]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (state.view === "login") {
      loginEmailRef.current?.focus();
      return;
    }

    if (state.view === "register") {
      registerNameRef.current?.focus();
      return;
    }

    if (state.view === "reset") {
      resetEmailRef.current?.focus();
    }
  }, [isOpen, state.view]);

  useEffect(() => {
    if (state.resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      dispatch({ type: "tickResendCooldown" });
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [state.resendCooldown]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state.loading) return;

    if (!state.email || !state.password) {
      toast.error("Vyplňte e-mail a heslo");
      return;
    }

    dispatch({ type: "setLoading", value: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("Nesprávny e-mail alebo heslo");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Potvrďte svoju e-mailovú adresu");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Prihlásenie úspešné");
      closeModal();
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Prihlásenie sa nepodarilo");
      }
    } finally {
      dispatch({ type: "setLoading", value: false });
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!state.email || !state.password || !state.fullName) {
      toast.error("Vyplňte všetky povinné polia");
      return;
    }

    if (state.password.length < 6) {
      toast.error("Heslo musí mať aspoň 6 znakov");
      return;
    }

    if (state.password !== state.confirmPassword) {
      toast.error("Heslá sa nezhodujú");
      return;
    }

    if (!state.agreedToTerms) {
      toast.error("Musíte súhlasiť s podmienkami");
      return;
    }

    dispatch({ type: "setLoading", value: true });
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
          fullName: state.fullName,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; alreadyRegistered?: boolean; error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Registrácia sa nepodarila");
        return;
      }

      if (payload?.alreadyRegistered) {
        toast.error("E-mail je už registrovaný. Prihláste sa alebo obnovte heslo.");
        changeView("login");
        return;
      }

      toast.success("Registrácia úspešná. Skontrolujte e-mail.");
      changeView("verify");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Registrácia sa nepodarila");
      }
    } finally {
      dispatch({ type: "setLoading", value: false });
    }
  };

  const handleResendConfirmation = async () => {
    if (!state.email) {
      toast.error("Chýba e-mail na odoslanie potvrdenia.");
      return;
    }

    if (state.resendCooldown > 0 || state.resendLoading) {
      return;
    }

    dispatch({ type: "setResendLoading", value: true });
    try {
      const response = await fetch("/api/auth/register/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Potvrdzovací e-mail sa nepodarilo odoslať.");
        return;
      }

      toast.success("Potvrdzovací e-mail bol odoslaný znova.");
      dispatch({ type: "setResendCooldown", value: 60 });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Potvrdzovací e-mail sa nepodarilo odoslať.");
      }
    } finally {
      dispatch({ type: "setResendLoading", value: false });
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!state.email) {
      toast.error("Zadajte e-mailovú adresu");
      return;
    }

    dispatch({ type: "setLoading", value: true });
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Odoslanie e-mailu sa nepodarilo");
        return;
      }

      toast.success("E-mail na obnovenie hesla bol odoslaný");
      changeView("login");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Odoslanie e-mailu sa nepodarilo");
      }
    } finally {
      dispatch({ type: "setLoading", value: false });
    }
  };

  const handleGoogleLogin = async () => {
    const redirectTo = resolveOAuthCallbackUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data?.url) {
      toast.error("Google OAuth URL was not generated.");
      return;
    }

    if (!oauthProviderUrlMatchesExpectedCallback(data.url, redirectTo)) {
      toast.error(
        `Google OAuth redirect mismatch. Allow ${redirectTo} in Supabase Auth redirect URLs.`,
      );
      return;
    }

    window.location.assign(data.url);
  };

  const passwordStrength = getPasswordStrength(state.password);
  const hasMinLength = state.password.length >= 6;
  const hasLetterAndNumber = /[A-Za-z]/.test(state.password) && /\d/.test(state.password);
  const passwordsMatch =
    state.confirmPassword.length > 0 && state.password === state.confirmPassword;
  const canSubmitRegister =
    !!state.email &&
    !!state.fullName &&
    !!state.password &&
    !!state.confirmPassword &&
    hasMinLength &&
    passwordsMatch &&
    state.agreedToTerms;

  return {
    state,
    passwordStrength,
    hasMinLength,
    hasLetterAndNumber,
    passwordsMatch,
    canSubmitRegister,
    loginEmailRef,
    registerNameRef,
    resetEmailRef,
    closeModal,
    changeView,
    handleLogin,
    handleRegister,
    handleResetPassword,
    handleResendConfirmation,
    handleGoogleLogin,
    setField: (field, value) => dispatch({ type: "setField", field, value }),
    toggleShowPassword: () => dispatch({ type: "toggleShowPassword" }),
    setAgreedToTerms: (checked) => dispatch({ type: "setAgreedToTerms", value: checked }),
  };
}

export default function AuthModal({
  isOpen,
  onClose,
  initialView = "login",
}: AuthModalProps) {
  const controller = useAuthModalController({ isOpen, onClose, initialView });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Zavrieť modal"
        onClick={controller.closeModal}
      />
      <div className="relative w-full max-w-md bg-background-secondary rounded-2xl shadow-xl overflow-hidden animate-modal-in">
        <button
          type="button"
          onClick={controller.closeModal}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background-tertiary/80 text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors"
          aria-label="Zavrieť"
        >
          <X className="w-5 h-5" />
        </button>

        <AuthModalHeader view={controller.state.view} />

        <div className="p-6">
          {controller.state.view === "login" && (
            <LoginForm
              email={controller.state.email}
              password={controller.state.password}
              loading={controller.state.loading}
              showPassword={controller.state.showPassword}
              loginEmailRef={controller.loginEmailRef}
              onSubmit={controller.handleLogin}
              onForgotPassword={() => controller.changeView("reset")}
              onEmailChange={(value) => controller.setField("email", value)}
              onPasswordChange={(value) => controller.setField("password", value)}
              onTogglePassword={controller.toggleShowPassword}
            />
          )}

          {controller.state.view === "register" && (
            <RegisterForm
              state={controller.state}
              loading={controller.state.loading}
              canSubmitRegister={controller.canSubmitRegister}
              hasMinLength={controller.hasMinLength}
              hasLetterAndNumber={controller.hasLetterAndNumber}
              passwordsMatch={controller.passwordsMatch}
              passwordStrength={controller.passwordStrength}
              registerNameRef={controller.registerNameRef}
              onSubmit={controller.handleRegister}
              onFieldChange={controller.setField}
              onTogglePassword={controller.toggleShowPassword}
              onTermsChange={controller.setAgreedToTerms}
            />
          )}

          {controller.state.view === "reset" && (
            <ResetForm
              email={controller.state.email}
              loading={controller.state.loading}
              resetEmailRef={controller.resetEmailRef}
              onSubmit={controller.handleResetPassword}
              onBackToLogin={() => controller.changeView("login")}
              onEmailChange={(value) => controller.setField("email", value)}
            />
          )}

          {controller.state.view === "verify" && (
            <VerifyView
              email={controller.state.email}
              resendLoading={controller.state.resendLoading}
              resendCooldown={controller.state.resendCooldown}
              onResend={controller.handleResendConfirmation}
              onBackToLogin={() => controller.changeView("login")}
            />
          )}

          {(controller.state.view === "login" || controller.state.view === "register") && (
            <SocialLoginSection onGoogleLogin={controller.handleGoogleLogin} />
          )}
        </div>

        <AuthModalFooter
          view={controller.state.view}
          onChangeView={controller.changeView}
        />
      </div>
    </div>
  );
}

function AuthModalHeader({ view }: { view: AuthView }) {
  return (
    <div className="pt-6 pb-4 px-6 text-center border-b border-border-subtle">
      <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mx-auto mb-3">
        AB
      </div>
      <h2 className="text-xl font-semibold text-text-primary">
        {view === "login" && "Prihlásenie"}
        {view === "register" && "Registrácia"}
        {view === "reset" && "Obnovenie hesla"}
        {view === "verify" && "Dokončite registráciu"}
      </h2>
      <p className="text-sm text-text-tertiary mt-1">
        {view === "login" && "Vitajte späť"}
        {view === "register" && "Vytvorte si účet"}
        {view === "reset" && "Zadajte svoj e-mail"}
        {view === "verify" && "Skontrolujte e-mail a potvrdenie účtu"}
      </p>
    </div>
  );
}

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
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <input
          ref={loginEmailRef}
          type="email"
          id="auth-login-email"
          name="auth-login-email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="Email"
          className="input w-full"
          autoComplete="email"
        />
      </div>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          id="auth-login-password"
          name="auth-login-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Heslo"
          className="input w-full pr-10"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
          aria-label="Zobraziť alebo skryť heslo"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-accent hover:underline"
        >
          Zabudli ste heslo?
        </button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
      >
        {loading ? <Spinner /> : "Prihlásiť sa"}
      </button>
    </form>
  );
}

function RegisterForm({
  state,
  loading,
  canSubmitRegister,
  hasMinLength,
  hasLetterAndNumber,
  passwordsMatch,
  passwordStrength,
  registerNameRef,
  onSubmit,
  onFieldChange,
  onTogglePassword,
  onTermsChange,
}: {
  state: AuthState;
  loading: boolean;
  canSubmitRegister: boolean;
  hasMinLength: boolean;
  hasLetterAndNumber: boolean;
  passwordsMatch: boolean;
  passwordStrength: PasswordStrength;
  registerNameRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (event: React.FormEvent) => void;
  onFieldChange: (field: AuthField, value: string) => void;
  onTogglePassword: () => void;
  onTermsChange: (checked: boolean) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        ref={registerNameRef}
        type="text"
        id="auth-register-full-name"
        name="auth-register-full-name"
        value={state.fullName}
        onChange={(event) => onFieldChange("fullName", event.target.value)}
        placeholder="Meno a priezvisko"
        className="input w-full"
        autoComplete="name"
      />
      <input
        type="email"
        id="auth-register-email"
        name="auth-register-email"
        value={state.email}
        onChange={(event) => onFieldChange("email", event.target.value)}
        placeholder="Email"
        className="input w-full"
        autoComplete="email"
      />
      <div className="relative">
        <input
          type={state.showPassword ? "text" : "password"}
          id="auth-register-password"
          name="auth-register-password"
          value={state.password}
          onChange={(event) => onFieldChange("password", event.target.value)}
          placeholder="Heslo (min. 6 znakov)"
          className="input w-full pr-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
          aria-label="Zobraziť alebo skryť heslo"
        >
          {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="space-y-1" aria-live="polite">
        <div className="h-1.5 rounded-full bg-background-tertiary overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${getPasswordStrengthBarClass(passwordStrength)}`}
            style={{ width: getPasswordStrengthWidth(passwordStrength) }}
            data-testid="register-password-strength-bar"
          />
        </div>
        <p className="text-xs text-text-tertiary">
          Sila hesla:{" "}
          <span data-testid="register-password-strength-label">
            {getPasswordStrengthLabel(passwordStrength) || "N/A"}
          </span>
        </p>
      </div>

      <div className="rounded-lg border border-border-subtle bg-background-tertiary/40 px-3 py-2 text-xs text-text-secondary">
        <p className={hasMinLength ? "text-success" : undefined}>
          {hasMinLength ? "[OK]" : "[ ]"} Minimálne 6 znakov
        </p>
        <p className={hasLetterAndNumber ? "text-success" : undefined}>
          {hasLetterAndNumber ? "[OK]" : "[ ]"} Písmená a čísla
        </p>
      </div>

      <input
        type="password"
        id="auth-register-confirm-password"
        name="auth-register-confirm-password"
        value={state.confirmPassword}
        onChange={(event) => onFieldChange("confirmPassword", event.target.value)}
        placeholder="Potvrďte heslo"
        className="input w-full"
        autoComplete="new-password"
      />
      {state.confirmPassword.length > 0 && (
        <p
          className={`text-xs ${passwordsMatch ? "text-success" : "text-error"}`}
          data-testid="register-password-match"
        >
          {passwordsMatch ? "Heslá sa zhodujú" : "Heslá sa nezhodujú"}
        </p>
      )}

      <label
        htmlFor="auth-register-terms"
        className="flex items-start gap-2 text-sm text-text-secondary cursor-pointer"
      >
        <input
          type="checkbox"
          id="auth-register-terms"
          name="auth-register-terms"
          checked={state.agreedToTerms}
          onChange={(event) => onTermsChange(event.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border accent-accent"
        />
        <span>
          Súhlasím s{" "}
          <Link
            href="/obchodne-podmienky"
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            podmienkami
          </Link>{" "}
          a{" "}
          <Link
            href="/ochrana-udajov"
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ochranou údajov
          </Link>
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || !canSubmitRegister}
        className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
      >
        {loading ? <Spinner /> : "Registrovať sa"}
      </button>
    </form>
  );
}

function ResetForm({
  email,
  loading,
  resetEmailRef,
  onSubmit,
  onBackToLogin,
  onEmailChange,
}: {
  email: string;
  loading: boolean;
  resetEmailRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (event: React.FormEvent) => void;
  onBackToLogin: () => void;
  onEmailChange: (value: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-text-secondary text-center mb-4">
        Zadajte e-mail a pošleme vám odkaz na obnovenie hesla.
      </p>
      <input
        ref={resetEmailRef}
        type="email"
        id="auth-reset-email"
        name="auth-reset-email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="Email"
        className="input w-full"
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
      >
        {loading ? <Spinner /> : "Odoslať odkaz"}
      </button>
      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full text-center text-sm text-text-tertiary hover:text-text-primary"
      >
        Späť na prihlásenie
      </button>
    </form>
  );
}

function VerifyView({
  email,
  resendLoading,
  resendCooldown,
  onResend,
  onBackToLogin,
}: {
  email: string;
  resendLoading: boolean;
  resendCooldown: number;
  onResend: () => void;
  onBackToLogin: () => void;
}) {
  return (
    <div className="space-y-4" data-testid="register-verify-view">
      <div className="rounded-xl border border-success/20 bg-success-subtle px-4 py-3">
        <p className="text-sm text-success font-medium">
          Registrácia je hotová. Poslali sme potvrdzovací e-mail na:
        </p>
        <p className="mt-1 text-sm font-semibold text-success">{email}</p>
      </div>

      <ol className="space-y-2 text-sm text-text-secondary list-decimal pl-5">
        <li>Otvorte svoju doručenú poštu (skontrolujte aj spam).</li>
        <li>Kliknite na potvrdzovací odkaz v e-maile.</li>
        <li>Po potvrdení sa prihláste do svojho účtu.</li>
      </ol>

      <button
        type="button"
        onClick={onResend}
        disabled={resendLoading || resendCooldown > 0}
        className="w-full rounded-lg border border-border-subtle bg-background px-4 py-2 text-sm font-medium text-text-primary hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="resend-confirmation-button"
      >
        {resendLoading
          ? "Odosielam..."
          : resendCooldown > 0
            ? `Opakovať za ${resendCooldown}s`
            : "Poslať potvrdzovací e-mail znova"}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="btn-primary w-full py-3 font-semibold"
      >
        Mám potvrdený e-mail, prihlásiť sa
      </button>
    </div>
  );
}

function SocialLoginSection({ onGoogleLogin }: { onGoogleLogin: () => void }) {
  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-subtle" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-background-secondary text-xs text-text-tertiary uppercase tracking-wider">
            alebo
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onGoogleLogin}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-border-subtle rounded-lg text-sm font-medium text-text-primary hover:bg-background-tertiary transition-colors"
      >
        <GoogleIcon />
        <span>Pokračovať s Google</span>
      </button>
    </>
  );
}

function AuthModalFooter({
  view,
  onChangeView,
}: {
  view: AuthView;
  onChangeView: (view: AuthView) => void;
}) {
  return (
    <div className="px-6 py-4 bg-background-tertiary/50 border-t border-border-subtle text-center">
      {view === "login" ? (
        <p className="text-sm text-text-secondary">
          Nemáte účet?{" "}
          <button
            type="button"
            onClick={() => onChangeView("register")}
            className="text-accent font-medium hover:underline"
          >
            Registrujte sa
          </button>
        </p>
      ) : view === "register" ? (
        <p className="text-sm text-text-secondary">
          Už máte účet?{" "}
          <button
            type="button"
            onClick={() => onChangeView("login")}
            className="text-accent font-medium hover:underline"
          >
            Prihláste sa
          </button>
        </p>
      ) : view === "verify" ? (
        <button
          type="button"
          onClick={() => onChangeView("login")}
          className="text-sm text-accent font-medium hover:underline"
        >
          Prejsť na prihlásenie
        </button>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}


