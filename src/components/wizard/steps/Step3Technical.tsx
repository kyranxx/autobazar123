import { useTranslations } from "next-intl";
import { WizardStepProps } from "@/types/wizard";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/shadcn/button";
import { LISTING_LIMITS } from "@/lib/validation/listings";

function ChoiceButton({
  selected,
  onClick,
  children,
  testId,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <Button
      type="button"
      data-testid={testId}
      variant={selected ? "default" : "secondary"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-auto px-4 py-2.5 text-sm font-medium transition-all",
        selected
          ? "bg-accent text-accent-foreground hover:bg-accent-hover"
          : "text-primary hover:bg-surface-hover",
      )}
    >
      {children}
    </Button>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background-secondary p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      <p className="mt-1 text-xs text-secondary">{description}</p>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

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
        <h2 className="mb-2 text-xl font-semibold text-primary">{t("technicalData")}</h2>
        <p className="text-secondary">{t("engineSpecs")}</p>
      </div>

      <SectionCard
        title={t("powertrainSectionTitle")}
        description={t("powertrainSectionDescription")}
      >
        <FormField label={t("fuelType")} required error={errors.fuel}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {fuelOptions.map((opt) => (
              <ChoiceButton
                key={opt.value}
                selected={formData.fuel === opt.value}
                onClick={() => updateFormData("fuel", opt.value)}
                testId={`listing-fuel-${opt.value}`}
              >
                {tFuel(opt.labelKey)}
              </ChoiceButton>
            ))}
          </div>
        </FormField>

        {formData.fuel !== "electric" && (
          <FormField label={t("gearbox")} required error={errors.transmission}>
            <div className="grid grid-cols-2 gap-2">
              {transmissionOptions.map((opt) => (
                <ChoiceButton
                  key={opt.value}
                  selected={formData.transmission === opt.value}
                  onClick={() => updateFormData("transmission", opt.value)}
                  testId={`listing-transmission-${opt.value}`}
                >
                  {tTransmission(opt.labelKey)}
                </ChoiceButton>
              ))}
            </div>
          </FormField>
        )}
      </SectionCard>

      <SectionCard
        title={t("bodyDriveSectionTitle")}
        description={t("bodyDriveSectionDescription")}
      >
        <FormField label={t("bodyStyle")}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {bodyOptions.map((opt) => (
              <ChoiceButton
                key={opt.value}
                selected={formData.body_style === opt.value}
                onClick={() => updateFormData("body_style", opt.value)}
                testId={`listing-body-${opt.value}`}
              >
                {tBody(opt.labelKey)}
              </ChoiceButton>
            ))}
          </div>
        </FormField>

        <FormField label={t("driveType")}>
          <div className="grid grid-cols-3 gap-2">
            {driveOptions.map((opt) => (
              <ChoiceButton
                key={opt.value}
                selected={formData.drive_type === opt.value}
                onClick={() => updateFormData("drive_type", opt.value)}
              >
                {t(opt.labelKey)}
              </ChoiceButton>
            ))}
          </div>
        </FormField>
      </SectionCard>

      <SectionCard
        title={t("mileagePowerSectionTitle")}
        description={t("mileagePowerSectionDescription")}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label={t("mileage")} required error={errors.mileage_km}>
            <div className="relative">
              <input
                type="number"
                data-testid="listing-mileage"
                value={formData.mileage_km}
                onChange={(e) => updateFormData("mileage_km", parseInt(e.target.value, 10) || "")}
                placeholder="0"
                min={LISTING_LIMITS.mileageMin}
                max={LISTING_LIMITS.mileageMax}
                className="form-input pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">km</span>
            </div>
          </FormField>

          <FormField label={t("power")}>
            <div className="relative">
              <input
                type="number"
                value={formData.power_kw}
                onChange={(e) => updateFormData("power_kw", parseInt(e.target.value, 10) || "")}
                placeholder="0"
                min={LISTING_LIMITS.powerKwMin}
                max={LISTING_LIMITS.powerKwMax}
                className="form-input pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">kW</span>
            </div>
          </FormField>

          {formData.fuel !== "electric" && (
            <FormField label={t("engineVolume")} className="sm:col-span-2">
              <div className="relative">
                <input
                  type="number"
                  value={formData.engine_volume_cm3}
                  onChange={(e) =>
                    updateFormData("engine_volume_cm3", parseInt(e.target.value, 10) || "")
                  }
                  placeholder="0"
                  min={LISTING_LIMITS.engineVolumeMin}
                  max={LISTING_LIMITS.engineVolumeMax}
                  className="form-input pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">cm3</span>
              </div>
            </FormField>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t("appearanceSectionTitle")}
        description={t("appearanceSectionDescription")}
      >
        <FormField label={t("color")}>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => updateFormData("color", e.target.value)}
            placeholder={t("selectColor")}
            maxLength={LISTING_LIMITS.colorMaxLength}
            className="form-input"
          />
        </FormField>
      </SectionCard>
    </div>
  );
}
