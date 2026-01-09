"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Types for the wizard
interface AdFormData {
    // Step 1: Category
    category: "personal" | "commercial" | "moto" | "";

    // Step 2: Vehicle Data
    brand_id: string;
    model_id: string;
    brand: string;
    model: string;
    generation: string;
    year: number | "";
    vin: string;

    // Step 3: Technical Specs
    fuel: string;
    transmission: string;
    body_style: string;
    power_kw: number | "";
    engine_volume_cm3: number | "";
    mileage_km: number | "";
    drive_type: string;
    color: string;

    // Step 4: Trust Signals & Description
    is_bought_in_sk: boolean;
    is_vat_deductible: boolean;
    has_service_book: boolean;
    full_service_history: boolean;
    originality_check: boolean;
    garage_kept: boolean;
    not_crashed: boolean;
    is_imported: boolean;
    stk_valid_until: string;
    description: string;
    location_city: string;
    location_district: string;

    // Step 5: Photos & Equipment
    photos: File[];
    photoUrls: string[];
    equipment: string[];
    price_eur: number | "";
}

const INITIAL_FORM_DATA: AdFormData = {
    category: "",
    brand_id: "",
    model_id: "",
    brand: "",
    model: "",
    generation: "",
    year: "",
    vin: "",
    fuel: "",
    transmission: "",
    body_style: "",
    power_kw: "",
    engine_volume_cm3: "",
    mileage_km: "",
    drive_type: "",
    color: "",
    is_bought_in_sk: false,
    is_vat_deductible: false,
    has_service_book: false,
    full_service_history: false,
    originality_check: false,
    garage_kept: false,
    not_crashed: false,
    is_imported: false,
    stk_valid_until: "",
    description: "",
    location_city: "",
    location_district: "",
    photos: [],
    photoUrls: [],
    equipment: [],
    price_eur: "",
};

// Mock data
const BRANDS = [
    { id: "1", name: "Škoda", slug: "skoda" },
    { id: "2", name: "Volkswagen", slug: "volkswagen" },
    { id: "3", name: "BMW", slug: "bmw" },
    { id: "4", name: "Audi", slug: "audi" },
    { id: "5", name: "Mercedes-Benz", slug: "mercedes-benz" },
    { id: "6", name: "Toyota", slug: "toyota" },
    { id: "7", name: "Ford", slug: "ford" },
    { id: "8", name: "Opel", slug: "opel" },
    { id: "9", name: "Peugeot", slug: "peugeot" },
    { id: "10", name: "Renault", slug: "renault" },
    { id: "11", name: "Hyundai", slug: "hyundai" },
    { id: "12", name: "Kia", slug: "kia" },
];

const MODELS: Record<string, { id: string; name: string }[]> = {
    "1": [
        { id: "m1", name: "Octavia" },
        { id: "m2", name: "Fabia" },
        { id: "m3", name: "Superb" },
        { id: "m4", name: "Kodiaq" },
        { id: "m5", name: "Karoq" },
        { id: "m6", name: "Scala" },
        { id: "m7", name: "Kamiq" },
        { id: "m8", name: "Enyaq" },
    ],
    "2": [
        { id: "m9", name: "Golf" },
        { id: "m10", name: "Passat" },
        { id: "m11", name: "Tiguan" },
        { id: "m12", name: "Polo" },
        { id: "m13", name: "Touran" },
    ],
    "3": [
        { id: "m14", name: "Rad 3" },
        { id: "m15", name: "Rad 5" },
        { id: "m16", name: "X3" },
        { id: "m17", name: "X5" },
    ],
    "4": [
        { id: "m18", name: "A4" },
        { id: "m19", name: "A6" },
        { id: "m20", name: "Q5" },
        { id: "m21", name: "Q7" },
    ],
};

