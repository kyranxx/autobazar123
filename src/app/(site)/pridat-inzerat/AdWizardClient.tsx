"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { uploadImageToCloudflare } from "@/utils/upload";
import { AdFormData } from "@/types/wizard";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
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
type WizardErrors = Record<string, string>;
const LISTING_DRAFT_STORAGE_PREFIX = "ab123_listing_draft_v1";
const LISTING_DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 7;

interface AdWizardClientProps {
  mode?: AdWizardMode;
  adId?: string;
  embedded?: boolean;
}

interface WizardState {
  currentStep: number;
  formData: AdFormData;
  errors: WizardErrors;
  isSubmitting: boolean;
  isAdLoading: boolean;
  loadError: string | null;
  photoFilesByUrl: Record<string, File>;
}

interface ListingDraftPayload {
  savedAt: string;
  currentStep: number;
  formData: AdFormData;
}

type WizardAction =
  | { type: "setStep"; step: number }
  | { type: "nextStep" }
  | { type: "previousStep" }
  | { type: "setErrors"; errors: WizardErrors }
  | { type: "setSubmitting"; isSubmitting: boolean }
  | { type: "setSubmitError"; message: string }
  | { type: "hydrateFromDraft"; formData: AdFormData; currentStep: number }
  | { type: "startAdLoad" }
  | { type: "failAdLoad"; message: string }
  | { type: "hydrateFromAd"; formData: AdFormData }
  | {
      type: "updateField";
      key: keyof AdFormData;
      value: AdFormData[keyof AdFormData];
    }
  | {
      type: "appendPhotos";
      newUrls: string[];
      filesByUrl: Record<string, File>;
    }
  | { type: "removePhoto"; index: number; url: string }
  | { type: "toggleEquipment"; item: string };

function createInitialWizardState(isEditMode: boolean): WizardState {
  return {
    currentStep: 1,
    formData: INITIAL_FORM_DATA,
    errors: {},
    isSubmitting: false,
    isAdLoading: isEditMode,
    loadError: null,
    photoFilesByUrl: {},
  };
}

function getDraftStorageKey(userId: string): string {
  return `${LISTING_DRAFT_STORAGE_PREFIX}:${userId}`;
}

function hasMeaningfulDraftData(formData: AdFormData): boolean {
  return Boolean(
    formData.brand ||
      formData.model ||
      formData.year ||
      formData.price_eur ||
      formData.mileage_km ||
      formData.location_city ||
      formData.description.trim() ||
      formData.photoUrls.length > 0,
  );
}

function parseListingDraftPayload(raw: string | null): ListingDraftPayload | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ListingDraftPayload>;
    if (
      typeof parsed?.savedAt !== "string" ||
      typeof parsed?.currentStep !== "number" ||
      !parsed?.formData
    ) {
      return null;
    }

    const savedAtMs = Date.parse(parsed.savedAt);
    if (Number.isNaN(savedAtMs)) {
      return null;
    }

    if (Date.now() - savedAtMs > LISTING_DRAFT_TTL_MS) {
      return null;
    }

    const mergedFormData: AdFormData = {
      ...INITIAL_FORM_DATA,
      ...parsed.formData,
      photoUrls: Array.isArray(parsed.formData.photoUrls)
        ? parsed.formData.photoUrls.filter(
            (url): url is string =>
              typeof url === "string" && !url.startsWith("blob:"),
          )
        : [],
      equipment: Array.isArray(parsed.formData.equipment)
        ? parsed.formData.equipment.filter((item): item is string => typeof item === "string")
        : [],
    };

    return {
      savedAt: parsed.savedAt,
      currentStep: parsed.currentStep,
      formData: mergedFormData,
    };
  } catch {
    return null;
  }
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "setStep":
      return {
        ...state,
        currentStep: action.step,
      };
    case "nextStep":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 5),
      };
    case "previousStep":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      };
    case "setErrors":
      return {
        ...state,
        errors: action.errors,
      };
    case "setSubmitting":
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      };
    case "setSubmitError":
      return {
        ...state,
        errors: { ...state.errors, submit: action.message },
      };
    case "hydrateFromDraft":
      return {
        ...state,
        currentStep: Math.min(Math.max(action.currentStep, 1), 5),
        formData: action.formData,
        errors: {},
        isAdLoading: false,
        loadError: null,
        photoFilesByUrl: {},
      };
    case "startAdLoad":
      return {
        ...state,
        isAdLoading: true,
        loadError: null,
      };
    case "failAdLoad":
      return {
        ...state,
        isAdLoading: false,
        loadError: action.message,
      };
    case "hydrateFromAd":
      return {
        ...state,
        currentStep: 1,
        formData: action.formData,
        errors: {},
        isAdLoading: false,
        loadError: null,
        photoFilesByUrl: {},
      };
    case "updateField": {
      const nextErrors = { ...state.errors };
      delete nextErrors[action.key];

      return {
        ...state,
        formData: {
          ...state.formData,
          [action.key]: action.value,
        },
        errors: nextErrors,
      };
    }
    case "appendPhotos":
      return {
        ...state,
        formData: {
          ...state.formData,
          photoUrls: [...state.formData.photoUrls, ...action.newUrls],
        },
        photoFilesByUrl: {
          ...state.photoFilesByUrl,
          ...action.filesByUrl,
        },
      };
    case "removePhoto": {
      const nextPhotoFilesByUrl = { ...state.photoFilesByUrl };
      delete nextPhotoFilesByUrl[action.url];

      return {
        ...state,
        formData: {
          ...state.formData,
          photoUrls: state.formData.photoUrls.filter(
            (_, index) => index !== action.index,
          ),
        },
        photoFilesByUrl: nextPhotoFilesByUrl,
      };
    }
    case "toggleEquipment":
      return {
        ...state,
        formData: {
          ...state.formData,
          equipment: state.formData.equipment.includes(action.item)
            ? state.formData.equipment.filter((item) => item !== action.item)
            : [...state.formData.equipment, action.item],
        },
      };
    default:
      return state;
  }
}

