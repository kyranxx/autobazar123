"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/shadcn/button";
import { createCsrfHeaders } from "@/lib/security/client-csrf";
import { createContactFormSchema } from "@/lib/validation/forms";

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

  const t = useTranslations("contact");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const contactSchema = createContactFormSchema();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const parsed = contactSchema.safeParse({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      if (!parsed.success) {
        setStatus({
          type: "error",
          message: tErrors("generic"),
        });
        return;
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: createCsrfHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(parsed.data),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setStatus({
          type: "error",
          message: data?.error || tErrors("generic"),
        });
        return;
      }

      setStatus({
        type: "success",
        message: tCommon("success"),
      });
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
            maxLength={100}
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
            maxLength={254}
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
          <select
            id="contact-subject"
            name="contact-subject"
            aria-label={t("subject")}
            value={formData.subject}
            onChange={(e) =>
              setFormData({
                ...formData,
                subject: e.target.value,
              })
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-primary focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">{t("subject")}</option>
            <option value="general">{t("subjectGeneral")}</option>
            <option value="technical">{t("subjectTechnical")}</option>
            <option value="billing">{t("subjectBilling")}</option>
            <option value="partnership">{t("subjectPartnership")}</option>
          </select>
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
            maxLength={2000}
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
