import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CREDIT_PACKS, ACTION_COSTS } from "@/config/credits";

export const metadata: Metadata = {
    title: "Cenník | Autobazar123",
    description: "Prehľadný cenník inzercie na Autobazar123. Kredity, TOP inzeráty, zvýraznenia.",
};

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-20 pb-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="py-12 text-center">
                        <h1 className="text-3xl font-bold text-primary sm:text-4xl">
                            Cenník
                        </h1>
                        <p className="mt-4 text-lg text-secondary">
                            Jednoduchý kreditový systém. 1 kredit = 1 €
                        </p>
                    </div>

                    {/* Credit Packs */}
                    <section className="mb-16">
                        <h2 className="text-xl font-semibold text-primary mb-6 text-center">
                            Kreditové balíčky
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {CREDIT_PACKS.map((pack) => (
                                <div
                                    key={pack.id}
                                    className={`relative p-6 rounded-2xl border-2 text-center ${pack.featured
                                            ? "border-accent bg-accent/5"
                                            : "border-border"
                                        }`}
                                >
                                    {pack.featured && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
                                            Obľúbené
                                        </span>
                                    )}
                                    <p className="text-3xl font-bold text-primary">{pack.credits}</p>
                                    <p className="text-sm text-secondary">kreditov</p>
                                    <p className="mt-3 text-2xl font-bold text-accent">{pack.price} €</p>
                                    {pack.discount > 0 && (
                                        <span className="text-xs text-success font-medium">
                                            Ušetríte {pack.discount}%
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Action Costs */}
                    <section className="mb-16">
                        <h2 className="text-xl font-semibold text-primary mb-6 text-center">
                            Čo môžete za kredity
                        </h2>
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-surface">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Akcia</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Popis</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-primary">Cena</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ACTION_COSTS.map((action, idx) => (
                                        <tr key={action.id} className={idx % 2 === 0 ? "" : "bg-surface/50"}>
                                            <td className="px-6 py-4 font-medium text-primary">{action.nameSk}</td>
                                            <td className="px-6 py-4 text-secondary text-sm">{action.descriptionSk}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-accent">{action.credits} kr</span>
                                                <span className="text-xs text-secondary block">{action.duration}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* CTA */}
                    <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                        <h2 className="text-xl font-semibold text-primary">Pripravení začať?</h2>
                        <p className="mt-2 text-secondary">
                            Kúpte si kredity a začnite predávať ešte dnes.
                        </p>
                        <Link
                            href="/kredity"
                            className="inline-block mt-4 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover"
                        >
                            Kúpiť kredity
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
