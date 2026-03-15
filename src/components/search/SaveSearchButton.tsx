"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { HeartIcon } from "@/components/ui/Icons";
import { useAuthOptional } from "@/context/AuthContext";

export function SaveSearchButton({
  queryString,
}: {
  queryString: string;
}) {
  const { user } = useAuthOptional();
  const t = useTranslations("searchPage");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const canSave = queryString.trim().length > 0;

  const handleSave = async () => {
    if (!user) {
      toast.info(t("saveSearchLoginRequired"));
      return;
    }

    if (!canSave) {
      toast.info(t("saveSearchAddFilters"));
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/account/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryString }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || t("saveSearchError"));
        return;
      }

      setIsSaved(true);
      toast.success(t("saveSearchSuccess"));
    } catch {
      toast.error(t("saveSearchError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      type="button"
      variant={isSaved ? "secondary" : "outline"}
      size="sm"
      onClick={handleSave}
      disabled={isSaving}
      className="gap-2"
    >
      <HeartIcon className={isSaved ? "h-4 w-4 fill-current" : "h-4 w-4"} />
      {isSaved ? t("searchSaved") : t("saveSearch")}
    </Button>
  );
}
