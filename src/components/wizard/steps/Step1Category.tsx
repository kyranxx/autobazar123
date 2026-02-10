import { useTranslations } from "next-intl";
import { WizardStepProps, AdFormData } from "@/types/wizard";

export function Step1Category({
  formData,
  updateFormData,
  errors,
}: WizardStepProps) {
  const t = useTranslations("addListing");

  const categories = [
    {
      id: "personal",
      labelKey: "personalCars",
      icon: "🚗",
      descKey: "personalCarsDesc",
    },
    {
      id: "commercial",
      labelKey: "commercial",
      icon: "🚐",
      descKey: "commercialDesc",
    },
    {
      id: "moto",
      labelKey: "motorcycles",
      icon: "🏍️",
      descKey: "motorcyclesDesc",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">
          {t("selectCategory")}
        </h2>
        <p className="text-secondary">{t("whatVehicleType")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              updateFormData("category", cat.id as AdFormData["category"])
            }
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
              formData.category === cat.id
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/30 hover:bg-surface"
            }`}
          >
            <span className="text-4xl">{cat.icon}</span>
            <div className="text-center">
              <p className="font-semibold text-primary">{t(cat.labelKey)}</p>
              <p className="text-sm text-secondary mt-1">{t(cat.descKey)}</p>
            </div>
          </button>
        ))}
      </div>

      {errors.category && (
        <p className="text-sm text-error">{errors.category}</p>
      )}
    </div>
  );
}
