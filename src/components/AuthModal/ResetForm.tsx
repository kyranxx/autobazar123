
import React from "react";
import { EnvelopeSimple, ArrowLeft } from "@phosphor-icons/react";
import { useIconWeight } from "@/context/IconWeightContext";

import { pushClass, InputIcon, Spinner } from "./shared";

/* ─── Reset form ─── */

function ResetForm({
  email,
  loading,
  resetEmailRef,
  onSubmit,
  onBackToLogin,
  onEmailChange,
  t,
}: {
  email: string;
  loading: boolean;
  resetEmailRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (event: React.FormEvent) => void;
  onBackToLogin: () => void;
  onEmailChange: (value: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const { weight } = useIconWeight();
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-text-secondary text-center mb-4">
        {t("reset.description")}
      </p>
      <div className="relative">
        <InputIcon><EnvelopeSimple weight={weight} className="size-4" /></InputIcon>
        <input
          ref={resetEmailRef}
          type="email"
          id="auth-reset-email"
          name="auth-reset-email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={t("reset.emailPlaceholder")}
          className="input w-full h-12 !pl-12"
          autoComplete="email"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-accent w-full h-12 rounded-xl font-semibold disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Spinner /> : t("reset.submit")}
      </button>
      <button
        type="button"
        onClick={onBackToLogin}
        className={`w-full flex items-center justify-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer ${pushClass}`}
      >
        <ArrowLeft weight={weight} className="size-3.5" />
        {t("reset.backToLogin")}
      </button>
    </form>
  );
}


export default ResetForm;
