"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { uploadImageToCloudflare } from "@/utils/upload";
import { AdFormData } from "@/types/wizard";
import { LockIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BRANDS, MODELS } from "@/config/cars";
import { INITIAL_FORM_DATA, EQUIPMENT_OPTIONS, STEPS } from "@/components/wizard/constants";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { Step1Category } from "@/components/wizard/steps/Step1Category";
import { Step2Vehicle } from "@/components/wizard/steps/Step2Vehicle";
import { Step3Technical } from "@/components/wizard/steps/Step3Technical";
import { Step4Details } from "@/components/wizard/steps/Step4Details";
import { Step5PhotosPrice } from "@/components/wizard/steps/Step5PhotosPrice";

export default function AdWizardClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<AdFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const t = useTranslations("addListing");
    const tAuth = useTranslations("auth");
    const tCommon = useTranslations("common");

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
                    <p className="text-secondary mb-6">
                        {tAuth("createFreeAccount")}
                    </p>
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

    if (loading) {
        return (
            <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface" />
                    <div className="h-4 w-32 rounded bg-surface" />
                </div>
            </main>
        );
    }

    const updateFormData = <K extends keyof AdFormData>(
        key: K,
        value: AdFormData[K]
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
                if (!formData.transmission) newErrors.transmission = t("errorSelectTransmission");
                if (!formData.mileage_km) newErrors.mileage_km = t("errorEnterMileage");
                break;
            case 4:
                if (!formData.location_city) newErrors.location_city = t("errorEnterCity");
                break;
            case 5:
                if (!formData.price_eur) newErrors.price_eur = t("errorEnterPrice");
                if (formData.photoUrls.length === 0) newErrors.photos = t("errorAddPhoto");
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

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;
        if (!user) return;

        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // Upload photos to Cloudflare Images
            const photoUrls: string[] = [];
            for (let i = 0; i < formData.photos.length; i++) {
                try {
                    const photo = formData.photos[i];
                    const publicUrl = await uploadImageToCloudflare(photo);
                    photoUrls.push(publicUrl);
                } catch (error) {
                    console.error("Photo upload error:", error);
                    continue;
                }
            }

            // Create the ad in database
            const { data: adData, error: adError } = await supabase
                .from("ads")
                .insert({
                    seller_id: user.id,
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
                    status: "active",
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                })
                .select()
                .single();

            if (adError) {
                throw adError;
            }

            // Deduct 1 credit from user
            await supabase.rpc("deduct_credit", { amount: 1 });

            // Redirect to success
            router.push(`/auto/${adData.id}?created=true`);
        } catch (error) {
            console.error("Error creating ad:", error);
            setErrors({ submit: "Nastala chyba pri vytváraní inzerátu. Skúste to znova." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPhotos = Array.from(files);
        const newUrls = newPhotos.map((file) => URL.createObjectURL(file));

        setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, ...newPhotos],
            photoUrls: [...prev.photoUrls, ...newUrls],
        }));
    };

    const removePhoto = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
            photoUrls: prev.photoUrls.filter((_, i) => i !== index),
        }));
    };

    const toggleEquipment = (item: string) => {
        setFormData((prev) => ({
            ...prev,
            equipment: prev.equipment.includes(item)
                ? prev.equipment.filter((e) => e !== item)
                : [...prev.equipment, item],
        }));
    };

    return (
        <main className="pt-24 pb-16 min-h-screen">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="py-8 text-center">
                    <h1 className="text-2xl font-bold text-primary sm:text-3xl">
                        {t("title")}
                    </h1>
                    <p className="mt-2 text-secondary">
                        {t("subtitle")}
                    </p>
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
                                        <span>{tCommon("processing")}...</span>
                                    </>
                                ) : currentStep === 5 ? (
                                    <>
                                        {t("submit")}
                                        <div className="px-2 py-0.5 rounded bg-white/20 text-xs font-bold">
                                            1 {t("credit")}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {tCommon("continue")}
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
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium">{errors.submit}</p>
                    </div>
                )}
            </div>
        </main>
    );
}
