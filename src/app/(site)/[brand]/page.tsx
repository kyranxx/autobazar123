import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/JsonLd";

// Same data as model page
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

export async function generateStaticParams() {
  return Object.keys(BRANDS_DATA).map((brand) => ({ brand }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const brandData = BRANDS_DATA[brand];

  if (!brandData) {
    return { title: "NenĂˇjdenĂ©" };
  }

  return {
    title: `${brandData.name} | Predaj na Slovensku | Autobazar123`,
    description: `VĹˇetky modely ${brandData.name} na predaj na Slovensku. ${brandData.models.length} modelov, stovky overenĂ˝ch inzerĂˇtov.`,
    keywords: [
      brandData.name,
      `${brandData.name} predaj`,
      `${brandData.name} bazar`,
      `kĂşpiĹĄ ${brandData.name}`,
    ],
    alternates: {
      canonical: `https://autobazar123.sk/${brand}`,
    },
  };
}

function formatModelName(model: string): string {
  return model
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const brandData = BRANDS_DATA[brand];

  if (!brandData) {
    notFound();
  }
  const brandUrl = `https://autobazar123.sk/${brand}`;
  const breadcrumbItems = [
    { name: "Domov", url: "https://autobazar123.sk" },
    { name: "Auta", url: "https://autobazar123.sk/vysledky" },
    { name: brandData.name, url: brandUrl },
  ];

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
              <li className="text-primary font-medium">{brandData.name}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              {brandData.name} - vĹˇetky modely
            </h1>
            <p className="mt-3 text-lg text-secondary max-w-2xl">
              PreskĂşmajte vĹˇetky modely {brandData.name} na predaj na Slovensku.
              Vyberte si model a nĂˇjdite svoje vysnĂ­vanĂ©vozidlo.
            </p>
          </div>

          {/* Models Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brandData.models.map((model) => (
              <Link
                key={model}
                href={`/${brand}/${model}`}
                className="group p-6 rounded-2xl border border-border hover:border-accent hover:shadow-lg transition-all"
              >
                <h2 className="text-xl font-semibold text-primary group-hover:text-accent">
                  {brandData.name} {formatModelName(model)}
                </h2>
                <p className="mt-2 text-sm text-secondary">
                  ZobraziĹĄ vĹˇetky inzerĂˇty â†’
                </p>
              </Link>
            ))}
          </div>

          {/* SEO Content */}
          <div className="mt-16 prose max-w-none">
            <h2 className="text-2xl font-bold text-primary mb-4">
              O znaÄŤke {brandData.name}
            </h2>
            <p className="text-secondary mb-4">
              {brandData.name} je jednou z najpopulĂˇrnejĹˇĂ­ch automobilovĂ˝ch
              znaÄŤiek na Slovensku. Na Autobazar123 nĂˇjdete ĹˇirokĂ˝ vĂ˝ber{" "}
              {brandData.name}
              od sĂşkromnĂ˝ch predajcov aj overenĂ˝ch autobazĂˇrov.
            </p>
            <p className="text-secondary">
              PonĂşkame {brandData.models.length} modelov znaÄŤky {brandData.name}
              , vrĂˇtane najnovĹˇĂ­ch aj klasickĂ˝ch verziĂ­. KaĹľdĂ˝ inzerĂˇt obsahuje
              detailnĂ© informĂˇcie, fotogalĂ©riu a priamy kontakt na predajcu.
            </p>
          </div>

          {/* Other Brands */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-primary mb-6">
              ÄŽalĹˇie znaÄŤky
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(BRANDS_DATA)
                .filter(([key]) => key !== brand)
                .map(([key, data]) => (
                  <Link
                    key={key}
                    href={`/${key}`}
                    className="px-5 py-2.5 rounded-full border border-border text-primary hover:border-accent hover:text-accent transition-colors"
                  >
                    {data.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

