export interface AdFormData {
    category: "personal" | "commercial" | "moto" | "";
    brand_id: string;
    model_id: string;
    brand: string;
    model: string;
    generation: string;
    year: number | "";
    vin: string;
    fuel: string;
    transmission: string;
    body_style: string;
    power_kw: number | "";
    engine_volume_cm3: number | "";
    mileage_km: number | "";
    drive_type: string;
    doors?: number | "";
    seats?: number | "";
    color: string;
    metallic?: boolean;
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
    photos: File[];
    photoUrls: string[];
    equipment: string[];
    price_eur: number | "";
}

export interface WizardStepProps {
    formData: AdFormData;
    updateFormData: <K extends keyof AdFormData>(key: K, value: AdFormData[K]) => void;
    errors: Record<string, string>;
}
