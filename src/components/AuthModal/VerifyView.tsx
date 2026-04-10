
import React from "react";
import { pushClass } from "./shared";

/* ─── Verify view ─── */

function VerifyView({
  email,
  resendLoading,
  resendCooldown,
  onResend,
  onBackToLogin,
  t,
}: {
  email: string;
  resendLoading: boolean;
  resendCooldown: number;
  onResend: () => void;
  onBackToLogin: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="space-y-4" data-testid="register-verify-view">
      <div className="rounded-xl border border-[var(--color-mint)] bg-[var(--color-mint-subtle)] px-4 py-3">
        <p className="text-sm text-success font-medium">
          {t("verify.done")}
        </p>
        <p className="mt-1 text-sm font-semibold text-success">{email}</p>
      </div>

      <ol className="space-y-2 text-sm text-text-secondary list-decimal pl-5">
        <li>{t("verify.stepInbox")}</li>
        <li>{t("verify.stepConfirm")}</li>
        <li>{t("verify.stepLogin")}</li>
      </ol>

      <button
        type="button"
        onClick={onResend}
        disabled={resendLoading || resendCooldown > 0}
        className={`w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${pushClass}`}
        data-testid="resend-confirmation-button"
      >
        {resendLoading
          ? t("verify.resendLoading")
          : resendCooldown > 0
            ? t("verify.resendAfter", { seconds: resendCooldown })
            : t("verify.resend")}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="btn-accent w-full h-12 rounded-xl font-semibold cursor-pointer"
      >
        {t("verify.confirmedLogin")}
      </button>
    </div>
  );
}


export default VerifyView;
