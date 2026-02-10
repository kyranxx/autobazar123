import { useTranslations } from "next-intl";
import { WizardStepProps } from "@/types/wizard";
import { FormField } from "@/components/ui/FormField";
import { ChipButton } from "@/components/ui/ChipButton";

export function Step3Technical({
  formData,
  updateFormData,
  errors,
}: WizardStepProps) {
  const t = useTranslations("addListing");
  const tFuel = useTranslations("fuel");
  const tTransmission = useTranslations("transmission");
  const tBody = useTranslations("bodyType");

  const fuelOptions = [
    { value: "petrol", labelKey: "petrol" },
    { value: "diesel", labelKey: "diesel" },
    { value: "electric", labelKey: "electric" },
    { value: "hybrid", labelKey: "hybrid" },
    { value: "lpg", labelKey: "lpg" },
    { value: "cng", labelKey: "cng" },
  ];

  const transmissionOptions = [
    { value: "manual", labelKey: "manual" },
    { value: "automatic", labelKey: "automatic" },
  ];

  const bodyOptions = [
    { value: "sedan", labelKey: "sedan" },
    { value: "combi", labelKey: "combi" },
    { value: "suv", labelKey: "suv" },
    { value: "hatchback", labelKey: "hatchback" },
    { value: "coupe", labelKey: "coupe" },
    { value: "cabriolet", labelKey: "cabriolet" },
    { value: "mpv", labelKey: "mpv" },
    { value: "pickup", labelKey: "pickup" },
  ];

  const driveOptions = [
    { value: "FWD", labelKey: "frontDrive" },
    { value: "RWD", labelKey: "rearDrive" },
    { value: "AWD", labelKey: "allWheelDrive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">
          {t("technicalData")}
        </h2>
        <p className="text-secondary">{t("engineSpecs")}</p>
      </div>

      {/* Fuel Type */}
      <FormField label={t("fuelType")} required error={errors.fuel}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {fuelOptions.map((opt) => (
            <ChipButton
              key={opt.value}
              selected={formData.fuel === opt.value}
              onClick={() => updateFormData("fuel", opt.value)}
            >
              {tFuel(opt.labelKey)}
            </ChipButton>
          ))}
        </div>
      </FormField>

      {/* Transmission - Hide if electric */}
      {formData.fuel !== "electric" && (
        <FormField label={t("gearbox")} required error={errors.transmission}>
          <div className="grid grid-cols-2 gap-2">
            {transmissionOptions.map((opt) => (
              <ChipButton
                key={opt.value}
                selected={formData.transmission === opt.value}
                onClick={() => updateFormData("transmission", opt.value)}
              >
                {tTransmission(opt.labelKey)}
              </ChipButton>
            ))}
          </div>
        </FormField>
      )}

      {/* Body Style */}
      <FormField label={t("bodyStyle")}>
        <div className="grid grid-cols-4 gap-2">
          {bodyOptions.map((opt) => (
            <ChipButton
              key={opt.value}
              selected={formData.body_style === opt.value}
              onClick={() => updateFormData("body_style", opt.value)}
            >
              {tBody(opt.labelKey)}
            </ChipButton>
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label={t("mileage")} required error={errors.mileage_km}>
          <div className="relative">
            <input
              type="number"
              value={formData.mileage_km}
              onChange={(e) =>
                updateFormData("mileage_km", parseInt(e.target.value) || "")
              }
              placeholder="0"
              className="form-input pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">
              km
            </span>
          </div>
        </FormField>

        <FormField label={t("power")}>
          <div className="relative">
            <input
              type="number"
              value={formData.power_kw}
              onChange={(e) =>
                updateFormData("power_kw", parseInt(e.target.value) || "")
              }
              placeholder="0"
              className="form-input pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">
              kW
            </span>
          </div>
        </FormField>

        {formData.fuel !== "electric" && (
          <FormField label={t("engineVolume")}>
            <div className="relative">
              <input
                type="number"
                value={formData.engine_volume_cm3}
                onChange={(e) =>
                  updateFormData(
                    "engine_volume_cm3",
                    parseInt(e.target.value) || "",
                  )
                }
                placeholder="0"
                className="form-input pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">
                cm³
              </span>
            </div>
          </FormField>
        )}

        <FormField label={t("driveType")}>
          <div className="grid grid-cols-3 gap-2">
            {driveOptions.map((opt) => (
              <ChipButton
                key={opt.value}
                selected={formData.drive_type === opt.value}
                onClick={() => updateFormData("drive_type", opt.value)}
              >
                {t(opt.labelKey)}
              </ChipButton>
            ))}
          </div>
        </FormField>

        <FormField label={t("color")} className="sm:col-span-2">
          <input
            type="text"
            value={formData.color}
            onChange={(e) => updateFormData("color", e.target.value)}
            placeholder={t("selectColor")}
            className="form-input"
          />
        </FormField>
      </div>
    </div>
  );
}
