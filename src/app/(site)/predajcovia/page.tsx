import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Overení predajcovia | Autobazar123",
  description:
    "Zoznam overených predajcov vozidiel na Autobazar123. Nakupujte od dôveryhodných predajcov.",
};

// Mock dealers data
const VERIFIED_DEALERS = [
  {
    id: "1",
    name: "AutoMax Žilina",
    slug: "automax-zilina",
    city: "Žilina",
    activeAds: 45,
    soldCount: 312,
    rating: 4.8,
    verified: true,
    memberSince: "2020",
  },
  {
    id: "2",
    name: "Premium Cars Bratislava",
    slug: "premium-cars-ba",
    city: "Bratislava",
    activeAds: 28,
    soldCount: 156,
    rating: 4.9,
    verified: true,
    memberSince: "2019",
  },
  {
    id: "3",
    name: "Auto Centrum Košice",
    slug: "auto-centrum-ke",
    city: "Košice",
    activeAds: 67,
    soldCount: 489,
    rating: 4.7,
    verified: true,
    memberSince: "2018",
  },
  {
    id: "4",
    name: "Family Cars Nitra",
    slug: "family-cars-nitra",
    city: "Nitra",
    activeAds: 23,
    soldCount: 98,
    rating: 4.6,
    verified: true,
    memberSince: "2021",
  },
];

export default function DealersPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="py-12 text-center">
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              Overení predajcovia
            </h1>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              Nakupujte od dôveryhodných predajcov s overenou históriou predaja
              a pozitívnymi recenziami.
            </p>
          </div>

          {/* Dealers Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VERIFIED_DEALERS.map((dealer) => (
              <Link
                key={dealer.id}
                href={`/predajca/${dealer.slug}`}
                className="group rounded-2xl border border-border p-6 hover:shadow-lg hover:border-accent/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center text-2xl shrink-0">
                    🏪
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-primary group-hover:text-accent truncate">
                        {dealer.name}
                      </h3>
                      {dealer.verified && (
                        <span className="text-success text-sm">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-secondary">{dealer.city}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {dealer.activeAds}
                    </p>
                    <p className="text-xs text-secondary">Inzerátov</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-success">
                      {dealer.soldCount}
                    </p>
                    <p className="text-xs text-secondary">Predaných</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-accent">
                      ⭐ {dealer.rating}
                    </p>
                    <p className="text-xs text-secondary">Hodnotenie</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border text-xs text-tertiary">
                  Členom od {dealer.memberSince}
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
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

