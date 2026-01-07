import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Mock dealer data
const MOCK_DEALERS: Record<string, {
    name: string;
    slug: string;
    logo?: string;
    description: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website?: string;
    verified: boolean;
    memberSince: string;
    totalAds: number;
    soldCount: number;
    rating: number;
    openingHours: string;
}> = {
    "automax-zilina": {
        name: "AutoMax Žilina",
        slug: "automax-zilina",
        description: "Predaj kvalitných ojazdených vozidiel s garanciou. Pôsobíme na trhu už 15 rokov. Všetky vozidlá prechádzajú dôkladnou technickou kontrolou.",
        address: "Vysokoškolákov 8556/33B",
        city: "Žilina",
        phone: "+421 900 123 456",
        email: "info@automax-zilina.sk",
        website: "https://automax-zilina.sk",
        verified: true,
        memberSince: "2020-03-15",
        totalAds: 45,
        soldCount: 312,
        rating: 4.8,
        openingHours: "Po-Pi: 9:00-18:00, So: 9:00-13:00",
    },
    "premium-cars-ba": {
        name: "Premium Cars Bratislava",
        slug: "premium-cars-ba",
        description: "Luxusné a prémiové vozidlá. BMW, Mercedes, Audi, Porsche. Autorizovaný predajca ojazdených vozidiel s certifikátom kvality.",
        address: "Einsteinova 25",
        city: "Bratislava",
        phone: "+421 900 789 012",
        email: "predaj@premiumcars.sk",
        website: "https://premiumcars.sk",
        verified: true,
        memberSince: "2019-08-22",
        totalAds: 28,
        soldCount: 156,
        rating: 4.9,
        openingHours: "Po-Pi: 8:00-19:00, So: 9:00-15:00",
    },
};

// Generate static params for known dealers
export async function generateStaticParams() {
    return Object.keys(MOCK_DEALERS).map((slug) => ({ slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const dealer = MOCK_DEALERS[slug];

    if (!dealer) {
        return { title: "Predajca nenájdený" };
    }

    return {
        title: `${dealer.name} | Autobazar123`,
        description: `${dealer.name} - ${dealer.description.slice(0, 150)}...`,
        openGraph: {
            title: dealer.name,
            description: dealer.description,
        },
    };
}

// Mock cars for dealer
function generateDealerCars(dealerName: string, count: number) {
    const brands = ["BMW", "Mercedes", "Audi", "Volkswagen", "Škoda"];
    const models: Record<string, string[]> = {
        BMW: ["320d", "520d", "X3", "X5"],
        Mercedes: ["C220d", "E350d", "GLC"],
        Audi: ["A4", "A6", "Q5"],
        Volkswagen: ["Passat", "Tiguan", "Golf"],
        Škoda: ["Octavia", "Superb", "Kodiaq"],
    };
    const images = [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80",
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80",
    ];

    return Array.from({ length: count }, (_, i) => {
        const brand = brands[i % brands.length];
        const model = models[brand][i % models[brand].length];
        return {
            id: `dealer-car-${i}`,
            brand,
            model,
            year: 2019 + Math.floor(Math.random() * 5),
            price: 15000 + Math.floor(Math.random() * 45000),
            mileage: 20000 + Math.floor(Math.random() * 120000),
            fuel: ["Diesel", "Benzín", "Hybrid"][i % 3],
            image: images[i % images.length],
            isTop: i < 2,
            isHighlighted: i < 4,
        };
    });
}

export default async function DealerStorefrontPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const dealer = MOCK_DEALERS[slug];

    if (!dealer) {
        notFound();
    }

    const cars = generateDealerCars(dealer.name, 12);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-20 pb-16">
                {/* Header */}
                <div className="bg-gradient-to-br from-accent/5 to-transparent border-b border-border">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            {/* Logo/Avatar */}
                            <div className="w-24 h-24 rounded-2xl bg-surface border border-border flex items-center justify-center text-4xl shrink-0">
                                🏪
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-primary">{dealer.name}</h1>
                                    {dealer.verified && (
                                        <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                                            ✓ Overený predajca
                                        </span>
                                    )}
                                </div>
                                <p className="text-secondary max-w-2xl mb-4">{dealer.description}</p>

                                {/* Stats */}
                                <div className="flex flex-wrap gap-6">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{dealer.totalAds}</p>
                                        <p className="text-sm text-secondary">Aktívnych inzerátov</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-success">{dealer.soldCount}</p>
                                        <p className="text-sm text-secondary">Predaných vozidiel</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-accent">⭐ {dealer.rating}</p>
                                        <p className="text-sm text-secondary">Hodnotenie</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Card */}
                            <div className="w-full md:w-80 p-6 rounded-2xl bg-background border border-border shadow-lg shrink-0">
                                <h3 className="font-semibold text-primary mb-4">Kontakt</h3>
                                <div className="space-y-3 text-sm">
                                    <p className="flex items-center gap-3">
                                        <span>📍</span>
                                        <span className="text-secondary">
                                            {dealer.address}, {dealer.city}
                                        </span>
                                    </p>
                                    <p className="flex items-center gap-3">
                                        <span>📞</span>
                                        <a href={`tel:${dealer.phone}`} className="text-accent hover:underline">
                                            {dealer.phone}
                                        </a>
                                    </p>
                                    <p className="flex items-center gap-3">
                                        <span>✉️</span>
                                        <a href={`mailto:${dealer.email}`} className="text-accent hover:underline">
                                            {dealer.email}
                                        </a>
                                    </p>
                                    {dealer.website && (
                                        <p className="flex items-center gap-3">
                                            <span>🌐</span>
                                            <a
                                                href={dealer.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-accent hover:underline"
                                            >
                                                Webstránka
                                            </a>
                                        </p>
                                    )}
                                    <p className="flex items-center gap-3">
                                        <span>🕐</span>
                                        <span className="text-secondary">{dealer.openingHours}</span>
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border text-xs text-tertiary">
                                    Členom od {new Date(dealer.memberSince).toLocaleDateString("sk-SK")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cars Grid */}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-primary">
                            Ponuka vozidiel ({cars.length})
                        </h2>
                        <select className="form-select text-sm">
                            <option>Najnovšie</option>
                            <option>Najlacnejšie</option>
                            <option>Najdrahšie</option>
                        </select>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {cars.map((car) => (
                            <DealerCarCard key={car.id} car={car} />
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function DealerCarCard({ car }: { car: ReturnType<typeof generateDealerCars>[0] }) {
    return (
        <Link
            href={`/auto/${car.id}`}
            className={`group rounded-2xl overflow-hidden border transition-all hover:shadow-lg ${car.isHighlighted
                    ? "border-accent/30 bg-accent/5"
                    : "border-border"
                }`}
        >
            <div className="aspect-[16/10] relative overflow-hidden">
                <img
                    src={car.image}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {car.isTop && (
                    <span className="absolute top-2 left-2 px-2 py-1 rounded bg-accent text-white text-xs font-semibold">
                        TOP
                    </span>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                    {car.brand} {car.model}
                </h3>
                <p className="text-sm text-secondary mt-1">
                    {car.year} • {car.mileage.toLocaleString()} km • {car.fuel}
                </p>
                <p className="text-xl font-bold text-accent mt-2">
                    {car.price.toLocaleString()} €
                </p>
            </div>
        </Link>
    );
}