function parseNumber(value: unknown) {
  return typeof value === "number" && !Number.isNaN(value) ? value : "";
}

function mapAdDataToFormData(data: Record<string, unknown>): AdFormData {
  const brandName =
    (data.brands as { name?: string } | null | undefined)?.name ??
    (data.brand as string) ??
    "";
  const modelName =
    (data.models as { name?: string } | null | undefined)?.name ??
    (data.model as string) ??
    "";
  const matchedBrand = BRANDS.find((brand) => brand.name === brandName);
  const mappedBrandId = matchedBrand?.id ?? ((data.brand_id as string) || "");
  const mappedModelId = mappedBrandId
    ? MODELS[mappedBrandId]?.find((model) => model.name === modelName)?.id ??
      ((data.model_id as string) || "")
    : ((data.model_id as string) || "");

  return {
    ...INITIAL_FORM_DATA,
    category: data.body_style === "commercial" ? "commercial" : "personal",
    brand_id: mappedBrandId,
    model_id: mappedModelId,
    brand: brandName,
    model: modelName,
    generation: (data.generation as string) ?? "",
    year: parseNumber(data.year),
    vin: "",
    fuel: (data.fuel as string) ?? "",
    transmission: (data.transmission as string) ?? "",
    body_style: (data.body_style as string) ?? "",
    power_kw: parseNumber(data.power_kw),
    engine_volume_cm3: parseNumber(data.engine_volume_cm3),
    mileage_km: parseNumber(data.mileage_km),
    drive_type: (data.drive_type as string) ?? "",
    color: (data.color as string) ?? "",
    is_bought_in_sk: Boolean(data.is_bought_in_sk),
    is_vat_deductible: Boolean(data.is_vat_deductible),
    has_service_book: Boolean(data.has_service_book),
    full_service_history: Boolean(data.full_service_history),
    originality_check: Boolean(data.originality_check),
    garage_kept: Boolean(data.garage_kept),
    not_crashed: Boolean(data.not_crashed),
    is_imported: Boolean(data.is_imported),
    stk_valid_until: (data.warranty_expiration as string) ?? "",
    description: (data.description as string) ?? "",
    location_city: (data.location_city as string) ?? "",
    location_district: (data.location_district as string) ?? "",
    photos: [],
    photoUrls: Array.isArray(data.photos_json)
      ? (data.photos_json as string[])
      : [],
    equipment: Array.isArray(data.equipment_json)
      ? (data.equipment_json as string[])
      : [],
    price_eur: parseNumber(data.price_eur),
  };
}

