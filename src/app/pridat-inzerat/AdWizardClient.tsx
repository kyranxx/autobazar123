"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { uploadImageToCloudflare } from "@/utils/upload";
import { AdFormData } from "@/types/wizard";
import {
  LockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/Icons";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BRANDS, MODELS } from "@/config/cars";
import {
  INITIAL_FORM_DATA,
  EQUIPMENT_OPTIONS,
  STEPS,
} from "@/components/wizard/constants";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { Step1Category } from "@/components/wizard/steps/Step1Category";
import { Step2Vehicle } from "@/components/wizard/steps/Step2Vehicle";
import { Step3Technical } from "@/components/wizard/steps/Step3Technical";
import { Step4Details } from "@/components/wizard/steps/Step4Details";
import { Step5PhotosPrice } from "@/components/wizard/steps/Step5PhotosPrice";

type AdWizardMode = "create" | "edit";

interface AdWizardClientProps {
  mode?: AdWizardMode;
  adId?: string;
}

export default function AdWizardClient({
  mode = "create",
  adId,
}: AdWizardClientProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AdFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("addListing");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const isEditMode = mode === "edit";
  const [isAdLoading, setIsAdLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [photoFilesByUrl, setPhotoFilesByUrl] = useState<
    Record<string, File>
  >({});

  useEffect(() => {
    if (!isEditMode) return;
    if (loading) return;
    if (!user) return;

    if (!adId) {
      setLoadError(tErrors("notFound"));
      setIsAdLoading(false);
      return;
    }

    const fetchAd = async () => {
      setIsAdLoading(true);
      setLoadError(null);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("ads")
          .select("*, brands(name), models(name)")
          .eq("id", adId)
          .single();

        if (error || !data) {
          setLoadError(tErrors("notFound"));
          return;
        }

        if (data.seller_id !== user.id) {
          setLoadError(tErrors("unauthorized"));
          return;
        }

        const brandName = data.brands?.name ?? data.brand ?? "";
        const modelName = data.models?.name ?? data.model ?? "";
        const matchedBrand = BRANDS.find((brand) => brand.name === brandName);
        const mappedBrandId = matchedBrand?.id ?? data.brand_id ?? "";
        const mappedModelId = mappedBrandId
          ? MODELS[mappedBrandId]?.find((model) => model.name === modelName)
              ?.id ??
            data.model_id ??
            ""
          : data.model_id ?? "";

        const parseNumber = (value: unknown) =>
          typeof value === "number" && !Number.isNaN(value) ? value : "";

        setFormData({
          ...INITIAL_FORM_DATA,
          category: data.body_style === "commercial" ? "commercial" : "personal",
          brand_id: mappedBrandId,
          model_id: mappedModelId,
          brand: brandName,
          model: modelName,
          generation: data.generation ?? "",
          year: parseNumber(data.year),
          vin: data.vin ?? "",
          fuel: data.fuel ?? "",
          transmission: data.transmission ?? "",
          body_style: data.body_style ?? "",
          power_kw: parseNumber(data.power_kw),
          engine_volume_cm3: parseNumber(data.engine_volume_cm3),
          mileage_km: parseNumber(data.mileage_km),
          drive_type: data.drive_type ?? "",
          color: data.color ?? "",
          is_bought_in_sk: Boolean(data.is_bought_in_sk),
          is_vat_deductible: Boolean(data.is_vat_deductible),
          has_service_book: Boolean(data.has_service_book),
          full_service_history: Boolean(data.full_service_history),
          originality_check: Boolean(data.originality_check),
          garage_kept: Boolean(data.garage_kept),
          not_crashed: Boolean(data.not_crashed),
          is_imported: Boolean(data.is_imported),
          stk_valid_until: data.stk_valid_until ?? "",
          description: data.description ?? "",
          location_city: data.location_city ?? "",
          location_district: data.location_district ?? "",
          photos: [],
          photoUrls: Array.isArray(data.photos_json) ? data.photos_json : [],
          equipment: Array.isArray(data.equipment_json)
            ? data.equipment_json
            : [],
          price_eur: parseNumber(data.price_eur),
        });
        setErrors({});
        setPhotoFilesByUrl({});
        setCurrentStep(1);
      } catch (err) {
        console.error("Error loading ad:", err);
        setLoadError(tErrors("generic"));
      } finally {
        setIsAdLoading(false);
      }
    };

    fetchAd();
  }, [adId, isEditMode, loading, tErrors, user]);

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <LockIcon className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            {tAuth("loginToAdd")}
          </h1>
          <p className="text-secondary mb-6">{tAuth("createFreeAccount")}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
            >
              {tCommon("login")}
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-3 rounded-full border border-border text-primary font-semibold hover:bg-surface"
            >
              {tAuth("createAccount")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading || isAdLoading) {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface" />
          <div className="h-4 w-32 rounded bg-surface" />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">
            {tCommon("error")}
          </h1>
          <p className="text-secondary mb-6">{loadError}</p>
          <Link
            href="/moj-ucet?tab=ads"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
          >
            {tCommon("back")}
          </Link>
        </div>
      </main>
    );
  }

  const updateFormData = <K extends keyof AdFormData>(
    key: K,
    value: AdFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.category) {
          newErrors.category = t("errorSelectCategory");
        }
        break;
      case 2:
        if (!formData.brand) newErrors.brand = t("errorSelectBrand");
        if (!formData.model) newErrors.model = t("errorSelectModel");
        if (!formData.year) newErrors.year = t("errorEnterYear");
        break;
      case 3:
        if (!formData.fuel) newErrors.fuel = t("errorSelectFuel");
        if (!formData.transmission)
          newErrors.transmission = t("errorSelectTransmission");
        if (!formData.mileage_km) newErrors.mileage_km = t("errorEnterMileage");
        break;
      case 4:
        if (!formData.location_city)
          newErrors.location_city = t("errorEnterCity");
        break;
      case 5:
        if (!formData.price_eur) newErrors.price_eur = t("errorEnterPrice");
        if (formData.photoUrls.length === 0)
          newErrors.photos = t("errorAddPhoto");
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isBlobUrl = (url: string) => url.startsWith("blob:");

  const resolvePhotoUrls = async () => {
    const resolved: string[] = [];
    for (const url of formData.photoUrls) {
      if (isBlobUrl(url)) {
        const file = photoFilesByUrl[url];
        if (!file) continue;
        try {
          const publicUrl = await uploadImageToCloudflare(file);
          resolved.push(publicUrl);
        } catch (error) {
          console.error("Photo upload error:", error);
        }
      } else {
        resolved.push(url);
      }
    }
    return resolved;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    if (!user) return;
    if (isEditMode && !adId) {
      setErrors({ submit: tErrors("notFound") });
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const photoUrls = await resolvePhotoUrls();

      if (photoUrls.length === 0) {
        setErrors({ photos: t("errorAddPhoto") });
        return;
      }

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from("ads")
          .update({
            brand_id: formData.brand_id || null,
            model_id: formData.model_id || null,
            brand: formData.brand || null,
            model: formData.model || null,
            generation: formData.generation || null,
            year: formData.year || null,
            price_eur: formData.price_eur || null,
            mileage_km: formData.mileage_km || null,
            fuel: formData.fuel || null,
            transmission: formData.transmission || null,
            body_style: formData.body_style || null,
            power_kw: formData.power_kw || null,
            engine_volume_cm3: formData.engine_volume_cm3 || null,
            drive_type: formData.drive_type || null,
            color: formData.color || null,
            location_city: formData.location_city || null,
            location_district: formData.location_district || null,
            description: formData.description || null,
            vin: formData.vin || null,
            is_bought_in_sk: formData.is_bought_in_sk,
            is_vat_deductible: formData.is_vat_deductible,
            has_service_book: formData.has_service_book,
            full_service_history: formData.full_service_history,
            originality_check: formData.originality_check,
            garage_kept: formData.garage_kept,
            not_crashed: formData.not_crashed,
            is_imported: formData.is_imported,
            stk_valid_until: formData.stk_valid_until || null,
            photos_json: photoUrls,
            equipment_json: formData.equipment,
            updated_at: new Date().toISOString(),
          })
          .eq("id", adId);

        if (updateError) {
          throw updateError;
        }

        router.push(`/auto/${adId}?updated=true`);
        return;
      }

      // Use atomic RPC function to publish ad and deduct credits
      const { data: result, error: publishError } = await supabase.rpc(
        "publish_ad_with_credits",
        {
          p_user_id: user.id,
          p_ad_data: {
            brand_id: formData.brand_id || null,
            model_id: formData.model_id || null,
            year: formData.year || null,
            price_eur: formData.price_eur || null,
            mileage_km: formData.mileage_km || null,
            fuel: formData.fuel || null,
            transmission: formData.transmission || null,
            body_style: formData.body_style || null,
            power_kw: formData.power_kw || null,
            engine_volume_cm3: formData.engine_volume_cm3 || null,
            drive_type: formData.drive_type || null,
            color: formData.color || null,
            location_city: formData.location_city || null,
            location_district: formData.location_district || null,
            description: formData.description || null,
            vin: formData.vin || null,
            is_bought_in_sk: formData.is_bought_in_sk,
            is_vat_deductible: formData.is_vat_deductible,
            has_service_book: formData.has_service_book,
            full_service_history: formData.full_service_history,
            originality_check: formData.originality_check,
            garage_kept: formData.garage_kept,
            not_crashed: formData.not_crashed,
            stk_valid_until: formData.stk_valid_until || null,
            photos_json: photoUrls,
            equipment_json: formData.equipment,
          },
        },
      );

      if (publishError) {
        throw publishError;
      }

      if (!result.success) {
        setErrors({
          submit: tErrors("notEnoughCredits", { amount: result.required }),
        });
        return;
      }

      // Redirect to success
      router.push(`/auto/${result.ad_id}?created=true`);
    } catch (error) {
      console.error(
        isEditMode ? "Error updating ad:" : "Error creating ad:",
        error,
      );
      setErrors({
        submit: isEditMode ? tErrors("generic") : t("errorCreating"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files);
    const newUrls = newPhotos.map((file) => URL.createObjectURL(file));

    setPhotoFilesByUrl((prev) => {
      const next = { ...prev };
      newPhotos.forEach((file, index) => {
        next[newUrls[index]] = file;
      });
      return next;
    });

    setFormData((prev) => ({
      ...prev,
      photoUrls: [...prev.photoUrls, ...newUrls],
    }));
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => {
      const urlToRemove = prev.photoUrls[index];
      if (urlToRemove && isBlobUrl(urlToRemove)) {
        setPhotoFilesByUrl((current) => {
          if (!current[urlToRemove]) return current;
          const next = { ...current };
          delete next[urlToRemove];
          return next;
        });
        URL.revokeObjectURL(urlToRemove);
      }

      return {
        ...prev,
        photoUrls: prev.photoUrls.filter((_, i) => i !== index),
      };
    });
  };

  const toggleEquipment = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter((e) => e !== item)
        : [...prev.equipment, item],
    }));
  };

  const submitLabel = isEditMode ? tCommon("save") : t("publish");

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8 text-center">
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-secondary">{t("subtitle")}</p>
        </div>

        {/* Progress Steps */}
        <WizardProgress
          currentStep={currentStep}
          steps={STEPS}
          onStepClick={setCurrentStep}
        />

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-background overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Step 1: Category */}
            {currentStep === 1 && (
              <Step1Category
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
              />
            )}

            {/* Step 2: Vehicle */}
            {currentStep === 2 && (
              <Step2Vehicle
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
                brands={BRANDS}
                models={MODELS}
              />
            )}

            {/* Step 3: Technical */}
            {currentStep === 3 && (
              <Step3Technical
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
              />
            )}

            {/* Step 4: Details */}
            {currentStep === 4 && (
              <Step4Details
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
              />
            )}

            {/* Step 5: Photos & Price */}
            {currentStep === 5 && (
              <Step5PhotosPrice
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
                handlePhotoUpload={handlePhotoUpload}
                removePhoto={removePhoto}
                equipmentOptions={EQUIPMENT_OPTIONS}
                toggleEquipment={toggleEquipment}
                showPublishPrice={!isEditMode}
              />
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-primary font-medium hover:bg-surface transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  {tCommon("back")}
                </button>
              ) : (
                <div /> /* Spacer */
              )}

              <button
                onClick={currentStep === 5 ? handleSubmit : handleNext}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-white font-semibold transition-all hover:bg-accent-hover disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-accent/25"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="w-5 h-5" />
                    <span>{t("processing")}...</span>
                  </>
                ) : currentStep === 5 ? (
                  <>{submitLabel}</>
                ) : (
                  <>
                    {t("continue")}
                    <ChevronRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {errors.submit && (
          <div className="mt-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error">
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-medium">{errors.submit}</p>
          </div>
        )}
      </div>
    </main>
  );
}
