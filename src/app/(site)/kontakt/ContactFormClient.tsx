"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
    <div>
      <h2 className="mb-6 text-xl font-semibold text-primary">{t("title")}</h2>

      {status ? (
        <div
          className={`mb-6 rounded-lg p-4 ${
            status.type === "success"
              ? "border border-success/20 bg-success/10 text-success"
              : "border border-error/20 bg-error/10 text-error"
          }`}
        >
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-2 block text-sm font-medium text-primary"
          >
            {t("name")}
          </label>
          <input
            type="text"
            id="contact-name"
            name="contact-name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            autoComplete="name"
            required
            maxLength={100}
            className="market-field w-full px-4 py-3 placeholder:text-tertiary"
            placeholder={t("name")}
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="mb-2 block text-sm font-medium text-primary"
          >
            {t("email")}
          </label>
          <input
            type="email"
            id="contact-email"
            name="contact-email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            autoComplete="email"
            required
            maxLength={254}
            className="market-field w-full px-4 py-3 placeholder:text-tertiary"
            placeholder={t("email")}
          />
        </div>
        <div>
          <label
            htmlFor="contact-subject"
            className="mb-2 block text-sm font-medium text-primary"
          >
            {t("subject")}
          </label>
          <select
            id="contact-subject"
            name="contact-subject"
            aria-label={t("subject")}
            value={formData.subject}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                subject: e.target.value,
              }))
            }
            className="market-field w-full px-4 py-3"
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
            className="mb-2 block text-sm font-medium text-primary"
          >
            {t("message")}
          </label>
          <textarea
            id="contact-message"
            name="contact-message"
            value={formData.message}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, message: e.target.value }))
            }
            rows={5}
            required
            maxLength={2000}
            className="market-field w-full resize-none px-4 py-3 placeholder:text-tertiary"
            placeholder={t("message")}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="market-action-primary w-full disabled:opacity-50"
        >
          {isSubmitting ? tCommon("loading") : t("send")}
        </button>
      </form>
    </div>
  );
}
