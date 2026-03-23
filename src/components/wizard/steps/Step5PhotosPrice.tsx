import Image from "next/image";
import { useTranslations } from "next-intl";
import { WizardStepProps } from "@/types/wizard";
import { FormField } from "@/components/ui/FormField";
import { CameraIcon } from "@/components/ui/Icons";
import { LISTING_LIMITS } from "@/lib/validation/listings";

interface Step5Props extends WizardStepProps {
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  equipmentOptions: { groupKey: string; items: string[] }[];
  toggleEquipment: (item: string) => void;
  showPublishPrice?: boolean;
}

export function Step5PhotosPrice({
  formData,
  updateFormData,
  errors,
  handlePhotoUpload,
  removePhoto,
  equipmentOptions,
  toggleEquipment,
  showPublishPrice = true,
}: Step5Props) {
  const t = useTranslations("addListing");
  const tEquipment = useTranslations("equipment");

  return (
    <div className="space-y-8">
      {/* Photos */}
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">
          {t("photos")}
        </h2>
        <p className="text-secondary mb-4">{t("photosSubtitle")}</p>

        {errors.photos && (
          <p className="mb-4 text-sm text-error">{errors.photos}</p>
        )}

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {formData.photoUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border group"
            >
              <Image
                src={url}
                alt={`Foto ${index + 1}`}
                fill
                sizes="(max-width: 768px) 33vw, 20vw"
                className="object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                  {t("mainPhoto")}
                </span>
              )}
            </div>
          ))}

          {formData.photoUrls.length < LISTING_LIMITS.maxPhotos && (
            <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-accent cursor-pointer flex flex-col items-center justify-center gap-2 text-secondary hover:text-accent transition-colors">
              <CameraIcon className="w-8 h-8" />
              <span className="text-xs">{t("addPhoto")}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>
          )}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">
          {t("equipment")}
        </h2>
        <p className="text-secondary mb-4">{t("equipmentSubtitle")}</p>

        <div className="space-y-4">
          {equipmentOptions.map((group) => (
            <div key={group.groupKey}>
              <p className="text-sm font-medium text-secondary mb-2">
                {t(group.groupKey)}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleEquipment(item)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      formData.equipment.includes(item)
                        ? "bg-accent text-white"
                        : "bg-surface text-primary hover:bg-surface-hover"
                    }`}
                  >
                    {tEquipment(item)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">
          {t("price")}
        </h2>

        <FormField label={t("sellingPrice")} required error={errors.price_eur}>
          <div className="relative">
            <input
              type="number"
              value={formData.price_eur}
              onChange={(e) =>
                updateFormData("price_eur", parseInt(e.target.value) || "")
              }
              placeholder="0"
              min={LISTING_LIMITS.priceMin}
              max={LISTING_LIMITS.priceMax}
              className="form-input pr-12 text-xl font-bold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary font-bold">
              €
            </span>
          </div>
        </FormField>
      </div>

      {/* Summary Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border">
        <h3 className="font-semibold text-primary mb-4">{t("summary")}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary">{t("vehicle")}:</span>
            <span className="font-medium text-primary">
              {formData.brand} {formData.model} {formData.generation}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">{t("year")}:</span>
            <span className="font-medium text-primary">
              {formData.year || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">{t("kilometers")}:</span>
            <span className="font-medium text-primary">
              {formData.mileage_km
                ? `${Number(formData.mileage_km).toLocaleString("sk-SK")} km`
                : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">{t("photos")}:</span>
            <span className="font-medium text-primary">
              {formData.photoUrls.length}
            </span>
          </div>
          <hr className="border-border my-3" />
          <div className="flex justify-between text-lg">
            <span className="font-semibold text-primary">{t("price")}:</span>
            <span className="font-bold text-accent">
              {formData.price_eur
                ? `${Number(formData.price_eur).toLocaleString("sk-SK")} €`
                : "-"}
            </span>
          </div>
        </div>
        {showPublishPrice && (
          <div className="mt-4 p-4 rounded-xl bg-accent/10 text-center">
            <p className="text-sm text-secondary">{t("publishPrice")}</p>
            <p className="text-2xl font-bold text-accent">{t("oneCredit")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
