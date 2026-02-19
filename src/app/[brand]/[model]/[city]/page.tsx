import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

// Brands data
const BRANDS_DATA: Record<string, { name: string; models: string[] }> = {
  skoda: {
    name: "Škoda",
    models: [
      "octavia",
      "fabia",
      "superb",
      "kodiaq",
      "karoq",
      "scala",
      "kamiq",
      "enyaq",
    ],
  },
  volkswagen: {
    name: "Volkswagen",
    models: [
      "golf",
      "passat",
      "tiguan",
      "polo",
      "arteon",
      "touareg",
      "t-roc",
      "id4",
    ],
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
    models: [
      "c-class",
      "e-class",
      "s-class",
      "glc",
      "gle",
      "gla",
      "eqc",
      "eqs",
    ],
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

const CITIES: Record<string, { name: string; region: string }> = {
  bratislava: { name: "Bratislava", region: "Bratislavský kraj" },
  kosice: { name: "Košice", region: "Košický kraj" },
  zilina: { name: "Žilina", region: "Žilinský kraj" },
  presov: { name: "Prešov", region: "Prešovský kraj" },
  nitra: { name: "Nitra", region: "Nitriansky kraj" },
  "banska-bystrica": {
    name: "Banská Bystrica",
    region: "Banskobystrický kraj",
  },
  trnava: { name: "Trnava", region: "Trnavský kraj" },
  trencin: { name: "Trenčín", region: "Trenčiansky kraj" },
};

// Generate static params for popular combinations
export async function generateStaticParams() {
  const params: { brand: string; model: string; city: string }[] = [];

  // Only generate for top brands to avoid too many pages
  const topBrands = ["skoda", "volkswagen", "audi", "bmw"];
  const topModels: Record<string, string[]> = {
    skoda: ["octavia", "fabia", "superb"],
    volkswagen: ["golf", "passat", "tiguan"],
    audi: ["a4", "a6", "q5"],
    bmw: ["3-series", "5-series", "x5"],
  };
  const topCities = ["bratislava", "kosice", "zilina"];

  for (const brand of topBrands) {
    for (const model of topModels[brand] || []) {
      for (const city of topCities) {
        params.push({ brand, model, city });
      }
    }
  }

  return params;
}

function formatModelName(model: string): string {
  return model
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string; city: string }>;
}): Promise<Metadata> {
  const { brand, model, city } = await params;
  const brandData = BRANDS_DATA[brand];
  const cityData = CITIES[city];

  if (!brandData || !brandData.models.includes(model) || !cityData) {
    return { title: "Nenájdené" };
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);
  const cityName = cityData.name;

  return {
    title: `${brandName} ${modelName} ${cityName} | Autobazar123`,
    description: `${brandName} ${modelName} na predaj v okolí ${cityName}. Nájdite najlepšie ponuky v ${cityData.region} na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName} ${cityName}`,
      `${brandName} ${modelName} ${cityData.region}`,
      `predaj ${brandName} ${cityName}`,
      `${modelName} bazar ${cityName}`,
    ],
    openGraph: {
      title: `${brandName} ${modelName} na predaj - ${cityName}`,
      description: `Najlepšie ponuky ${brandName} ${modelName} v okolí ${cityName}.`,
    },
    alternates: {
      canonical: `https://autobazar123.sk/${brand}/${model}/${city}`,
    },
  };
}

