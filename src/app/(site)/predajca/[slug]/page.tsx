import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceBadge,
  MarketplaceCard,
  MarketplaceContainer,
  MarketplaceIconBadge,
  MarketplacePageShell,
  MarketplaceSection,
  MarketplaceStatCard,
} from "@/components/ui/MarketplacePage";
import { VerifiedIcon } from "@/components/ui/Icons";
import type { MarketCode } from "@/config/markets";
import {
  getVerifiedDealerProfile,
  type PublicDealerListing,
} from "@/lib/dealer/public";
import { buildDealerPublicProfilePath } from "@/lib/dealer/public-profile-path";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { getRequestMarketConfig } from "@/lib/market/request";
import {
  formatPublicCarValue,
  getPublicMarketCopy,
  type PublicMarketCopy,
} from "@/lib/market/public-copy";
import { getMarketPath } from "@/lib/routes";

function getDealerProfileCopy(marketCode: MarketCode) {
  if (marketCode === "RO") {
    return {
      notFoundTitle: "Dealerul nu a fost găsit",
      fallbackDescription: (dealerName: string) =>
        `${dealerName} - profil public de dealer pe Autobazar123.`,
      dealersBreadcrumb: "Dealeri",
      verifiedDealer: "Dealer verificat",
      activeAds: "Anunțuri active",
      soldVehicles: "Vehicule vândute",
      location: "Sediu",
      contact: "Contact",
      website: "Website",
      memberSince: "Membru din",
      activeOffer: (count: number) => `Ofertă activă de vehicule (${count})`,
      emptyTitle: "Acest dealer nu are momentan anunțuri active",
      emptyDescription:
        "Când adaugă vehicule noi, acestea vor apărea automat aici.",
    };
  }

  return {
    notFoundTitle: "Predajca nenájdený",
    fallbackDescription: (dealerName: string) =>
      `${dealerName} - verejný profil predajcu na Autobazar123.`,
    dealersBreadcrumb: "Predajcovia",
    verifiedDealer: "Overený predajca",
    activeAds: "Aktívnych inzerátov",
    soldVehicles: "Predaných vozidiel",
    location: "Pôsobisko",
    contact: "Kontakt",
    website: "Webstránka",
    memberSince: "Členom od",
    activeOffer: (count: number) => `Aktívna ponuka vozidiel (${count})`,
    emptyTitle: "Tento predajca momentálne nemá žiadne aktívne inzeráty",
    emptyDescription:
      "Keď pridá nové vozidlá, zobrazia sa tu automaticky.",
  };
}

function formatPrice(value: number | null, copy: PublicMarketCopy): string {
  if (typeof value !== "number") {
    return copy.vehiclePriceOnRequest;
  }

  return `${value.toLocaleString(copy.languageTag)} €`;
}

function formatMileage(value: number | null, copy: PublicMarketCopy): string {
  if (typeof value !== "number") {
    return copy.mileageUnknown;
  }

  return `${value.toLocaleString(copy.languageTag)} km`;
}

function formatFuel(
  value: string | null,
  marketCode: MarketCode,
  copy: PublicMarketCopy,
): string {
  if (!value) {
    return copy.fuelUnknown;
  }

  return formatPublicCarValue(value, marketCode, "fuel") || value;
}

