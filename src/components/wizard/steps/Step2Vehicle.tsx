import { useTranslations } from "next-intl";
import { WizardStepProps } from "@/types/wizard";
import { FormField } from "@/components/ui/FormField";
import CustomSelect from "@/components/ui/CustomSelect";

interface Step2VehicleProps extends WizardStepProps {
    brands: { id: string; name: string; slug: string }[];
    models: Record<string, { id: string; name: string }[]>;
}

export function Step2Vehicle({
    formData,
    updateFormData,
    errors,
    brands,
    models,
}: Step2VehicleProps) {
    const t = useTranslations("addListing");
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

    const availableModels = formData.brand_id ? models[formData.brand_id] || [] : [];

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
                <p className="text-secondary">
                    {t("basicInfo")}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label={t("selectBrand")} required error={errors.brand}>
                    <CustomSelect
                        value={formData.brand_id}
                        onChange={(val) => handleBrandChange(val)}
                        options={brands.map(brand => ({ value: brand.id, label: brand.name }))}
                        placeholder={t("selectBrand")}
                        error={!!errors.brand}
                    />
                </FormField>

                <FormField label={t("selectModel")} required error={errors.model}>
                    <CustomSelect
                        value={formData.model_id}
                        onChange={(val) => handleModelChange(val)}
                        options={availableModels.map(model => ({ value: model.id, label: model.name }))}
                        disabled={!formData.brand_id}
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
                        className="form-input"
                    />
                </FormField>

                <FormField label={t("yearOfManufacture")} required error={errors.year}>
                    <CustomSelect
                        value={formData.year?.toString() || ""}
                        onChange={(val) => updateFormData("year", parseInt(val) || "")}
                        options={years.map(year => ({ value: year.toString(), label: year.toString() }))}
                        placeholder={t("selectYear")}
                        error={!!errors.year}
                    />
                </FormField>

                <FormField label={t("vinOptional")} className="sm:col-span-2">
                    <input
                        type="text"
                        value={formData.vin}
                        onChange={(e) => updateFormData("vin", e.target.value.toUpperCase())}
                        placeholder={t("vinPlaceholder")}
                        maxLength={17}
                        className="form-input font-mono"
                    />
                    <p className="mt-1 text-xs text-secondary">
                        {t("vinHelp")}
                    </p>
                </FormField>
            </div>
        </div>
    );
}
