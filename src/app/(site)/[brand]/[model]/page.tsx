import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { getSeoInventoryListings, type SeoInventoryListing } from "@/lib/seo/inventory";

// Mock data for brands and models
const BRANDS_DATA: Record<string, { name: string; models: string[] }> = {
  skoda: {
    name: "Ĺ koda",
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
    return { title: "NenĂˇjdenĂ©" };
  }

  const brandName = brandData.name;
  const modelName = formatModelName(model);

  return {
    title: `${brandName} ${modelName} | Predaj na Slovensku | Autobazar123`,
    description: `NajlepĹˇie ponuky ${brandName} ${modelName} na Slovensku. PreskĂşmajte stovky overenĂ˝ch inzerĂˇtov s garanciou kvality na Autobazar123.`,
    keywords: [
      `${brandName} ${modelName}`,
      `${brandName} ${modelName} predaj`,
      `${brandName} ${modelName} bazar`,
      `${brandName} ${modelName} ojazdenĂ©`,
      `kĂşpiĹĄ ${brandName} ${modelName}`,
    ],
    openGraph: {
      title: `${brandName} ${modelName} na predaj | Autobazar123`,
      description: `NajlepĹˇie ponuky ${brandName} ${modelName} na Slovensku.`,
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

  const cars = await getSeoInventoryListings({
    brandName,
    modelName,
    limit: 12,
  });

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={breadcrumbItems} />
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
                  AutĂˇ
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
              PreskĂşmajte najlepĹˇie ponuky {brandName} {modelName} na Slovensku.
              VĹˇetky inzerĂˇty od overenĂ˝ch predajcov s garanciou kvality.
            </p>
          </div>

          {/* Quick Filters by City */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-secondary mb-3">
              {brandName} {modelName} podÄľa mesta:
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
          {cars.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-secondary">
                Momentalne nemame realne inzeraty pre {brandName} {modelName}.
              </p>
              <Link
                href={`/vysledky?brand=${encodeURIComponent(brandName)}&model=${encodeURIComponent(modelName)}`}
                className="mt-4 inline-flex rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white"
              >
                Zobrazit vysledky vo vyhladavani
              </Link>
            </div>
          )}

          {/* SEO Content */}
          <div className="mt-16 prose max-w-none">
            <h2 className="text-2xl font-bold text-primary mb-4">
              O modeli {brandName} {modelName}
            </h2>
            <p className="text-secondary mb-4">
              {brandName} {modelName} je jednĂ˝m z najpopulĂˇrnejĹˇĂ­ch modelov na
              slovenskom trhu. VÄŹaka svojmu vĂ˝konu, spoÄľahlivosti a modernĂ˝m
              technolĂłgiĂˇm si zĂ­skal srdcia mnohĂ˝ch slovenskĂ˝ch motoristov.
            </p>
            <p className="text-secondary mb-4">
              Na Autobazar123 nĂˇjdete ĹˇirokĂ˝ vĂ˝ber {brandName} {modelName} od
              sĂşkromnĂ˝ch predajcov aj overenĂ˝ch autobazĂˇrov. KaĹľdĂ˝ inzerĂˇt
              obsahuje detailnĂ© informĂˇcie o vozidle, fotogalĂ©riu a kontakt na
              predajcu.
            </p>

            <h2 className="text-xl font-bold text-primary mt-8 mb-4">
              PreÄŤo kĂşpiĹĄ {brandName} {modelName} cez Autobazar123?
            </h2>
            <ul className="list-disc pl-6 text-secondary space-y-2">
              <li>OverenĂ­ predajcovia s garanciou kvality</li>
              <li>DetailnĂ© fotografie a technickĂ© Ăşdaje</li>
              <li>TransparentnĂˇ histĂłria vozidla</li>
              <li>BezpeÄŤnĂˇ komunikĂˇcia s predajcom</li>
              <li>KalkulaÄŤka leasingu a financovania</li>
            </ul>
          </div>

          {/* Related Models */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-primary mb-6">
              ÄŽalĹˇie modely {brandName}
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
    </div>
  );
}

function formatCityName(city: string): string {
  const cityNames: Record<string, string> = {
    bratislava: "Bratislava",
    kosice: "KoĹˇice",
    zilina: "Ĺ˝ilina",
    presov: "PreĹˇov",
    nitra: "Nitra",
    "banska-bystrica": "BanskĂˇ Bystrica",
    trnava: "Trnava",
    trencin: "TrenÄŤĂ­n",
  };
  return cityNames[city] || city;
}

function CarCard({ car }: { car: SeoInventoryListing }) {
  return (
    <Link
      href={`/auto/${car.id}`}
      className="block rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
    >
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
          {car.year ?? "-"} - {car.mileageKm?.toLocaleString("sk-SK") ?? "-"} km -{" "}
          {car.fuel || "-"}
        </p>
        <p className="text-xl font-bold text-accent mt-2">
          {car.priceEur?.toLocaleString("sk-SK") ?? "-"} EUR
        </p>
      </div>
    </Link>
  );
}

