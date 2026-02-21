import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

// Mock data for brands and models
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

// Generate static params for all brand/model combinations
export async function generateStaticParams() {
  const params: { brand: string; model: string }[] = [];

  for (const [brandSlug, brandData] of Object.entries(BRANDS_DATA)) {
    for (const model of brandData.models) {
      params.push({ brand: brandSlug, model });
    }
  }

  return params;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand, model } = await params;
  const brandData = BRANDS_DATA[brand];

  if (!brandData || !brandData.models.includes(model)) {
    return { title: "Nenájdené" };
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);

  return {
    title: `${brandName} ${modelName} | Predaj na Slovensku | Autobazar123`,
    description: `Najlepšie ponuky ${brandName} ${modelName} na Slovensku. Preskúmajte stovky overených inzerátov s garanciou kvality na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName}`,
      `${brandName} ${modelName} predaj`,
      `${brandName} ${modelName} bazar`,
      `${brandName} ${modelName} ojazdené`,
      `kúpiť ${brandName} ${modelName}`,
    ],
    openGraph: {
      title: `${brandName} ${modelName} na predaj | Autobazar123`,
      description: `Najlepšie ponuky ${brandName} ${modelName} na Slovensku.`,
    },
    alternates: {
      canonical: `https://autobazar123.sk/${brand}/${model}`,
    },
  };
}

function formatModelName(model: string): string {
  return model
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function BrandModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand, model } = await params;
  const brandData = BRANDS_DATA[brand];

  if (!brandData || !brandData.models.includes(model)) {
    notFound();
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);
  const routeUrl = `https://autobazar123.sk/${brand}/${model}`;
  const breadcrumbItems = [
    { name: "Domov", url: "https://autobazar123.sk" },
    { name: "Auta", url: "https://autobazar123.sk/vysledky" },
    { name: brandName, url: `https://autobazar123.sk/${brand}` },
    { name: `${brandName} ${modelName}`, url: routeUrl },
  ];

  // Mock car data for this brand/model
  const cars = generateMockCars(brandName, modelName, 6);

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-secondary">
              <li>
                <Link href="/" className="hover:text-accent">
                  Domov
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/vysledky" className="hover:text-accent">
                  Autá
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/${brand}`} className="hover:text-accent">
                  {brandName}
                </Link>
              </li>
              <li>/</li>
              <li className="text-primary font-medium">{modelName}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              {brandName} {modelName} na predaj
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              Preskúmajte najlepšie ponuky {brandName} {modelName} na Slovensku.
              Všetky inzeráty od overených predajcov s garanciou kvality.
            </p>
          </div>

          {/* Quick Filters by City */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-secondary mb-3">
              {brandName} {modelName} podľa mesta:
            </h2>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((city) => (
                <Link
                  key={city}
                  href={`/${brand}/${model}/${city}`}
                  className="px-4 py-2 rounded-full bg-surface border border-border text-sm text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  {formatCityName(city)}
                </Link>
              ))}
            </div>
          </div>

          {/* Cars Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard
                key={`${car.brand}-${car.model}-${car.year}-${car.price}-${car.mileage}-${car.fuel}-${car.image}`}
                car={car}
              />
            ))}
          </div>

          {/* SEO Content */}
          <div className="mt-16 prose max-w-none">
            <h2 className="text-2xl font-bold text-primary mb-4">
              O modeli {brandName} {modelName}
            </h2>
            <p className="text-secondary mb-4">
              {brandName} {modelName} je jedným z najpopulárnejších modelov na
              slovenskom trhu. Vďaka svojmu výkonu, spoľahlivosti a moderným
              technológiám si získal srdcia mnohých slovenských motoristov.
            </p>
            <p className="text-secondary mb-4">
              Na Autobazar123 nájdete široký výber {brandName} {modelName} od
              súkromných predajcov aj overených autobazárov. Každý inzerát
              obsahuje detailné informácie o vozidle, fotogalériu a kontakt na
              predajcu.
            </p>

            <h2 className="text-xl font-bold text-primary mt-8 mb-4">
              Prečo kúpiť {brandName} {modelName} cez Autobazar123?
            </h2>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li>Overení predajcovia s garanciou kvality</li>
              <li>Detailné fotografie a technické údaje</li>
              <li>Transparentná história vozidla</li>
              <li>Bezpečná komunikácia s predajcom</li>
              <li>Kalkulačka leasingu a financovania</li>
            </ul>
          </div>

          {/* Related Models */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-primary mb-6">
              Ďalšie modely {brandName}
            </h2>
            <div className="flex flex-wrap gap-3">
              {brandData.models
                .filter((m) => m !== model)
                .map((relatedModel) => (
                  <Link
                    key={relatedModel}
                    href={`/${brand}/${relatedModel}`}
                    className="px-5 py-2.5 rounded-full border border-border text-primary hover:border-accent hover:text-accent transition-colors"
                  >
                    {brandName} {formatModelName(relatedModel)}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function formatCityName(city: string): string {
  const cityNames: Record<string, string> = {
    bratislava: "Bratislava",
    kosice: "Košice",
    zilina: "Žilina",
    presov: "Prešov",
    nitra: "Nitra",
    "banska-bystrica": "Banská Bystrica",
    trnava: "Trnava",
    trencin: "Trenčín",
  };
  return cityNames[city] || city;
}

interface MockCar {
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  image: string;
}

function generateMockCars(
  brand: string,
  model: string,
  count: number,
): MockCar[] {
  const fuels = ["Benzín", "Diesel", "Hybrid", "Elektro"];
  const images = [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80",
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80",
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80",
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80",
    "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&q=80",
  ];

  return Array.from({ length: count }, (_, i) => ({
    brand,
    model,
    year: 2018 + Math.floor(Math.random() * 6),
    price: 10000 + Math.floor(Math.random() * 40000),
    mileage: 20000 + Math.floor(Math.random() * 150000),
    fuel: fuels[Math.floor(Math.random() * fuels.length)],
    image: images[i % images.length],
  }));
}

function CarCard({ car }: { car: MockCar }) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[16/10] relative">
        <Image
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-primary">
          {car.brand} {car.model}
        </h3>
        <p className="text-sm text-secondary">
          {car.year} • {car.mileage.toLocaleString()} km • {car.fuel}
        </p>
        <p className="text-xl font-bold text-accent mt-2">
          {car.price.toLocaleString()} €
        </p>
      </div>
    </div>
  );
}