export default async function BrandModelCityPage({
  params,
}: {
  params: Promise<{ brand: string; model: string; city: string }>;
}) {
  const { brand, model, city } = await params;
  const brandData = BRANDS_DATA[brand];
  const cityData = CITIES[city];

  if (!brandData || !brandData.models.includes(model) || !cityData) {
    notFound();
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);
  const cityName = cityData.name;
  const routeUrl = `https://autobazar123.sk/${brand}/${model}/${city}`;
  const breadcrumbItems = [
    { name: "Domov", url: "https://autobazar123.sk" },
    { name: "Auta", url: "https://autobazar123.sk/vysledky" },
    { name: brandName, url: `https://autobazar123.sk/${brand}` },
    { name: `${brandName} ${modelName}`, url: `https://autobazar123.sk/${brand}/${model}` },
    { name: cityName, url: routeUrl },
  ];

  // Mock local cars
  const cars = generateLocalCars(brandName, modelName, cityName, 4);

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-secondary flex-wrap">
              <li>
                <Link href="/" className="hover:text-accent">
                  Domov
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/${brand}`} className="hover:text-accent">
                  {brandName}
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/${brand}/${model}`} className="hover:text-accent">
                  {modelName}
                </Link>
              </li>
              <li>/</li>
              <li className="text-primary font-medium">{cityName}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                📍 {cityName}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              {brandName} {modelName} - {cityName}
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Najlepšie ponuky {brandName} {modelName} v okolí mesta {cityName}a{" "}
              {cityData.region}. Lokálni predajcovia s možnosťou obhliadky.
            </p>
          </div>

          {/* Local Benefits */}
          <div className="mb-8 p-6 rounded-2xl bg-success/5 border border-success/20">
            <h2 className="font-semibold text-primary mb-3">
              ✅ Výhody lokálneho nákupu v {cityName}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 text-sm text-secondary">
              <li>• Možnosť osobnej obhliadky vozidla</li>
              <li>• Bez nákladov na prepravu</li>
              <li>• Jednoduchšie vybavenie dokladov</li>
              <li>• Lokálni overení predajcovia</li>
            </ul>
          </div>

          {/* Cars Grid */}
          {cars.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cars.map((car, index) => (
                <LocalCarCard key={index} car={car} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary">
                Momentálne nemáme {brandName} {modelName} v okolí {cityName}.
              </p>
              <Link
                href={`/${brand}/${model}`}
                className="inline-block mt-4 text-accent hover:underline"
              >
                Zobraziť všetky {brandName} {modelName} na Slovensku →
              </Link>
            </div>
          )}

          {/* Other Cities */}
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {brandName} {modelName} v iných mestách
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CITIES)
                .filter(([key]) => key !== city)
                .map(([key, data]) => (
                  <Link
                    key={key}
                    href={`/${brand}/${model}/${key}`}
                    className="px-4 py-2 rounded-full border border-border text-sm text-secondary hover:border-accent hover:text-accent transition-colors"
                  >
                    {data.name}
                  </Link>
                ))}
            </div>
          </div>

          {/* SEO Content */}
          <div className="mt-16 prose max-w-none">
            <h2 className="text-xl font-bold text-primary mb-4">
              {brandName} {modelName} v {cityName} a okolí
            </h2>
            <p className="text-secondary">
              Hľadáte {brandName} {modelName} v okolí {cityName}? Na
              Autobazar123 nájdete overených predajcov z {cityData.region},
              ktorí ponúkajú kvalitné vozidlá s možnosťou osobnej obhliadky.
            </p>
            <p className="text-secondary mt-4">
              Lokálny nákup vám ušetrí čas aj peniaze za prepravu. Všetci naši
              predajcovia v {cityName} prešli overením a poskytujú transparentné
              informácie o histórii vozidla.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface LocalCar {
  brand: string;
  model: string;
  city: string;
  year: number;
  price: number;
  mileage: number;
  image: string;
}

function generateLocalCars(
  brand: string,
  model: string,
  city: string,
  count: number,
): LocalCar[] {
  const images = [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80",
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80",
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80",
  ];

  return Array.from({ length: count }, (_, i) => ({
    brand,
    model,
    city,
    year: 2019 + Math.floor(Math.random() * 5),
    price: 12000 + Math.floor(Math.random() * 35000),
    mileage: 15000 + Math.floor(Math.random() * 100000),
    image: images[i % images.length],
  }));
}

function LocalCarCard({ car }: { car: LocalCar }) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[16/10] relative">
        <Image
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover"
        />
        <span className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-background/90 text-xs font-medium text-secondary">
          📍 {car.city}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-primary">
          {car.brand} {car.model}
        </h3>
        <p className="text-sm text-secondary">
          {car.year} • {car.mileage.toLocaleString()} km
        </p>
        <p className="text-xl font-bold text-accent mt-2">
          {car.price.toLocaleString()} €
        </p>
      </div>
    </div>
  );
}
