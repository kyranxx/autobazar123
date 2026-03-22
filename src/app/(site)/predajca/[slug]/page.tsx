import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { BRAND_URL } from "@/config/brand";
import {
  getVerifiedDealerProfile,
  getVerifiedDealerSlugs,
  type PublicDealerListing,
} from "@/lib/dealer/public";
import { buildDealerPublicProfilePath } from "@/lib/dealer/public-profile-path";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";

const FUEL_LABELS: Record<string, string> = {
  petrol: "Benzín",
  diesel: "Nafta",
  hybrid: "Hybrid",
  electric: "Elektro",
  lpg: "LPG",
  cng: "CNG",
};

function formatPrice(value: number | null): string {
  if (typeof value !== "number") {
    return "Cena na vyžiadanie";
  }

  return `${value.toLocaleString("sk-SK")} €`;
}

function formatMileage(value: number | null): string {
  if (typeof value !== "number") {
    return "Najazdené neuvedené";
  }

  return `${value.toLocaleString("sk-SK")} km`;
}

function formatFuel(value: string | null): string {
  if (!value) {
    return "Palivo neuvedené";
  }

  return FUEL_LABELS[value] || value;
}

function formatMemberSince(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "Neuvedené";
  }

  return new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

export async function generateStaticParams() {
  return (await getVerifiedDealerSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dealer = await getVerifiedDealerProfile(slug);

  if (!dealer) {
    return { title: "Predajca nenájdený" };
  }

  const description = dealer.description
    || `${dealer.name} - verejný profil overeného predajcu na Autobazar123.`;
  const canonicalUrl = `${BRAND_URL}${buildDealerPublicProfilePath(slug)}`;

  return {
    title: `${dealer.name} | Autobazar123`,
    description,
    openGraph: {
      title: dealer.name,
      description,
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function DealerStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dealer = await getVerifiedDealerProfile(slug);

  if (!dealer) {
    notFound();
  }

  const dealerUrl = `${BRAND_URL}${buildDealerPublicProfilePath(slug)}`;
  const breadcrumbItems = [
    { name: "Domov", url: BRAND_URL },
    { name: "Predajcovia", url: `${BRAND_URL}/predajcovia` },
    { name: dealer.name, url: dealerUrl },
  ];

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <main className="pt-20 pb-16">
        <div className="bg-gradient-to-br from-accent/5 to-transparent border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface">
                {dealer.logoUrl ? (
                  <Image
                    src={optimizeCloudflareImage(dealer.logoUrl, {
                      width: 192,
                      height: 192,
                      fit: "cover",
                      quality: 84,
                      format: "auto",
                    })}
                    alt={dealer.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    🏪
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-primary">
                    {dealer.name}
                  </h1>
                  {dealer.isVerified ? (
                    <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                      ✓ Overený predajca
                    </span>
                  ) : null}
                </div>
                {dealer.description ? (
                  <p className="text-secondary max-w-2xl mb-4">
                    {dealer.description}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {dealer.activeAds}
                    </p>
                    <p className="text-sm text-secondary">
                      Aktívnych inzerátov
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">
                      {dealer.soldCount}
                    </p>
                    <p className="text-sm text-secondary">Predaných vozidiel</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">
                      {dealer.city || "Slovensko"}
                    </p>
                    <p className="text-sm text-secondary">Pôsobisko</p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-80 p-6 rounded-2xl bg-background border border-border shadow-lg shrink-0">
                <h3 className="font-semibold text-primary mb-4">Kontakt</h3>
                <div className="space-y-3 text-sm">
                  {dealer.address || dealer.city ? (
                    <p className="flex items-start gap-3">
                      <span>📍</span>
                      <span className="text-secondary">
                        {[dealer.address, dealer.city].filter(Boolean).join(", ")}
                      </span>
                    </p>
                  ) : null}
                  {dealer.phone ? (
                    <p className="flex items-center gap-3">
                      <span>📞</span>
                      <a
                        href={`tel:${dealer.phone.replace(/\s+/g, "")}`}
                        className="text-accent hover:underline"
                      >
                        {dealer.phone}
                      </a>
                    </p>
                  ) : null}
                  {dealer.ownerEmail ? (
                    <p className="flex items-center gap-3">
                      <span>✉️</span>
                      <a
                        href={`mailto:${dealer.ownerEmail}`}
                        className="text-accent hover:underline"
                      >
                        {dealer.ownerEmail}
                      </a>
                    </p>
                  ) : null}
                  {dealer.websiteUrl ? (
                    <p className="flex items-center gap-3">
                      <span>🌐</span>
                      <a
                        href={dealer.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Webstránka
                      </a>
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 pt-4 border-t border-border text-xs text-tertiary">
                  Členom od {formatMemberSince(dealer.memberSince)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary">
              Aktívna ponuka vozidiel ({dealer.activeListings.length})
            </h2>
          </div>

          {dealer.activeListings.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dealer.activeListings.map((car) => (
                <DealerCarCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-primary">
                Tento predajca momentálne nemá žiadne aktívne inzeráty
              </h3>
              <p className="mt-3 text-secondary">
                Keď pridá nové vozidlá, zobrazia sa tu automaticky.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DealerCarCard({ car }: { car: PublicDealerListing }) {
  const imageSrc = optimizeCloudflareImage(car.photos[0] || "/placeholder-car.jpg", {
    width: 640,
    height: 400,
    fit: "cover",
    quality: 82,
    format: "auto",
  });

  return (
    <Link
      href={car.href}
      className={`rounded-2xl overflow-hidden border transition-colors ${
        car.isHighlighted ? "border-accent/30 bg-accent/5" : "border-border"
      }`}
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-surface">
        <Image
          src={imageSrc}
          alt={`${car.brand} ${car.model}`}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover"
        />
        {car.isTop ? (
          <span className="absolute top-2 left-2 px-2 py-1 rounded bg-accent text-white text-xs font-semibold">
            TOP
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-primary">
          {car.brand} {car.model}
        </h3>
        <p className="text-sm text-secondary mt-1">
          {[car.year || "Rok neuvedený", formatMileage(car.mileageKm), formatFuel(car.fuel)].join(" • ")}
        </p>
        <p className="text-xl font-bold text-accent mt-2">
          {formatPrice(car.priceEur)}
        </p>
      </div>
    </Link>
  );
}
