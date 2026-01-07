/**
 * VIN Decoder utility for Autobazar123
 * Uses VINdecoder.eu API to extract vehicle information from VIN
 */

interface VINDecodedData {
    brand: string;
    model: string;
    year: number;
    bodyType?: string;
    fuelType?: string;
    engineSize?: number;
    transmission?: string;
    raw?: Record<string, unknown>;
}

interface VINDecodeResult {
    success: boolean;
    data?: VINDecodedData;
    error?: string;
}

// VIN validation (basic check - 17 characters, no I, O, Q)
export function isValidVIN(vin: string): boolean {
    if (!vin || vin.length !== 17) return false;
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinRegex.test(vin);
}

// Extract basic info from VIN without API (WMI codes)
const WMI_CODES: Record<string, string> = {
    // Škoda
    TMB: "Škoda",
    TMP: "Škoda",
    // Volkswagen
    WVW: "Volkswagen",
    WV2: "Volkswagen",
    // Audi
    WAU: "Audi",
    WUA: "Audi",
    // BMW
    WBA: "BMW",
    WBS: "BMW M",
    WBY: "BMW i",
    // Mercedes
    WDB: "Mercedes-Benz",
    WDC: "Mercedes-Benz",
    WDD: "Mercedes-Benz",
    // Ford
    WF0: "Ford",
    // Toyota
    JTD: "Toyota",
    SB1: "Toyota (UK)",
    // Hyundai
    KMH: "Hyundai",
    TMA: "Hyundai (CZ)",
    // Kia
    KNA: "Kia",
    KNC: "Kia",
    // Peugeot
    VF3: "Peugeot",
    // Renault
    VF1: "Renault",
    // Fiat
    ZFA: "Fiat",
    // Honda
    JHM: "Honda",
    SHH: "Honda (UK)",
    // Mazda
    JM1: "Mazda",
    // Nissan
    JN1: "Nissan",
    // Opel/Vauxhall
    W0L: "Opel",
    // Volvo
    YV1: "Volvo",
    // Seat
    VSS: "Seat",
    // Citroën
    VF7: "Citroën",
};

// Get year from VIN position 10
function getYearFromVIN(vin: string): number | null {
    const yearChar = vin.charAt(9).toUpperCase();
    const yearCodes: Record<string, number> = {
        A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
        F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
        L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
        S: 2025, T: 2026, V: 2027, W: 2028, X: 2029,
        Y: 2030,
        "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005,
        "6": 2006, "7": 2007, "8": 2008, "9": 2009,
    };
    return yearCodes[yearChar] || null;
}

// Decode VIN locally (without API)
export function decodeVINLocal(vin: string): VINDecodeResult {
    if (!isValidVIN(vin)) {
        return { success: false, error: "Neplatné VIN (musí mať 17 znakov)" };
    }

    const wmi = vin.substring(0, 3).toUpperCase();
    const brand = WMI_CODES[wmi];
    const year = getYearFromVIN(vin);

    if (!brand) {
        return {
            success: false,
            error: "Neznámy výrobca. Zadajte údaje manuálne.",
        };
    }

    return {
        success: true,
        data: {
            brand,
            model: "", // Can't determine model without API
            year: year || new Date().getFullYear(),
        },
    };
}

// Decode VIN using external API (mock for now)
export async function decodeVIN(vin: string): Promise<VINDecodeResult> {
    if (!isValidVIN(vin)) {
        return { success: false, error: "Neplatné VIN (musí mať 17 znakov)" };
    }

    // First try local decode for brand
    const localResult = decodeVINLocal(vin);

    // In production, you would call VINdecoder.eu API here
    // const API_KEY = process.env.VIN_DECODER_API_KEY;
    // const response = await fetch(`https://api.vindecoder.eu/3.1/${API_KEY}/decode/${vin}.json`);

    // For now, return local result with enhanced mock data for common VINs
    const mockEnhancements: Record<string, Partial<VINDecodedData>> = {
        // Example: Slovak Škoda Octavia
        TMBEA61Z: { model: "Octavia", bodyType: "Liftback" },
        TMBEA41Z: { model: "Superb", bodyType: "Sedan" },
        TMBCJ9NE: { model: "Kodiaq", bodyType: "SUV" },
        // VW Golf
        WVWZZZ1K: { model: "Golf", bodyType: "Hatchback" },
        WVWZZZ3C: { model: "Passat", bodyType: "Sedan" },
    };

    // Check for mock enhancement based on first 8 chars (VIS)
    const vis = vin.substring(0, 8).toUpperCase();
    const enhancement = mockEnhancements[vis];

    if (localResult.success && localResult.data) {
        return {
            success: true,
            data: {
                ...localResult.data,
                ...enhancement,
            },
        };
    }

    return localResult;
}

// Format VIN for display (with spaces for readability)
export function formatVIN(vin: string): string {
    if (!vin || vin.length !== 17) return vin;
    // Format: WMI-VDS-VIS (3-6-8)
    return `${vin.slice(0, 3)} ${vin.slice(3, 9)} ${vin.slice(9)}`.toUpperCase();
}
