import { useTranslations } from "next-intl";
import { WizardStepProps } from "@/types/wizard";
import { FormField } from "@/components/ui/FormField";

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
                    <select
                        value={formData.brand_id}
                        onChange={(e) => handleBrandChange(e.target.value)}
                        className="form-select"
                    >
                        <option value="">{t("selectBrand")}</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label={t("selectModel")} required error={errors.model}>
                    <select
                        value={formData.model_id}
                        onChange={(e) => handleModelChange(e.target.value)}
                        disabled={!formData.brand_id}
                        className="form-select"
                    >
                        <option value="">{t("selectModel")}</option>
                        {availableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
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
                    <select
                        value={formData.year}
                        onChange={(e) => updateFormData("year", parseInt(e.target.value) || "")}
                        className="form-select"
                    >
                        <option value="">{t("selectYear")}</option>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
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
