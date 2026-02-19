"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
      return "Silna";
    case "medium":
      return "Stredna";
    case "weak":
      return "Slaba";
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
      return "bg-emerald-500";
    case "medium":
      return "bg-amber-500";
    case "weak":
      return "bg-red-500";
    default:
      return "bg-transparent";
  }
}

export default function AuthModal({
  isOpen,
  onClose,
  initialView = "login",
}: AuthModalProps) {
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const hasMinLength = password.length >= 6;
  const hasLetterAndNumber = /[A-Za-z]/.test(password) && /\d/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmitRegister =
    !!email &&
    !!fullName &&
    !!password &&
    !!confirmPassword &&
    hasMinLength &&
    passwordsMatch &&
    agreedToTerms;

  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }, [view]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldown]);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setAgreedToTerms(false);
      setLoading(false);
      setResendLoading(false);
      setResendCooldown(0);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password) {
      toast.error("Vyplnte email a heslo");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("Nespravny email alebo heslo");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Potvrdte svoju emailovu adresu");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Prihlasenie uspesne");
      onClose();
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Prihlasovanie sa nepodarilo");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !fullName) {
      toast.error("Vyplnte vsetky povinne polia");
      return;
    }

    if (password.length < 6) {
      toast.error("Heslo musi mat aspon 6 znakov");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Hesla sa nezhoduju");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Musite suhlasit s podmienkami");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const identities = data.user?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        toast.error("Email je uz registrovany. Prihlaste sa alebo obnovte heslo.");
        setView("login");
        return;
      }

      toast.success("Registracia uspesna. Skontrolujte email.");
      setView("verify");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Registracia sa nepodarila");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Chyba email pre odoslanie potvrdenia.");
      return;
    }

    if (resendCooldown > 0 || resendLoading) {
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Potvrdzovaci email bol odoslany znova.");
      setResendCooldown(60);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Potvrdzovaci email sa nepodarilo odoslat.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Zadajte emailovu adresu");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email na obnovenie hesla bol odoslany");
      setView("login");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-background-secondary rounded-2xl shadow-xl overflow-hidden animate-modal-in"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background-tertiary/80 text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors"
          aria-label="Zavriet"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-6 pb-4 px-6 text-center border-b border-border-subtle">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mx-auto mb-3">
            AB
          </div>
          <h2 className="text-xl font-semibold text-text-primary">
            {view === "login" && "Prihlasenie"}
            {view === "register" && "Registracia"}
            {view === "reset" && "Obnovenie hesla"}
            {view === "verify" && "Dokoncite registraciu"}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            {view === "login" && "Vitajte spat"}
            {view === "register" && "Vytvorte si ucet"}
            {view === "reset" && "Zadajte svoj email"}
            {view === "verify" && "Skontrolujte email a potvrdenie uctu"}
          </p>
        </div>

        <div className="p-6">
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="email"
                  id="auth-login-email"
                  name="auth-login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="input w-full"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="auth-login-password"
                  name="auth-login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Heslo"
                  className="input w-full pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  aria-label="Zobrazit alebo skryt heslo"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setView("reset")}
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
                {loading ? <Spinner /> : "Prihlasit sa"}
              </button>
            </form>
          )}

          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                id="auth-register-full-name"
                name="auth-register-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Meno a priezvisko"
                className="input w-full"
                autoComplete="name"
                autoFocus
              />
              <input
                type="email"
                id="auth-register-email"
                name="auth-register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="input w-full"
                autoComplete="email"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="auth-register-password"
                  name="auth-register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Heslo (min. 6 znakov)"
                  className="input w-full pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  aria-label="Zobrazit alebo skryt heslo"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
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
                <p className={hasMinLength ? "text-emerald-600" : undefined}>
                  {hasMinLength ? "[OK]" : "[ ]"} Minimalne 6 znakov
                </p>
                <p className={hasLetterAndNumber ? "text-emerald-600" : undefined}>
                  {hasLetterAndNumber ? "[OK]" : "[ ]"} Pismena a cisla
                </p>
              </div>
              <input
                type="password"
                id="auth-register-confirm-password"
                name="auth-register-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Potvrdte heslo"
                className="input w-full"
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}
                  data-testid="register-password-match"
                >
                  {passwordsMatch ? "Hesla sa zhoduju" : "Hesla sa nezhoduju"}
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
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-accent"
                />
                <span>
                  Suhlasim s{" "}
                  <a
                    href="/obchodne-podmienky"
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    podmienkami
                  </a>{" "}
                  a{" "}
                  <a
                    href="/ochrana-udajov"
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ochranou udajov
                  </a>
                </span>
              </label>
              <button
                type="submit"
                disabled={loading || !canSubmitRegister}
                className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
              >
                {loading ? <Spinner /> : "Registrovat sa"}
              </button>
            </form>
          )}

          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-text-secondary text-center mb-4">
                Zadajte email a posleme vam odkaz na obnovenie hesla.
              </p>
              <input
                type="email"
                id="auth-reset-email"
                name="auth-reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="input w-full"
                autoComplete="email"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
              >
                {loading ? <Spinner /> : "Odoslat odkaz"}
              </button>
              <button
                type="button"
                onClick={() => setView("login")}
                className="w-full text-center text-sm text-text-tertiary hover:text-text-primary"
              >
                Spat na prihlasenie
              </button>
            </form>
          )}

          {view === "verify" && (
            <div className="space-y-4" data-testid="register-verify-view">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm text-emerald-800 font-medium">
                  Registracia je hotova. Poslali sme potvrdzovaci email na:
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-900">{email}</p>
              </div>

              <ol className="space-y-2 text-sm text-text-secondary list-decimal pl-5">
                <li>Otvorte svoju dorucenu postu (skontrolujte aj spam).</li>
                <li>Kliknite na potvrdzovaci odkaz v emaile.</li>
                <li>Po potvrdeni sa prihlaste do svojho uctu.</li>
              </ol>

              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading || resendCooldown > 0}
                className="w-full rounded-lg border border-border-subtle bg-background px-4 py-2 text-sm font-medium text-text-primary hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="resend-confirmation-button"
              >
                {resendLoading
                  ? "Odosielam..."
                  : resendCooldown > 0
                    ? `Opakovat za ${resendCooldown}s`
                    : "Poslat potvrdzovaci email znova"}
              </button>

              <button
                type="button"
                onClick={() => setView("login")}
                className="btn-primary w-full py-3 font-semibold"
              >
                Mam potvrdeny email, prihlasit sa
              </button>
            </div>
          )}

          {(view === "login" || view === "register") && (
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
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-border-subtle rounded-lg text-sm font-medium text-text-primary hover:bg-background-tertiary transition-colors"
              >
                <GoogleIcon />
                <span>Pokracovat s Google</span>
              </button>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-background-tertiary/50 border-t border-border-subtle text-center">
          {view === "login" ? (
            <p className="text-sm text-text-secondary">
              Nemate ucet?{" "}
              <button
                onClick={() => setView("register")}
                className="text-accent font-medium hover:underline"
              >
                Registrujte sa
              </button>
            </p>
          ) : view === "register" ? (
            <p className="text-sm text-text-secondary">
              Uz mate ucet?{" "}
              <button
                onClick={() => setView("login")}
                className="text-accent font-medium hover:underline"
              >
                Prihlaste sa
              </button>
            </p>
          ) : view === "verify" ? (
            <button
              onClick={() => setView("login")}
              className="text-sm text-accent font-medium hover:underline"
            >
              Prejst na prihlasenie
            </button>
          ) : null}
        </div>
      </div>
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
