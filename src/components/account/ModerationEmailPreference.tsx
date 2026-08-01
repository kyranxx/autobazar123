"use client";

import { useEffect, useId, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { createCsrfHeaders } from "@/lib/security/client-csrf";

function getCopy(locale: string) {
  return locale.toLowerCase().startsWith("ro")
    ? {
        title: "Trimite-mi rezultatul moderării prin e-mail",
        help: "Vă anunțăm când anunțul este aprobat sau respins. Setarea se aplică tuturor anunțurilor viitoare.",
        saving: "Se salvează...",
        saved: "Preferința a fost salvată.",
        failed: "Preferința de e-mail nu a putut fi salvată.",
      }
    : {
        title: "Poslať výsledok moderácie emailom",
        help: "Dáme vám vedieť, keď inzerát schválime alebo zamietneme. Nastavenie platí pre všetky budúce inzeráty.",
        saving: "Ukladám...",
        saved: "Nastavenie bolo uložené.",
        failed: "Nastavenie emailov sa nepodarilo uložiť.",
      };
}

export function ModerationEmailPreference({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { profile, refreshProfile } = useAuth();
  const locale = useLocale();
  const copy = getCopy(locale);
  const inputId = useId();
  const [checked, setChecked] = useState(
    profile?.notify_moderation_email !== false,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setChecked(profile?.notify_moderation_email !== false);
  }, [profile?.notify_moderation_email]);

  const handleChange = async (nextValue: boolean) => {
    const previousValue = checked;
    setChecked(nextValue);
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/account/notifications/moderation", {
        method: "POST",
        headers: createCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ notifyModerationEmail: nextValue }),
      });

      if (!response.ok) throw new Error("save failed");
      await refreshProfile().catch(() => undefined);
      toast.success(copy.saved);
    } catch {
      setChecked(previousValue);
      setError(copy.failed);
      toast.error(copy.failed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-border bg-surface/40 p-4"
          : "market-card mb-5 bg-background p-5"
      }
    >
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={isSaving}
          onChange={(event) => void handleChange(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-semibold text-primary">
            {copy.title}
          </span>
          <span className="mt-1 block text-xs leading-5 text-tertiary">
            {copy.help}
          </span>
        </span>
      </label>
      <p className="mt-2 min-h-4 text-xs" aria-live="polite">
        {isSaving ? (
          <span className="text-tertiary">{copy.saving}</span>
        ) : error ? (
          <span className="text-error">{error}</span>
        ) : null}
      </p>
    </div>
  );
}