function formatMemberSince(value: string, copy: PublicMarketCopy): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return copy.notProvided;
  }

  return new Intl.DateTimeFormat(copy.languageTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

function dealerInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "AB";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await connection();

  const { slug } = await params;
  const market = await getRequestMarketConfig();
  const copy = getDealerProfileCopy(market.code);

  const dealer = await getVerifiedDealerProfile(slug);

  if (!dealer) {
    return { title: copy.notFoundTitle };
  }

  const description =
    dealer.description || copy.fallbackDescription(dealer.name);
  const canonicalUrl = `${market.origin}${getMarketPath(buildDealerPublicProfilePath(slug), market.code)}`;

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
  await connection();

  const { slug } = await params;
  const market = await getRequestMarketConfig();
  const marketCopy = getPublicMarketCopy(market);
  const copy = getDealerProfileCopy(market.code);

  const dealer = await getVerifiedDealerProfile(slug);

  if (!dealer) {
    notFound();
  }

  return (
    <MarketplacePageShell>
      <MarketplaceContainer className="space-y-8">
        <section className="market-panel market-hero p-5 sm:p-8 lg:p-10">
          <PublicPageBreadcrumbs
            items={[
              { label: copy.dealersBreadcrumb, href: "/predajcovia" },
              { label: dealer.name },
            ]}
            currentHref={getMarketPath(buildDealerPublicProfilePath(slug), market.code)}
            siteUrl={market.origin}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <DealerLogo name={dealer.name} logoUrl={dealer.logoUrl} size={96} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
                      {dealer.name}
                    </h1>
                    {dealer.isVerified ? (
                      <MarketplaceBadge>
                        <VerifiedIcon className="size-4 text-success" />
                        {copy.verifiedDealer}
                      </MarketplaceBadge>
                    ) : null}
                  </div>
                  {dealer.description ? (
                    <p className="mt-3 max-w-2xl text-secondary">{dealer.description}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <MarketplaceStatCard value={dealer.activeAds} label={copy.activeAds} />
                <MarketplaceStatCard
                  value={dealer.soldCount}
                  label={copy.soldVehicles}
                  tone="success"
                />
                <MarketplaceStatCard
                  value={dealer.city || marketCopy.locationFallback}
                  label={copy.location}
                  tone="accent"
                />
              </div>
            </div>

            <MarketplaceCard>
              <h2 className="text-lg font-semibold text-primary">{copy.contact}</h2>
              <div className="mt-4 space-y-4 text-sm">
                {dealer.address || dealer.city ? (
                  <ContactRow
                    icon={
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    }
                  >
                    <span className="text-secondary">
                      {[dealer.address, dealer.city].filter(Boolean).join(", ")}
                    </span>
                  </ContactRow>
                ) : null}
                {dealer.phone ? (
                  <ContactRow
                    icon={
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    }
                  >
                    <a
                      href={`tel:${dealer.phone.replace(/\s+/g, "")}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {dealer.phone}
                    </a>
                  </ContactRow>
                ) : null}
                {dealer.websiteUrl ? (
                  <ContactRow
                    icon={
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    }
                  >
                    <a
                      href={dealer.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      {copy.website}
                    </a>
                  </ContactRow>
                ) : null}
              </div>
              <div className="mt-5 border-t border-border pt-4 text-xs text-tertiary">
                {copy.memberSince} {formatMemberSince(dealer.memberSince, marketCopy)}
              </div>
            </MarketplaceCard>
          </div>
        </section>

        <MarketplaceSection
          title={copy.activeOffer(dealer.activeListings.length)}
        >
          {dealer.activeListings.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dealer.activeListings.map((car) => (
                <DealerCarCard
                  key={car.id}
                  car={car}
                  marketCode={market.code}
                  copy={marketCopy}
                />
              ))}
            </div>
          ) : (
            <MarketplaceCard className="border-dashed py-12 text-center">
              <h2 className="text-lg font-semibold text-primary">
                {copy.emptyTitle}
              </h2>
              <p className="mt-3 text-secondary">
                {copy.emptyDescription}
              </p>
            </MarketplaceCard>
          )}
        </MarketplaceSection>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}

function DealerLogo({
  name,
  logoUrl,
  size,
}: {
  name: string;
  logoUrl: string | null;
  size: number;
}) {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-lg border border-border bg-surface" style={{ width: size, height: size }}>
      {logoUrl ? (
        <Image
          src={optimizeCloudflareImage(logoUrl, {
            width: size * 2,
            height: size * 2,
            fit: "cover",
            quality: 84,
            format: "auto",
          })}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-background-muted text-xl font-bold text-primary">
          {dealerInitials(name)}
        </div>
      )}
    </div>
  );
}

function ContactRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <MarketplaceIconBadge className="min-h-8 min-w-8">
        {icon}
      </MarketplaceIconBadge>
      <div>{children}</div>
    </div>
  );
}

function DealerCarCard({
  car,
  marketCode,
  copy,
}: {
  car: PublicDealerListing;
  marketCode: MarketCode;
  copy: PublicMarketCopy;
}) {
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
      className={`market-card block overflow-hidden ${
        car.isHighlighted ? "border-accent/30 bg-accent/5" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        <Image
          src={imageSrc}
          alt={`${car.brand} ${car.model}`}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover"
        />
        {car.isTop ? (
          <span className="absolute left-2 top-2 rounded bg-accent px-2 py-1 text-xs font-semibold text-white">
            Exclusive
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-primary">
          {car.brand} {car.model}
        </h3>
        <p className="mt-1 text-sm text-secondary">
          {[
            car.year || copy.yearUnknown,
            formatMileage(car.mileageKm, copy),
            formatFuel(car.fuel, marketCode, copy),
          ].join(" / ")}
        </p>
        <p className="mt-2 text-xl font-bold text-accent">
          {formatPrice(car.priceEur, copy)}
        </p>
      </div>
    </Link>
  );
}
