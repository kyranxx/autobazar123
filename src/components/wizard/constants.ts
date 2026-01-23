import { AdFormData } from "@/types/wizard";

export const INITIAL_FORM_DATA: AdFormData = {
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

export const EQUIPMENT_OPTIONS = [
    { groupKey: "safety", items: ["ABS", "ESP", "Airbag vodiča", "Airbag spolujazdca", "Bočné airbagy", "Isofix", "Alarm", "Centrálne zamykanie"] },
    { groupKey: "comfort", items: ["Klimatizácia", "Automatická klimatizácia", "Vyhrievané sedadlá", "Elektrické okná", "Elektrické zrkadlá", "Tempomat", "Parkovacie senzory", "Cúvacia kamera"] },
    { groupKey: "exterior", items: ["LED svetlomety", "Hmlové svetlá", "Strešné okno", "Panoramatická strecha", "Ťažné zariadenie", "Metalíza"] },
    { groupKey: "interior", items: ["Kožený interiér", "Navigácia", "Bluetooth", "USB", "Apple CarPlay", "Android Auto", "Digitálny kokpit"] },
];

export const STEPS = [
    { id: 1, nameKey: "step1", icon: "🚗" },
    { id: 2, nameKey: "step2", icon: "📋" },
    { id: 3, nameKey: "step3", icon: "⚙️" },
    { id: 4, nameKey: "step4", icon: "✅" },
    { id: 5, nameKey: "step5", icon: "📷" },
];
