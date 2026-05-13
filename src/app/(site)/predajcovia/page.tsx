import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND_URL } from "@/config/brand";
import { getVerifiedDealerSummaries } from "@/lib/dealer/public";
import { buildDealerPublicProfilePath } from "@/lib/dealer/public-profile-path";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";

const SITE_URL = BRAND_URL;
const MEMBER_SINCE_YEAR_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  year: "numeric",
});

export const metadata: Metadata = {
  title: "Overení predajcovia | Autobazar123",
  description:
    "Zoznam overených predajcov vozidiel na Autobazar123. Nakupujte od dôveryhodných predajcov.",
  alternates: {
    canonical: `${SITE_URL}/predajcovia`,
  },
};

function formatMemberSinceYear(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "";
  }

  return MEMBER_SINCE_YEAR_FORMATTER.format(new Date(timestamp));
}

export default async function DealersPage() {
  const dealers = await getVerifiedDealerSummaries();

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 text-center">
            <h1 className="text-3xl font-semibold text-primary sm:text-4xl">
              Overení predajcovia
            </h1>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              Nakupujte od dôveryhodných predajcov s overenou históriou predaja
              a reálnou ponukou vozidiel.
            </p>
          </div>

          {dealers.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dealers.map((dealer) => (
                <Link
                  key={dealer.id}
                  href={buildDealerPublicProfilePath(dealer.slug)}
                  className="group rounded-2xl border border-border p-6 hover:shadow-lg hover:border-accent/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-surface">
                      {dealer.logoUrl ? (
                        <Image
                          src={optimizeCloudflareImage(dealer.logoUrl, {
                            width: 128,
                            height: 128,
                            fit: "cover",
                            quality: 82,
                            format: "auto",
                          })}
                          alt={dealer.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-2xl">
                          🏪
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-primary group-hover:text-accent truncate">
                          {dealer.name}
                        </h3>
                        {dealer.isVerified ? (
                          <span className="text-success text-sm">✓</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-secondary">{dealer.city || "Slovensko"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{dealer.activeAds}</p>
                      <p className="text-xs text-secondary">Aktívnych</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-success">{dealer.soldCount}</p>
                      <p className="text-xs text-secondary">Predaných</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-accent">
                        {formatMemberSinceYear(dealer.memberSince) || "—"}
                      </p>
                      <p className="text-xs text-secondary">Člen od</p>
                    </div>
                  </div>

                  {dealer.description ? (
                    <p className="mt-4 text-sm leading-relaxed text-secondary line-clamp-3">
                      {dealer.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
              <h2 className="text-xl font-semibold text-primary">
                Zatiaľ tu nie sú žiadni overení predajcovia
              </h2>
              <p className="mt-3 text-secondary">
                Po schválení prvých dealer profilov sa zobrazia na tejto stránke.
              </p>
            </div>
          )}

          <div className="mt-12 text-center p-8 rounded-2xl bg-surface">
            <h2 className="text-xl font-semibold text-primary">
              Ste autobazár?
            </h2>
            <p className="mt-2 text-secondary">
              Staňte sa overeným predajcom a získajte viac zákazníkov.
            </p>
            <Link
              href="/dealer"
              className="inline-block mt-4 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
            >
              Registrovať sa ako predajca
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
