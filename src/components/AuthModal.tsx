"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, X } from "lucide-react";

type AuthView = "login" | "register" | "reset";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
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
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Reset form when view changes
  useEffect(() => {
    setPassword("");

    setConfirmPassword("");

    setShowPassword(false);
  }, [view]);

  // Reset initial view when modal opens
  useEffect(() => {
    if (isOpen) {
      setView(initialView);

      setEmail("");

      setPassword("");

      setConfirmPassword("");

      setFullName("");

      setAgreedToTerms(false);
    }
  }, [isOpen, initialView]);

  // Close on escape
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

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password) {
      toast.error("Vyplňte email a heslo");
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
          toast.error("Nesprávny email alebo heslo");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Potvrďte svoju emailovú adresu");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Prihlásenie úspešné!");
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
      toast.error("Vyplňte všetky povinné polia");
      return;
    }
    if (password.length < 6) {
      toast.error("Heslo musí mať aspoň 6 znakov");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Heslá sa nezhodujú");
      return;
    }
    if (!agreedToTerms) {
      toast.error("Musíte súhlasiť s podmienkami");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Registrácia úspešná! Skontrolujte email.");
      onClose();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Zadajte emailovú adresu");
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
      toast.success("Email na obnovenie hesla bol odoslaný");
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
    if (error) toast.error(error.message);
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background-tertiary/80 text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors"
          aria-label="Zavrieť"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pt-6 pb-4 px-6 text-center border-b border-border-subtle">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold mx-auto mb-3">
            AB
          </div>
          <h2 className="text-xl font-semibold text-text-primary">
            {view === "login" && "Prihlásenie"}
            {view === "register" && "Registrácia"}
            {view === "reset" && "Obnovenie hesla"}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            {view === "login" && "Vitajte späť!"}
            {view === "register" && "Vytvorte si účet"}
            {view === "reset" && "Zadajte svoj email"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Login Form */}
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
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
                {loading ? <Spinner /> : "Prihlásiť sa"}
              </button>
            </form>
          )}

          {/* Register Form */}
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <input
                type="password"
                id="auth-register-confirm-password"
                name="auth-register-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Potvrďte heslo"
                className="input w-full"
                autoComplete="new-password"
              />
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
                  Súhlasím s{" "}
                  <a
                    href="/obchodne-podmienky"
                    className="text-accent hover:underline"
                    target="_blank"
                  >
                    podmienkami
                  </a>{" "}
                  a{" "}
                  <a
                    href="/ochrana-udajov"
                    className="text-accent hover:underline"
                    target="_blank"
                  >
                    ochranou údajov
                  </a>
                </span>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
              >
                {loading ? <Spinner /> : "Registrovať sa"}
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-text-secondary text-center mb-4">
                Zadajte email a pošleme vám odkaz na obnovenie hesla.
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
                {loading ? <Spinner /> : "Odoslať odkaz"}
              </button>
              <button
                type="button"
                onClick={() => setView("login")}
                className="w-full text-center text-sm text-text-tertiary hover:text-text-primary"
              >
                ← Späť na prihlásenie
              </button>
            </form>
          )}

          {/* Divider */}
          {view !== "reset" && (
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

              {/* Social Login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-border-subtle rounded-lg text-sm font-medium text-text-primary hover:bg-background-tertiary transition-colors"
              >
                <GoogleIcon />
                <span>Pokračovať s Google</span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-background-tertiary/50 border-t border-border-subtle text-center">
          {view === "login" ? (
            <p className="text-sm text-text-secondary">
              Nemáte účet?{" "}
              <button
                onClick={() => setView("register")}
                className="text-accent font-medium hover:underline"
              >
                Registrujte sa
              </button>
            </p>
          ) : view === "register" ? (
            <p className="text-sm text-text-secondary">
              Už máte účet?{" "}
              <button
                onClick={() => setView("login")}
                className="text-accent font-medium hover:underline"
              >
                Prihláste sa
              </button>
            </p>
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
