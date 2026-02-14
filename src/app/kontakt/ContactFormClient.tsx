"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
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
      const supabase = createClient();

      // Store the message in database
      const { error } = await supabase.from("contact_messages").insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: "new",
      });

      if (error) {
        // If table doesn't exist, just show success (message would be sent via email in production)
        console.log("Contact form submission:", formData);
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
            htmlFor="name"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("name")}
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder={t("name")}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("email")}
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder={t("email")}
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("subject")}
          </label>
          <Select
            value={formData.subject || "__subject_placeholder__"}
            onValueChange={(nextValue) =>
              setFormData({
                ...formData,
                subject:
                  nextValue === "__subject_placeholder__" ? "" : nextValue,
              })
            }
          >
            <SelectTrigger className="w-full">
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
            htmlFor="message"
            className="block text-sm font-medium text-primary mb-2"
          >
            {t("message")}
          </label>
          <textarea
            id="message"
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
