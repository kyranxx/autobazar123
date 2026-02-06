import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://autobazar123.sk'

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
}

const TOP_CITIES = ["bratislava", "kosice", "zilina", "banska-bystrica", "nitra", "presov", "trnava", "trencin"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date()

    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
        { url: `${BASE_URL}/vysledky`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
        { url: `${BASE_URL}/predajcovia`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
        { url: `${BASE_URL}/kalkulacka-leasingu`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/ceny`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${BASE_URL}/kredity`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${BASE_URL}/pridat-inzerat`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/kontakt`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/o-nas`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/obchodne-podmienky`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/ochrana-udajov`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    ]

    const brandPages: MetadataRoute.Sitemap = Object.keys(BRANDS_DATA).map((brand) => ({
        url: `${BASE_URL}/${brand}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }))

    const modelPages: MetadataRoute.Sitemap = []
    for (const [brand, data] of Object.entries(BRANDS_DATA)) {
        for (const model of data.models) {
            modelPages.push({
                url: `${BASE_URL}/${brand}/${model}`,
                lastModified: now,
                changeFrequency: 'daily' as const,
                priority: 0.7,
            })
        }
    }

    const topBrands = ["skoda", "volkswagen", "audi", "bmw", "mercedes"]
    const topModels: Record<string, string[]> = {
        skoda: ["octavia", "fabia", "superb"],
        volkswagen: ["golf", "passat", "tiguan"],
        audi: ["a4", "a6", "q5"],
        bmw: ["3-series", "5-series", "x5"],
        mercedes: ["c-class", "e-class", "glc"],
    }

    const cityPages: MetadataRoute.Sitemap = []
    for (const brand of topBrands) {
        for (const model of topModels[brand] || []) {
            for (const city of TOP_CITIES) {
                cityPages.push({
                    url: `${BASE_URL}/${brand}/${model}/${city}`,
                    lastModified: now,
                    changeFrequency: 'daily' as const,
                    priority: 0.6,
                })
            }
        }
    }

    let listingPages: MetadataRoute.Sitemap = []
    try {
        const supabase = await createClient()
        const { data: ads } = await supabase
            .from("ads")
            .select("id, updated_at")
            .eq("status", "active")
            .order("updated_at", { ascending: false })
            .limit(5000)

        if (ads) {
            listingPages = ads.map((ad) => ({
                url: `${BASE_URL}/auto/${ad.id}`,
                lastModified: new Date(ad.updated_at),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }))
        }
    } catch (error) {
        console.error("Sitemap: failed to fetch ads", error)
    }

    return [...staticPages, ...brandPages, ...modelPages, ...cityPages, ...listingPages]
}