const EQUIPMENT_OPTIONS = [
    { group: "Bezpečnosť", items: ["ABS", "ESP", "Airbag vodiča", "Airbag spolujazdca", "Bočné airbagy", "Isofix", "Alarm", "Centrálne zamykanie"] },
    { group: "Komfort", items: ["Klimatizácia", "Automatická klimatizácia", "Vyhrievané sedadlá", "Elektrické okná", "Elektrické zrkadlá", "Tempomat", "Parkovacie senzory", "Cúvacia kamera"] },
    { group: "Exteriér", items: ["LED svetlomety", "Hmlové svetlá", "Strešné okno", "Panoramatická strecha", "Ťažné zariadenie", "Metalíza"] },
    { group: "Interiér", items: ["Kožený interiér", "Navigácia", "Bluetooth", "USB", "Apple CarPlay", "Android Auto", "Digitálny kokpit"] },
];

const STEPS = [
    { id: 1, name: "Kategória", icon: "🚗" },
    { id: 2, name: "Vozidlo", icon: "📋" },
    { id: 3, name: "Technické", icon: "⚙️" },
    { id: 4, name: "Detaily", icon: "✅" },
    { id: 5, name: "Fotky & Cena", icon: "📷" },
];

export default function AdWizardClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<AdFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect to login if not authenticated
    if (!loading && !user) {
        return (
            <main className="pt-24 pb-16 min-h-screen">
                <div className="mx-auto max-w-lg px-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                        <LockIcon className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">
                        Pre pridanie inzerátu sa musíte prihlásiť
                    </h1>
                    <p className="text-secondary mb-6">
                        Vytvorte si bezplatný účet alebo sa prihláste do existujúceho.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/auth/login"
                            className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
                        >
                            Prihlásiť sa
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-6 py-3 rounded-full border border-border text-primary font-semibold hover:bg-surface"
                        >
                            Vytvoriť účet
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
                    newErrors.category = "Vyberte kategóriu";
                }
                break;
            case 2:
                if (!formData.brand) newErrors.brand = "Vyberte značku";
                if (!formData.model) newErrors.model = "Vyberte model";
                if (!formData.year) newErrors.year = "Zadajte rok výroby";
                break;
            case 3:
                if (!formData.fuel) newErrors.fuel = "Vyberte typ paliva";
                if (!formData.transmission) newErrors.transmission = "Vyberte prevodovku";
                if (!formData.mileage_km) newErrors.mileage_km = "Zadajte počet km";
                break;
            case 4:
                if (!formData.location_city) newErrors.location_city = "Zadajte mesto";
                break;
            case 5:
                if (!formData.price_eur) newErrors.price_eur = "Zadajte cenu";
                if (formData.photoUrls.length === 0) newErrors.photos = "Pridajte aspoň jednu fotku";
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

            // Upload photos to storage
            const photoUrls: string[] = [];
            for (let i = 0; i < formData.photos.length; i++) {
                const photo = formData.photos[i];
                const fileName = `${user.id}/${Date.now()}_${i}_${photo.name}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("ad-photos")
                    .upload(fileName, photo);

                if (uploadError) {
                    console.error("Photo upload error:", uploadError);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("ad-photos")
                    .getPublicUrl(fileName);

                photoUrls.push(publicUrl);
            }

            // Create the ad in database
            const { data: adData, error: adError } = await supabase
                .from("ads")
                .insert({
                    user_id: user.id,
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
        <main className="pt-20 pb-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
                {/* Header */}
                <div className="py-8 text-center">
                    <h1 className="text-2xl font-bold text-primary sm:text-3xl">
                        Pridať inzerát
                    </h1>
                    <p className="mt-2 text-secondary">
                        Vyplňte údaje o vozidle v 5 jednoduchých krokoch
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div
                                key={step.id}
                                className="flex flex-col items-center flex-1"
                            >
                                <div className="relative flex items-center w-full">
                                    {/* Line before */}
                                    {index > 0 && (
                                        <div
                                            className={`absolute left-0 right-1/2 h-0.5 ${currentStep > step.id ? "bg-accent" : "bg-border"
                                                }`}
                                        />
                                    )}
                                    {/* Line after */}
                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={`absolute left-1/2 right-0 h-0.5 ${currentStep > step.id ? "bg-accent" : "bg-border"
                                                }`}
                                        />
                                    )}
                                    {/* Circle */}
                                    <button
                                        onClick={() => {
                                            if (step.id < currentStep) setCurrentStep(step.id);
                                        }}
                                        disabled={step.id > currentStep}
                                        className={`relative z-10 mx-auto w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${currentStep === step.id
                                            ? "bg-accent text-white shadow-lg scale-110"
                                            : currentStep > step.id
                                                ? "bg-accent text-white cursor-pointer hover:scale-105"
                                                : "bg-surface text-secondary"
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <CheckIcon className="w-5 h-5" />
                                        ) : (
                                            step.icon
                                        )}
                                    </button>
                                </div>
                                <span
                                    className={`mt-2 text-xs font-medium hidden sm:block ${currentStep >= step.id ? "text-primary" : "text-secondary"
                                        }`}
                                >
                                    {step.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

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

                        {/* Step 2: Vehicle Data */}
                        {currentStep === 2 && (
                            <Step2Vehicle
                                formData={formData}
                                updateFormData={updateFormData}
                                errors={errors}
                                brands={BRANDS}
                                models={MODELS}
                            />
                        )}

                        {/* Step 3: Technical Specs */}
                        {currentStep === 3 && (
                            <Step3Technical
                                formData={formData}
                                updateFormData={updateFormData}
                                errors={errors}
                            />
                        )}

                        {/* Step 4: Trust Signals & Description */}
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
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between p-6 border-t border-border bg-surface/50">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2 px-6 py-3 rounded-full border border-border text-primary font-medium hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                            Späť
                        </button>

                        {currentStep < 5 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
                            >
                                Pokračovať
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner className="w-5 h-5" />
                                        Spracúvam...
                                    </>
                                ) : (
                                    <>
                                        Zverejniť za 1 kredit
                                        <CheckIcon className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

// Step Components
function Step1Category({
    formData,
    updateFormData,
    errors,
}: {
    formData: AdFormData;
    updateFormData: <K extends keyof AdFormData>(key: K, value: AdFormData[K]) => void;
    errors: Record<string, string>;
}) {
    const categories = [
        { id: "personal", label: "Osobné autá", icon: "🚗", description: "Sedany, hatchbacky, kombi, SUV..." },
        { id: "commercial", label: "Úžitkové", icon: "🚐", description: "Dodávky, nákladné vozidlá, autobusy..." },
        { id: "moto", label: "Motorky", icon: "🏍️", description: "Motocykle, skútre, štvorkolky..." },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-primary mb-2">
                    Vyberte kategóriu
                </h2>
                <p className="text-secondary">
                    Aký typ vozidla predávate?
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => updateFormData("category", cat.id as AdFormData["category"])}
                        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${formData.category === cat.id
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/30 hover:bg-surface"
                            }`}
                    >
                        <span className="text-4xl">{cat.icon}</span>
                        <div className="text-center">
                            <p className="font-semibold text-primary">{cat.label}</p>
                            <p className="text-sm text-secondary mt-1">{cat.description}</p>
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

function Step2Vehicle({
    formData,
    updateFormData,
    errors,
    brands,
    models,
}: {
    formData: AdFormData;
    updateFormData: <K extends keyof AdFormData>(key: K, value: AdFormData[K]) => void;
    errors: Record<string, string>;
    brands: { id: string; name: string; slug: string }[];
    models: Record<string, { id: string; name: string }[]>;
}) {
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
                    Údaje o vozidle
                </h2>
                <p className="text-secondary">
                    Základné informácie o vašom aute
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="Značka" required error={errors.brand}>
                    <select
                        value={formData.brand_id}
                        onChange={(e) => handleBrandChange(e.target.value)}
                        className="form-select"
                    >
                        <option value="">Vyberte značku</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Model" required error={errors.model}>
                    <select
                        value={formData.model_id}
                        onChange={(e) => handleModelChange(e.target.value)}
                        disabled={!formData.brand_id}
                        className="form-select"
                    >
                        <option value="">Vyberte model</option>
                        {availableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Generácia / Verzia">
                    <input
                        type="text"
                        value={formData.generation}
                        onChange={(e) => updateFormData("generation", e.target.value)}
                        placeholder="napr. III Facelift"
                        className="form-input"
                    />
                </FormField>

                <FormField label="Rok výroby" required error={errors.year}>
                    <select
                        value={formData.year}
                        onChange={(e) => updateFormData("year", parseInt(e.target.value) || "")}
                        className="form-select"
                    >
                        <option value="">Vyberte rok</option>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="VIN (voliteľné)" className="sm:col-span-2">
                    <input
                        type="text"
                        value={formData.vin}
                        onChange={(e) => updateFormData("vin", e.target.value.toUpperCase())}
                        placeholder="17-miestny VIN kód"
                        maxLength={17}
                        className="form-input font-mono"
                    />
                    <p className="mt-1 text-xs text-secondary">
                        VIN pomáha automaticky vyplniť údaje o vozidle
                    </p>
                </FormField>
            </div>
        </div>
    );
}

function Step3Technical({
    formData,
    updateFormData,
    errors,
}: {
    formData: AdFormData;
    updateFormData: <K extends keyof AdFormData>(key: K, value: AdFormData[K]) => void;
    errors: Record<string, string>;
}) {
    const fuelOptions = [
        { value: "petrol", label: "Benzín" },
        { value: "diesel", label: "Diesel" },
        { value: "electric", label: "Elektro" },
        { value: "hybrid", label: "Hybrid" },
        { value: "lpg", label: "LPG" },
        { value: "cng", label: "CNG" },
    ];

    const transmissionOptions = [
        { value: "manual", label: "Manuálna" },
        { value: "automatic", label: "Automatická" },
    ];

    const bodyOptions = [
        { value: "sedan", label: "Sedan" },
        { value: "combi", label: "Kombi" },
        { value: "suv", label: "SUV" },
        { value: "hatchback", label: "Hatchback" },
        { value: "coupe", label: "Kupé" },
        { value: "cabriolet", label: "Kabriolet" },
        { value: "mpv", label: "MPV" },
        { value: "pickup", label: "Pickup" },
    ];

    const driveOptions = [
        { value: "FWD", label: "Predný" },
        { value: "RWD", label: "Zadný" },
        { value: "AWD", label: "4x4" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-primary mb-2">
                    Technické údaje
                </h2>
                <p className="text-secondary">
                    Špecifikácie motora a prevodovky
                </p>
            </div>

            {/* Fuel Type */}
            <FormField label="Typ paliva" required error={errors.fuel}>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {fuelOptions.map((opt) => (
                        <ChipButton
                            key={opt.value}
                            selected={formData.fuel === opt.value}
                            onClick={() => updateFormData("fuel", opt.value)}
                        >
                            {opt.label}
                        </ChipButton>
                    ))}
                </div>
            </FormField>

            {/* Transmission - Hide if electric */}
            {formData.fuel !== "electric" && (
                <FormField label="Prevodovka" required error={errors.transmission}>
                    <div className="grid grid-cols-2 gap-2">
                        {transmissionOptions.map((opt) => (
                            <ChipButton
                                key={opt.value}
                                selected={formData.transmission === opt.value}
                                onClick={() => updateFormData("transmission", opt.value)}
                            >
                                {opt.label}
                            </ChipButton>
                        ))}
                    </div>
                </FormField>
            )}

            {/* Body Style */}
            <FormField label="Typ karosérie">
                <div className="grid grid-cols-4 gap-2">
                    {bodyOptions.map((opt) => (
                        <ChipButton
                            key={opt.value}
                            selected={formData.body_style === opt.value}
                            onClick={() => updateFormData("body_style", opt.value)}
                        >
                            {opt.label}
                        </ChipButton>
                    ))}
                </div>
            </FormField>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="Najazdené km" required error={errors.mileage_km}>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.mileage_km}
                            onChange={(e) => updateFormData("mileage_km", parseInt(e.target.value) || "")}
                            placeholder="0"
                            className="form-input pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">km</span>
                    </div>
                </FormField>

                <FormField label="Výkon">
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.power_kw}
                            onChange={(e) => updateFormData("power_kw", parseInt(e.target.value) || "")}
                            placeholder="0"
                            className="form-input pr-12"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">kW</span>
                    </div>
                </FormField>

                {formData.fuel !== "electric" && (
                    <FormField label="Objem motora">
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.engine_volume_cm3}
                                onChange={(e) => updateFormData("engine_volume_cm3", parseInt(e.target.value) || "")}
                                placeholder="0"
                                className="form-input pr-12"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">cm³</span>
                        </div>
                    </FormField>
                )}

                <FormField label="Pohon">
                    <div className="grid grid-cols-3 gap-2">
                        {driveOptions.map((opt) => (
                            <ChipButton
                                key={opt.value}
                                selected={formData.drive_type === opt.value}
                                onClick={() => updateFormData("drive_type", opt.value)}
                            >
                                {opt.label}
                            </ChipButton>
                        ))}
                    </div>
                </FormField>

                <FormField label="Farba" className="sm:col-span-2">
                    <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => updateFormData("color", e.target.value)}
                        placeholder="napr. Čierna metalíza"
                        className="form-input"
                    />
                </FormField>
            </div>
        </div>
    );
}

function Step4Details({
    formData,
    updateFormData,
    errors,
}: {
    formData: AdFormData;
    updateFormData: <K extends keyof AdFormData>(key: K, value: AdFormData[K]) => void;
    errors: Record<string, string>;
}) {
    const trustSignals = [
        { key: "is_bought_in_sk", label: "Kúpené v SR", icon: "🇸🇰" },
        { key: "has_service_book", label: "Servisná knižka", icon: "📘" },
        { key: "full_service_history", label: "Kompletná servisná história", icon: "📋" },
        { key: "originality_check", label: "Kontrola originality (KO)", icon: "🔍" },
        { key: "not_crashed", label: "Nehavarované", icon: "✅" },
        { key: "garage_kept", label: "Garážované", icon: "🏠" },
        { key: "is_vat_deductible", label: "Možný odpočet DPH", icon: "💶" },
        { key: "is_imported", label: "Dovoz zo zahraničia", icon: "🌍" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-primary mb-2">
                    Detaily a dôveryhodnosť
                </h2>
                <p className="text-secondary">
                    Tieto údaje zvyšujú dôveryhodnosť vášho inzerátu
                </p>
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {trustSignals.map((signal) => (
                    <label
                        key={signal.key}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData[signal.key as keyof AdFormData]
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/30"
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={formData[signal.key as keyof AdFormData] as boolean}
                            onChange={(e) =>
                                updateFormData(signal.key as keyof AdFormData, e.target.checked as never)
                            }
                            className="sr-only"
                        />
                        <span className="text-xl">{signal.icon}</span>
                        <span className="font-medium text-primary">{signal.label}</span>
                        {formData[signal.key as keyof AdFormData] && (
                            <CheckIcon className="w-5 h-5 text-accent ml-auto" />
                        )}
                    </label>
                ))}
            </div>

            {/* STK Valid Until */}
            <FormField label="STK platná do">
                <input
                    type="date"
                    value={formData.stk_valid_until}
                    onChange={(e) => updateFormData("stk_valid_until", e.target.value)}
                    className="form-input"
                />
            </FormField>

            {/* Location */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="Mesto" required error={errors.location_city}>
                    <input
                        type="text"
                        value={formData.location_city}
                        onChange={(e) => updateFormData("location_city", e.target.value)}
                        placeholder="napr. Bratislava"
                        className="form-input"
                    />
                </FormField>

                <FormField label="Okres">
                    <input
                        type="text"
                        value={formData.location_district}
                        onChange={(e) => updateFormData("location_district", e.target.value)}
                        placeholder="napr. Petržalka"
                        className="form-input"
                    />
                </FormField>
            </div>

            {/* Description */}
            <FormField label="Popis">
                <textarea
                    rows={6}
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Popíšte stav vozidla, výbavu, dôvod predaja..."
                    className="form-input resize-none"
                />
                <p className="mt-1 text-xs text-secondary">
                    Tip: Dobré popisy zvyšujú záujem o inzerát
                </p>
            </FormField>
        </div>
    );
}

function Step5PhotosPrice({
    formData,
    updateFormData,
    errors,
    handlePhotoUpload,
    removePhoto,
    equipmentOptions,
    toggleEquipment,
}: {
    formData: AdFormData;
    updateFormData: <K extends keyof AdFormData>(key: K, value: AdFormData[K]) => void;
    errors: Record<string, string>;
    handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removePhoto: (index: number) => void;
    equipmentOptions: { group: string; items: string[] }[];
    toggleEquipment: (item: string) => void;
}) {
    return (
        <div className="space-y-8">
            {/* Photos */}
            <div>
                <h2 className="text-xl font-semibold text-primary mb-2">
                    Fotky
                </h2>
                <p className="text-secondary mb-4">
                    Pridajte maximálne 10 fotografií (30 pre TOP inzeráty)
                </p>

                {errors.photos && (
                    <p className="mb-4 text-sm text-error">{errors.photos}</p>
                )}

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {formData.photoUrls.map((url, index) => (
                        <div
                            key={index}
                            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border group"
                        >
                            <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                                    Hlavná
                                </span>
                            )}
                        </div>
                    ))}

                    {formData.photoUrls.length < 10 && (
                        <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-accent cursor-pointer flex flex-col items-center justify-center gap-2 text-secondary hover:text-accent transition-colors">
                            <CameraIcon className="w-8 h-8" />
                            <span className="text-xs">Pridať</span>
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
                    Výbava
                </h2>
                <p className="text-secondary mb-4">
                    Vyberte položky, ktoré vaše auto obsahuje
                </p>

                <div className="space-y-4">
                    {equipmentOptions.map((group) => (
                        <div key={group.group}>
                            <p className="text-sm font-medium text-secondary mb-2">{group.group}</p>
                            <div className="flex flex-wrap gap-2">
                                {group.items.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => toggleEquipment(item)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${formData.equipment.includes(item)
                                            ? "bg-accent text-white"
                                            : "bg-surface text-primary hover:bg-surface-hover"
                                            }`}
                                    >
                                        {item}
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
                    Cena
                </h2>

                <FormField label="Predajná cena" required error={errors.price_eur}>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.price_eur}
                            onChange={(e) => updateFormData("price_eur", parseInt(e.target.value) || "")}
                            placeholder="0"
                            className="form-input pr-12 text-xl font-bold"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary font-bold">€</span>
                    </div>
                </FormField>
            </div>

            {/* Summary Card */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
                <h3 className="font-semibold text-primary mb-4">Súhrn inzerátu</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-secondary">Vozidlo:</span>
                        <span className="font-medium text-primary">
                            {formData.brand} {formData.model} {formData.generation}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Rok:</span>
                        <span className="font-medium text-primary">{formData.year || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Kilometre:</span>
                        <span className="font-medium text-primary">
                            {formData.mileage_km ? `${Number(formData.mileage_km).toLocaleString("sk-SK")} km` : "-"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Fotky:</span>
                        <span className="font-medium text-primary">{formData.photoUrls.length}</span>
                    </div>
                    <hr className="border-border my-3" />
                    <div className="flex justify-between text-lg">
                        <span className="font-semibold text-primary">Cena:</span>
                        <span className="font-bold text-accent">
                            {formData.price_eur ? `${Number(formData.price_eur).toLocaleString("sk-SK")} €` : "-"}
                        </span>
                    </div>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-accent/10 text-center">
                    <p className="text-sm text-secondary">Cena za zverejnenie</p>
                    <p className="text-2xl font-bold text-accent">1 kredit</p>
                </div>
            </div>
        </div>
    );
}

// Reusable Components
function FormField({
    label,
    required,
    error,
    className,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-primary mb-2">
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-sm text-error">{error}</p>}
        </div>
    );
}

function ChipButton({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selected
                ? "bg-accent text-white"
                : "bg-surface text-primary hover:bg-surface-hover"
                }`}
        >
            {children}
        </button>
    );
}

// Icons
function LockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function ChevronLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}

function CameraIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function LoadingSpinner({ className }: { className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}
