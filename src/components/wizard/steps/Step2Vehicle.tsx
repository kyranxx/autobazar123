import { useTranslations } from "next-intl";
import { WizardStepProps } from "@/types/wizard";
import { FormField } from "@/components/ui/FormField";
import type {
  VehicleBrandOption,
  VehicleModelOption,
} from "@/lib/vehicle-taxonomy/types";
import { cn } from "@/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { LISTING_LIMITS } from "@/lib/validation/listings";

interface Step2VehicleProps extends WizardStepProps {
  brands: VehicleBrandOption[];
  models: Record<string, VehicleModelOption[]>;
  isTaxonomyLoading?: boolean;
  taxonomyError?: string | null;
  onDecodeVin: () => void;
  vinDecodingEnabled?: boolean;
  vinDecodeState: {
    isLoading: boolean;
    message: string | null;
    tone: "success" | "error" | null;
  };
}

interface SelectFieldOption {
  value: string;
  label: string;
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
}) {
  const mappedValue = value || "__select_placeholder__";
  return (
    <Select
      value={mappedValue}
      onValueChange={(nextValue) =>
        onChange(nextValue === "__select_placeholder__" ? "" : nextValue)
      }
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "min-h-[44px] rounded-lg",
          error && "border-destructive focus-visible:ring-destructive/20",
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__select_placeholder__">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Step2Vehicle({
  formData,
  updateFormData,
  errors,
  brands,
  models,
  isTaxonomyLoading = false,
  taxonomyError = null,
  onDecodeVin,
  vinDecodingEnabled = false,
  vinDecodeState,
}: Step2VehicleProps) {
  const t = useTranslations("addListing");
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

  const availableModels = formData.brand_id
    ? models[formData.brand_id] || []
    : [];

  const handleBrandChange = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    updateFormData("brand_id", brandId);
    updateFormData("brand", brand?.name || "");
    updateFormData("model_id", "");
    updateFormData("model", "");
  };

  const handleModelChange = (modelId: string) => {
    const model = availableModels.find((m) => m.id === modelId);
    updateFormData("model_id", modelId);
    updateFormData("model", model?.name || "");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">
          {t("vehicleData")}
        </h2>
        <p className="text-secondary">{t("basicInfo")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label={t("selectBrand")} required error={errors.brand}>
          <SelectField
            value={formData.brand_id}
            onChange={handleBrandChange}
            options={brands.map((brand) => ({
              value: brand.id,
              label: brand.name,
            }))}
            placeholder={t("selectBrand")}
            disabled={isTaxonomyLoading}
            error={!!errors.brand}
          />
        </FormField>

        <FormField label={t("selectModel")} required error={errors.model}>
          <SelectField
            value={formData.model_id}
            onChange={handleModelChange}
            options={availableModels.map((model) => ({
              value: model.id,
              label: model.name,
            }))}
            disabled={!formData.brand_id || isTaxonomyLoading}
            placeholder={t("selectModel")}
            error={!!errors.model}
          />
        </FormField>

        <FormField label={t("generation")}>
          <input
            type="text"
            value={formData.generation}
            onChange={(e) => updateFormData("generation", e.target.value)}
            placeholder={t("generationPlaceholder")}
            maxLength={LISTING_LIMITS.generationMaxLength}
            className="form-input"
          />
        </FormField>

        <FormField label={t("yearOfManufacture")} required error={errors.year}>
          <SelectField
            value={formData.year?.toString() || ""}
            onChange={(val) => updateFormData("year", parseInt(val) || "")}
            options={years.map((year) => ({
              value: year.toString(),
              label: year.toString(),
            }))}
            placeholder={t("selectYear")}
            error={!!errors.year}
          />
        </FormField>

        <FormField label={t("vinOptional")} error={errors.vin} className="sm:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={formData.vin}
              onChange={(e) =>
                updateFormData("vin", e.target.value.toUpperCase())
              }
              placeholder={t("vinPlaceholder")}
              maxLength={17}
              className="form-input font-mono sm:flex-1"
            />
            {vinDecodingEnabled ? (
              <button
                type="button"
                onClick={onDecodeVin}
                disabled={vinDecodeState.isLoading || formData.vin.trim().length === 0}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {vinDecodeState.isLoading ? t("decodingVin") : t("decodeVin")}
              </button>
            ) : null}
          </div>
          {vinDecodingEnabled ? (
            <p className="mt-1 text-xs text-secondary">{t("vinHelp")}</p>
          ) : null}
          {vinDecodingEnabled && vinDecodeState.message ? (
            <p
              className={cn(
                "mt-2 text-xs",
                vinDecodeState.tone === "error" ? "text-destructive" : "text-success",
              )}
            >
              {vinDecodeState.message}
            </p>
          ) : null}
        </FormField>
      </div>

      {taxonomyError ? (
        <p className="text-sm text-destructive">{taxonomyError}</p>
      ) : null}
    </div>
  );
}
