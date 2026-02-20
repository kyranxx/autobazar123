"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

// Simple rate limiting: max 3 submissions per 5 minutes per session
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export default function ContactFormClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Rate limiting state
  const submissionCount = useRef(0);
  const firstSubmissionTime = useRef<number | null>(null);

  const t = useTranslations("contact");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  const checkRateLimit = (): boolean => {
    const now = Date.now();

    // Reset if window has passed
    if (
      firstSubmissionTime.current &&
      now - firstSubmissionTime.current > RATE_LIMIT_WINDOW_MS
    ) {
      submissionCount.current = 0;
      firstSubmissionTime.current = null;
    }

    // Check if limit reached
    if (submissionCount.current >= RATE_LIMIT_COUNT) {
      return false;
    }

    // Record submission
    if (submissionCount.current === 0) {
      firstSubmissionTime.current = now;
    }
    submissionCount.current++;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit
    if (!checkRateLimit()) {
      setStatus({
        type: "error",
        message: "Príliš veľa správ. Skúste znova o 5 minút.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setStatus({
          type: "error",
          message: data?.error ?? tErrors("generic"),
        });
        return;
      }

      setStatus({
        type: "success",
        message: tCommon("success"),
      });

      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (_err) {
      setStatus({
        type: "error",
        message: tErrors("generic"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 rounded-2xl border border-border bg-surface/30">
      <h2 className="text-xl font-bold text-primary mb-6">{t("title")}</h2>

      {status && (
        <div
          className={`mb-6 p-4 rounded-xl ${
            status.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-error/10 text-error border border-error/20"
          }`}
        >
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("name")}
          </label>
          <input
            type="text"
            id="contact-name"
            name="contact-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="name"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder={t("name")}
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("email")}
          </label>
          <input
            type="email"
            id="contact-email"
            name="contact-email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            autoComplete="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder={t("email")}
          />
        </div>
        <div>
          <label
            htmlFor="contact-subject"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("subject")}
          </label>
          <Select
            name="contact-subject"
            value={formData.subject || "__subject_placeholder__"}
            onValueChange={(nextValue) =>
              setFormData({
                ...formData,
                subject:
                  nextValue === "__subject_placeholder__" ? "" : nextValue,
              })
            }
          >
            <SelectTrigger id="contact-subject" className="w-full">
              <SelectValue placeholder={t("subject")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__subject_placeholder__">
                {t("subject")}
              </SelectItem>
              <SelectItem value="general">{t("subjectGeneral")}</SelectItem>
              <SelectItem value="technical">{t("subjectTechnical")}</SelectItem>
              <SelectItem value="billing">{t("subjectBilling")}</SelectItem>
              <SelectItem value="partnership">
                {t("subjectPartnership")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label
            htmlFor="contact-message"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("message")}
          </label>
          <textarea
            id="contact-message"
            name="contact-message"
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            rows={5}
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent resize-none"
            placeholder={t("message")}
          />
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isSubmitting ? tCommon("loading") : t("send")}
        </Button>
      </form>
    </div>
  );
}
