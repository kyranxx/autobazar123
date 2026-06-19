import { useTranslations } from "next-intl";
import { WizardStepProps, AdFormData } from "@/types/wizard";
import { FormField } from "@/components/ui/FormField";
import { CheckIcon } from "@/components/ui/Icons";
import { detectPotentialContentIssues } from "@/lib/content-safety";
import { LISTING_LIMITS } from "@/lib/validation/listings";

export function Step4Details({
  formData,
  updateFormData,
  errors,
}: WizardStepProps) {
  const t = useTranslations("addListing");

  const trustSignals = [
    { key: "is_bought_in_sk", labelKey: "boughtInSk", icon: "🇸🇰" },
    { key: "has_service_book", labelKey: "serviceBook", icon: "📘" },
    { key: "full_service_history", labelKey: "fullServiceHistory", icon: "📋" },
    { key: "originality_check", labelKey: "originalityCheck", icon: "🔍" },
    { key: "not_crashed", labelKey: "notCrashed", icon: "✅" },
    { key: "garage_kept", labelKey: "garageKept", icon: "🏠" },
    { key: "is_vat_deductible", labelKey: "vatDeductible", icon: "💶" },
    { key: "is_imported", labelKey: "imported", icon: "🌍" },
  ];
  const contentWarnings = detectPotentialContentIssues(formData.description || "");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">
          {t("trustSignals")}
        </h2>
        <p className="text-secondary">{t("trustSignalsSubtitle")}</p>
      </div>

      {/* Trust Signals */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {trustSignals.map((signal) => (
          <label
            key={signal.key}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              formData[signal.key as keyof AdFormData]
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/30"
            }`}
          >
            <input
              type="checkbox"
              checked={formData[signal.key as keyof AdFormData] as boolean}
              onChange={(e) =>
                updateFormData(
                  signal.key as keyof AdFormData,
                  e.target.checked as never,
                )
              }
              className="sr-only"
            />
            <span className="text-xl">{signal.icon}</span>
            <span className="font-medium text-primary">
              {t(signal.labelKey)}
            </span>
            {formData[signal.key as keyof AdFormData] && (
              <CheckIcon className="size-5 text-accent ml-auto" />
            )}
          </label>
        ))}
      </div>

      {/* STK Valid Until */}
      <FormField label={t("stkValidUntil")}>
        <input
          type="date"
          value={formData.stk_valid_until}
          onChange={(e) => updateFormData("stk_valid_until", e.target.value)}
          className="form-input"
        />
      </FormField>

      {/* Location */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label={t("city")} required error={errors.location_city}>
        <input
          type="text"
          data-testid="listing-location-city"
          value={formData.location_city}
          onChange={(e) => updateFormData("location_city", e.target.value)}
          placeholder={t("cityPlaceholder")}
          maxLength={LISTING_LIMITS.cityMaxLength}
          className="form-input"
        />
        </FormField>

        <FormField label={t("district")}>
        <input
          type="text"
          data-testid="listing-location-district"
          value={formData.location_district}
          onChange={(e) =>
            updateFormData("location_district", e.target.value)
          }
          placeholder={t("districtPlaceholder")}
          maxLength={LISTING_LIMITS.districtMaxLength}
          className="form-input"
        />
        </FormField>
      </div>

      {/* Description */}
      <FormField label={t("description")}>
        <textarea
          data-testid="listing-description"
          rows={6}
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          onPaste={(event) => {
            const pastedText = event.clipboardData.getData("text");
            if (!pastedText) return;
            event.preventDefault();
            updateFormData(
              "description",
              pastedText.replace(/\r\n/g, "\n").replace(/\u3000/g, " ").trim(),
            );
          }}
          placeholder={t("descriptionPlaceholder")}
          maxLength={LISTING_LIMITS.descriptionMaxLength}
          className="form-input resize-none"
        />
        <p className="mt-1 text-xs text-secondary">{t("descriptionTip")}</p>
        {contentWarnings.length > 0 && (
          <div className="mt-3 rounded-md border border-warning/30 bg-warning-subtle px-3 py-2 text-xs text-warning">
            <p className="font-medium text-text-primary">
              Potential trust issues detected:
            </p>
            <ul className="mt-1 list-disc pl-4">
              {contentWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </FormField>
    </div>
  );
}
