import { MetadataRoute } from 'next'

// Brands and models for programmatic pages
const BRANDS_DATA: Record<string, { name: string; models: string[] }> = {
    skoda: {
        name: "Škoda",
        models: ["octavia", "fabia", "superb", "kodiaq", "karoq", "scala", "kamiq", "enyaq"],
    },
    volkswagen: {
        name: "Volkswagen",
        models: ["golf", "passat", "tiguan", "polo", "arteon", "touareg", "t-roc", "id4"],
    },
    audi: {
        name: "Audi",
        models: ["a3", "a4", "a6", "q3", "q5", "q7", "q8", "e-tron"],
    },
    bmw: {
        name: "BMW",
        models: ["3-series", "5-series", "x1", "x3", "x5", "x6", "i4", "ix"],
    },
    mercedes: {
        name: "Mercedes-Benz",
        models: ["c-class", "e-class", "s-class", "glc", "gle", "gla", "eqc", "eqs"],
    },
    ford: {
        name: "Ford",
        models: ["focus", "fiesta", "mondeo", "kuga", "puma", "mustang"],
    },
    toyota: {
        name: "Toyota",
        models: ["corolla", "yaris", "camry", "rav4", "c-hr", "land-cruiser"],
    },
    hyundai: {
        name: "Hyundai",
        models: ["i20", "i30", "tucson", "kona", "ioniq", "santa-fe"],
    },
    kia: {
        name: "Kia",
        models: ["ceed", "sportage", "sorento", "niro", "stonic", "ev6"],
    },
};

const CITIES = [
    "bratislava",
    "kosice",
    "zilina",
    "presov",
    "nitra",
    "banska-bystrica",
    "trnava",
    "trencin",
];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://autobazar123.vercel.app'
    const now = new Date()

    // Core pages
    const corePages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/auta`,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/kredity`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/pridat-inzerat`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/auth/login`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/auth/register`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/obchodne-podmienky`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/ochrana-udajov`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]

    // Brand pages
    const brandPages: MetadataRoute.Sitemap = Object.keys(BRANDS_DATA).map((brand) => ({
        url: `${baseUrl}/${brand}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }))

    // Brand + Model pages
    const modelPages: MetadataRoute.Sitemap = []
    for (const [brand, data] of Object.entries(BRANDS_DATA)) {
        for (const model of data.models) {
            modelPages.push({
                url: `${baseUrl}/${brand}/${model}`,
                lastModified: now,
                changeFrequency: 'daily' as const,
                priority: 0.7,
            })
        }
    }

    // Top brand + model + city pages (only for most popular combinations)
    const topBrands = ["skoda", "volkswagen", "audi", "bmw"];
    const topModels: Record<string, string[]> = {
        skoda: ["octavia", "fabia", "superb"],
        volkswagen: ["golf", "passat", "tiguan"],
        audi: ["a4", "a6", "q5"],
        bmw: ["3-series", "5-series", "x5"],
    };
    const topCities = ["bratislava", "kosice", "zilina"];

    const cityPages: MetadataRoute.Sitemap = []
    for (const brand of topBrands) {
        for (const model of topModels[brand] || []) {
            for (const city of topCities) {
                cityPages.push({
                    url: `${baseUrl}/${brand}/${model}/${city}`,
                    lastModified: now,
                    changeFrequency: 'daily' as const,
                    priority: 0.6,
                })
            }
        }
    }

    return [...corePages, ...brandPages, ...modelPages, ...cityPages]
}