function buildStepErrors(
  step: number,
  formData: AdFormData,
  t: ReturnType<typeof useTranslations>,
) {
  const nextErrors: WizardErrors = {};

  switch (step) {
    case 1:
      if (!formData.category) nextErrors.category = t("errorSelectCategory");
      break;
    case 2:
      if (!formData.brand) nextErrors.brand = t("errorSelectBrand");
      if (!formData.model) nextErrors.model = t("errorSelectModel");
      if (!formData.year) nextErrors.year = t("errorEnterYear");
      break;
    case 3:
      if (!formData.fuel) nextErrors.fuel = t("errorSelectFuel");
      if (!formData.transmission)
        nextErrors.transmission = t("errorSelectTransmission");
      if (!formData.mileage_km) nextErrors.mileage_km = t("errorEnterMileage");
      break;
    case 4:
      if (!formData.location_city) nextErrors.location_city = t("errorEnterCity");
      break;
    case 5:
      if (!formData.price_eur) nextErrors.price_eur = t("errorEnterPrice");
      if (formData.photoUrls.length === 0) nextErrors.photos = t("errorAddPhoto");
      break;
  }

  return nextErrors;
}

function isBlobUrl(url: string) {
  return url.startsWith("blob:");
}

function AuthRequiredView({
  tAuth,
  tCommon,
}: {
  tAuth: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-lg px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
          <LockIcon className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">{tAuth("loginToAdd")}</h1>
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

function AdLoadingView() {
  return (
    <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-surface" />
        <div className="h-4 w-32 rounded bg-surface" />
      </div>
    </main>
  );
}

function LoadErrorView({
  message,
  tCommon,
}: {
  message: string;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-lg px-4 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">{tCommon("error")}</h1>
        <p className="text-secondary mb-6">{message}</p>
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

function WizardStepContent({
  currentStep,
  formData,
  errors,
  updateFormData,
  handlePhotoUpload,
  removePhoto,
  toggleEquipment,
  isEditMode,
}: {
  currentStep: number;
  formData: AdFormData;
  errors: WizardErrors;
  updateFormData: <K extends keyof AdFormData>(
    key: K,
    value: AdFormData[K],
  ) => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  toggleEquipment: (item: string) => void;
  isEditMode: boolean;
}) {
  if (currentStep === 1) {
    return (
      <Step1Category
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />
    );
  }

  if (currentStep === 2) {
    return (
      <Step2Vehicle
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
        brands={BRANDS}
        models={MODELS}
      />
    );
  }

  if (currentStep === 3) {
    return (
      <Step3Technical
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />
    );
  }

  if (currentStep === 4) {
    return (
      <Step4Details
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />
    );
  }

  return (
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
  );
}

function WizardNavigation({
  currentStep,
  isSubmitting,
  submitLabel,
  t,
  tCommon,
  onBack,
}: {
  currentStep: number;
  isSubmitting: boolean;
  submitLabel: string;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  onBack: () => void;
}) {
  return (
    <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-primary font-medium hover:bg-surface transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          {tCommon("back")}
        </button>
      ) : (
        <div />
      )}

      <button
        type="submit"
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
  );
}

function SubmitErrorBanner({ message }: { message: string }) {
  return (
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
      <p className="font-medium">{message}</p>
    </div>
  );
}

function useAdWizardController({
  mode = "create",
  adId,
}: AdWizardClientProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("addListing");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const isEditMode = mode === "edit";
  const [state, dispatch] = useReducer(
    wizardReducer,
    isEditMode,
    createInitialWizardState,
  );
  const [draftPrompt, setDraftPrompt] = useState<ListingDraftPayload | null>(null);
  const draftStorageKey = useMemo(
    () => (user ? getDraftStorageKey(user.id) : null),
    [user],
  );

  const updateFormData = <K extends keyof AdFormData>(
    key: K,
    value: AdFormData[K],
  ) => {
    dispatch({
      type: "updateField",
      key,
      value,
    });
  };

  useEffect(() => {
    if (!isEditMode) return;
    if (loading) return;
    if (!user) return;

    if (!adId) {
      dispatch({ type: "failAdLoad", message: tErrors("notFound") });
      return;
    }

    let cancelled = false;

    const fetchAd = async () => {
      dispatch({ type: "startAdLoad" });

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("ads")
          .select("*, brands(name), models(name)")
          .eq("id", adId)
          .single();

        if (cancelled) return;

        if (error || !data) {
          dispatch({ type: "failAdLoad", message: tErrors("notFound") });
          return;
        }

        if (data.seller_id !== user.id) {
          dispatch({ type: "failAdLoad", message: tErrors("unauthorized") });
          return;
        }

        dispatch({
          type: "hydrateFromAd",
          formData: mapAdDataToFormData(data as Record<string, unknown>),
        });
      } catch (error) {
        console.error("Error loading ad:", error);
        if (!cancelled) {
          dispatch({ type: "failAdLoad", message: tErrors("generic") });
        }
      }
    };

    fetchAd();

    return () => {
      cancelled = true;
    };
  }, [adId, isEditMode, loading, tErrors, user]);

  useEffect(() => {
    if (isEditMode || loading || !draftStorageKey) {
      return;
    }

    const parsedDraft = parseListingDraftPayload(
      window.localStorage.getItem(draftStorageKey),
    );

    if (!parsedDraft || !hasMeaningfulDraftData(parsedDraft.formData)) {
      window.localStorage.removeItem(draftStorageKey);
      return;
    }

    setDraftPrompt(parsedDraft);
  }, [draftStorageKey, isEditMode, loading]);

  useEffect(() => {
    if (
      isEditMode ||
      loading ||
      !draftStorageKey ||
      state.isSubmitting ||
      state.isAdLoading
    ) {
      return;
    }

    if (!hasMeaningfulDraftData(state.formData)) {
      window.localStorage.removeItem(draftStorageKey);
      return;
    }

    const saveTimer = window.setTimeout(() => {
      const payload: ListingDraftPayload = {
        savedAt: new Date().toISOString(),
        currentStep: state.currentStep,
        formData: state.formData,
      };

      window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    }, 450);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [
    draftStorageKey,
    isEditMode,
    loading,
    state.currentStep,
    state.formData,
    state.isAdLoading,
    state.isSubmitting,
  ]);

  const validateStep = (step: number): boolean => {
    const nextErrors = buildStepErrors(step, state.formData, t);
    dispatch({ type: "setErrors", errors: nextErrors });
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(state.currentStep)) {
      dispatch({ type: "nextStep" });
    }
  };

  const handleBack = () => {
    dispatch({ type: "previousStep" });
  };

  const resumeSavedDraft = () => {
    if (!draftPrompt) {
      return;
    }

    dispatch({
      type: "hydrateFromDraft",
      formData: draftPrompt.formData,
      currentStep: draftPrompt.currentStep,
    });
    setDraftPrompt(null);
  };

  const discardSavedDraft = () => {
    if (draftStorageKey) {
      window.localStorage.removeItem(draftStorageKey);
    }
    setDraftPrompt(null);
  };

  const resolvePhotoUrls = async () => {
    const resolved: string[] = [];

    for (const url of state.formData.photoUrls) {
      if (isBlobUrl(url)) {
        const file = state.photoFilesByUrl[url];
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
    if (!validateStep(state.currentStep)) return;
    if (!user) return;

    if (isEditMode && !adId) {
      dispatch({ type: "setSubmitError", message: tErrors("notFound") });
      return;
    }

    dispatch({ type: "setSubmitting", isSubmitting: true });

    try {
      const supabase = createClient();
      const photoUrls = await resolvePhotoUrls();

      if (photoUrls.length === 0) {
        dispatch({
          type: "setErrors",
          errors: { photos: t("errorAddPhoto") },
        });
        return;
      }

      if (isEditMode) {
        const currentAdId = adId;
        if (!currentAdId) {
          throw new Error("Missing ad id for edit mode.");
        }

        const { error: updateError } = await supabase
          .from("ads")
          .update({
            brand_id: state.formData.brand_id || null,
            model_id: state.formData.model_id || null,
            brand: state.formData.brand || null,
            model: state.formData.model || null,
            generation: state.formData.generation || null,
            year: state.formData.year || null,
            price_eur: state.formData.price_eur || null,
            mileage_km: state.formData.mileage_km || null,
            fuel: state.formData.fuel || null,
            transmission: state.formData.transmission || null,
            body_style: state.formData.body_style || null,
            power_kw: state.formData.power_kw || null,
            engine_volume_cm3: state.formData.engine_volume_cm3 || null,
            drive_type: state.formData.drive_type || null,
            color: state.formData.color || null,
            location_city: state.formData.location_city || null,
            location_district: state.formData.location_district || null,
            description: state.formData.description || null,
            is_bought_in_sk: state.formData.is_bought_in_sk,
            is_vat_deductible: state.formData.is_vat_deductible,
            has_service_book: state.formData.has_service_book,
            full_service_history: state.formData.full_service_history,
            originality_check: state.formData.originality_check,
            garage_kept: state.formData.garage_kept,
            not_crashed: state.formData.not_crashed,
            is_imported: state.formData.is_imported,
            warranty_expiration: state.formData.stk_valid_until || null,
            photos_json: photoUrls,
            equipment_json: state.formData.equipment,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentAdId);

        if (updateError) throw updateError;

        router.push("/moj-ucet?tab=ads&updated=1");
        return;
      }

      const { data: result, error: publishError } = await supabase.rpc(
        "publish_ad_with_credits",
        {
          p_ad_data: {
            brand_id: state.formData.brand_id || null,
            model_id: state.formData.model_id || null,
            year: state.formData.year || null,
            price_eur: state.formData.price_eur || null,
            mileage_km: state.formData.mileage_km || null,
            fuel: state.formData.fuel || null,
            transmission: state.formData.transmission || null,
            body_style: state.formData.body_style || null,
            power_kw: state.formData.power_kw || null,
            engine_volume_cm3: state.formData.engine_volume_cm3 || null,
            drive_type: state.formData.drive_type || null,
            color: state.formData.color || null,
            location_city: state.formData.location_city || null,
            location_district: state.formData.location_district || null,
            description: state.formData.description || null,
            is_bought_in_sk: state.formData.is_bought_in_sk,
            is_vat_deductible: state.formData.is_vat_deductible,
            has_service_book: state.formData.has_service_book,
            full_service_history: state.formData.full_service_history,
            originality_check: state.formData.originality_check,
            garage_kept: state.formData.garage_kept,
            not_crashed: state.formData.not_crashed,
            is_imported: state.formData.is_imported,
            warranty_expiration: state.formData.stk_valid_until || null,
            photos_json: photoUrls,
            equipment_json: state.formData.equipment,
          },
        },
      );

      if (publishError) throw publishError;

      if (!result.success) {
        dispatch({
          type: "setSubmitError",
          message: tErrors("notEnoughCredits", { amount: result.required }),
        });
        return;
      }

      if (!result.ad_id) {
        throw new Error("Publish RPC did not return ad_id.");
      }

      trackAnalyticsEvent("listing_created", {
        adId: result.ad_id,
        isDealer:
          typeof window !== "undefined"
          && window.location.pathname.startsWith("/dealer"),
        photosCount: photoUrls.length,
      });

      if (draftStorageKey) {
        window.localStorage.removeItem(draftStorageKey);
      }
      setDraftPrompt(null);

      router.push(
        result.status === "active"
          ? "/moj-ucet?tab=ads&updated=1"
          : "/moj-ucet?tab=ads&submitted=1",
      );
    } catch (error) {
      console.error(
        isEditMode ? "Error updating ad:" : "Error creating ad:",
        error,
      );
      dispatch({
        type: "setSubmitError",
        message: isEditMode ? tErrors("generic") : t("errorCreating"),
      });
    } finally {
      dispatch({ type: "setSubmitting", isSubmitting: false });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files);
    const newUrls = newPhotos.map((file) => URL.createObjectURL(file));
    const filesByUrl = newPhotos.reduce<Record<string, File>>((acc, file, index) => {
      acc[newUrls[index]] = file;
      return acc;
    }, {});

    dispatch({
      type: "appendPhotos",
      newUrls,
      filesByUrl,
    });
  };

  const removePhoto = (index: number) => {
    const urlToRemove = state.formData.photoUrls[index];
    if (!urlToRemove) return;

    dispatch({ type: "removePhoto", index, url: urlToRemove });
    if (isBlobUrl(urlToRemove)) {
      URL.revokeObjectURL(urlToRemove);
    }
  };

  const toggleEquipment = (item: string) => {
    dispatch({ type: "toggleEquipment", item });
  };

  return {
    user,
    loading,
    state,
    t,
    tAuth,
    tCommon,
    isEditMode,
    dispatch,
    updateFormData,
    handlePhotoUpload,
    removePhoto,
    toggleEquipment,
    handleBack,
    handleNext,
    handleSubmit,
    draftPrompt,
    resumeSavedDraft,
    discardSavedDraft,
  };
}

export default function AdWizardClient(props: AdWizardClientProps) {
  const pathname = usePathname();
  const isEditPath = pathname.startsWith("/upravit-inzerat/");
  const fallbackAdId = isEditPath ? pathname.split("/").filter(Boolean).at(-1) : undefined;
  const resolvedProps: AdWizardClientProps = {
    ...props,
    mode: props.mode ?? (isEditPath ? "edit" : "create"),
    adId: props.adId ?? fallbackAdId,
  };

  const {
    user,
    loading,
    state,
    t,
    tAuth,
    tCommon,
    isEditMode,
    dispatch,
    updateFormData,
    handlePhotoUpload,
    removePhoto,
    toggleEquipment,
    handleBack,
    handleNext,
    handleSubmit,
    draftPrompt,
    resumeSavedDraft,
    discardSavedDraft,
  } = useAdWizardController(resolvedProps);

  if (!loading && !user) return <AuthRequiredView tAuth={tAuth} tCommon={tCommon} />;
  if (loading || state.isAdLoading) return <AdLoadingView />;
  if (state.loadError) return <LoadErrorView message={state.loadError} tCommon={tCommon} />;

  const displayEditTitle = "Upravi\u0165 inzer\u00e1t";
  const displayEditSubtitle =
    "Aktualizujte \u00fadaje o vozidle bez vytv\u00e1rania nov\u00e9ho inzer\u00e1tu.";

  const submitLabel = isEditMode ? tCommon("save") : t("publish");
  const pageTitle = isEditMode ? "Upraviť inzerát" : t("title");
  const pageSubtitle = isEditMode
    ? "Aktualizujte údaje o vozidle bez vytvárania nového inzerátu."
    : t("subtitle");

  const resolvedPageTitle = isEditMode ? "Upraviť inzerát" : pageTitle;
  const resolvedPageSubtitle = isEditMode
    ? "Aktualizujte údaje o vozidle bez vytvárania nového inzerátu."
    : pageSubtitle;

  const isEmbedded = Boolean(props.embedded);
  const shellClass = isEmbedded ? "mx-auto max-w-4xl" : "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8";
  const headingClass = isEmbedded ? "hidden" : "py-8 text-center";
  const draftSavedLabel = draftPrompt
    ? new Date(draftPrompt.savedAt).toLocaleString("sk-SK")
    : "";

  const content = (
    <div className={shellClass}>
      <div className={headingClass}>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">
          {isEditMode ? displayEditTitle : resolvedPageTitle}
        </h1>
        <p className="mt-2 text-secondary">
          {isEditMode ? displayEditSubtitle : resolvedPageSubtitle}
        </p>
      </div>

      {!isEditMode && draftPrompt ? (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-subtle p-4">
          <p className="text-sm font-semibold text-text-primary">
            Našli sme rozpracovaný inzerát.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Posledne ulozenie: {draftSavedLabel}. Chcete pokracovat tam, kde ste skoncili?
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={resumeSavedDraft}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              Obnoviť rozpracovaný inzerát
            </button>
            <button
              type="button"
              onClick={discardSavedDraft}
              className="rounded-lg border border-border-strong bg-background px-3 py-2 text-xs font-semibold text-text-primary hover:border-accent hover:text-accent"
            >
              Začať odznova
            </button>
          </div>
        </div>
      ) : null}

      <WizardProgress
        currentStep={state.currentStep}
        steps={STEPS}
        onStepClick={(step) => dispatch({ type: "setStep", step })}
      />

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="p-6 sm:p-8">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (state.currentStep === 5) {
                void handleSubmit();
                return;
              }
              handleNext();
            }}
            className="space-y-0"
          >
            <WizardStepContent
              currentStep={state.currentStep}
              formData={state.formData}
              updateFormData={updateFormData}
              errors={state.errors}
              handlePhotoUpload={handlePhotoUpload}
              removePhoto={removePhoto}
              toggleEquipment={toggleEquipment}
              isEditMode={isEditMode}
            />

            <WizardNavigation
              currentStep={state.currentStep}
              isSubmitting={state.isSubmitting}
              submitLabel={submitLabel}
              t={t}
              tCommon={tCommon}
              onBack={handleBack}
            />
          </form>
        </div>
      </div>

      {state.errors.submit && <SubmitErrorBanner message={state.errors.submit} />}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return <main className="pt-24 pb-16 min-h-screen">{content}</main>;
}
