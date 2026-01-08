import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
    title: "O nás | Autobazar123",
    description:
        "Spoznajte Autobazar123 - prémiovú platformu pre predaj a kúpu ojazdených áut na Slovensku. Naším cieľom je transparentnosť a bezpečnosť pri každej transakcii.",
    openGraph: {
        title: "O nás | Autobazar123",
        description:
            "Spoznajte Autobazar123 - prémiovú platformu pre predaj a kúpu ojazdených áut na Slovensku.",
    },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-20 pb-16">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Hero */}
                    <div className="py-12 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">
                            O nás
                        </h1>
                        <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
                            Prémiová platforma pre kúpu a predaj áut na Slovensku
                        </p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-lg max-w-none">
                        {/* Mission */}
                        <section className="mb-12">
                            <div className="p-8 rounded-2xl border border-border bg-surface/30">
                                <h2 className="text-2xl font-bold text-primary mb-4">
                                    Naša misia
                                </h2>
                                <p className="text-secondary leading-relaxed">
                                    Autobazar123 vznikol s jedným jasným cieľom – priniesť na slovenský trh
                                    s ojazdenými autami transparentnosť, bezpečnosť a prémiový zážitok.
                                    Veríme, že kúpa alebo predaj auta by mal byť jednoduchý, rýchly a
                                    príjemný proces.
                                </p>
                            </div>
                        </section>

                        {/* Values */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-primary mb-6">
                                Naše hodnoty
                            </h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="p-6 rounded-xl border border-border bg-background">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-primary mb-2">Transparentnosť</h3>
                                    <p className="text-sm text-secondary">
                                        Každý inzerát obsahuje overené informácie o vozidle, vrátane histórie a technického stavu.
                                    </p>
                                </div>
                                <div className="p-6 rounded-xl border border-border bg-background">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-primary mb-2">Bezpečnosť</h3>
                                    <p className="text-sm text-secondary">
                                        Overení predajcovia, bezpečné platby cez Stripe a ochrana osobných údajov.
                                    </p>
                                </div>
                                <div className="p-6 rounded-xl border border-border bg-background">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-primary mb-2">Rýchlosť</h3>
                                    <p className="text-sm text-secondary">
                                        Inzerát online za menej ako minútu. Žiadne čakanie na schválenie.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Stats */}
                        <section className="mb-12">
                            <div className="grid gap-6 sm:grid-cols-3 text-center">
                                <div className="p-6 rounded-xl bg-accent/5">
                                    <div className="text-3xl font-bold text-accent">1 247+</div>
                                    <div className="mt-1 text-sm text-secondary">Aktívnych inzerátov</div>
                                </div>
                                <div className="p-6 rounded-xl bg-accent/5">
                                    <div className="text-3xl font-bold text-accent">500+</div>
                                    <div className="mt-1 text-sm text-secondary">Overených predajcov</div>
                                </div>
                                <div className="p-6 rounded-xl bg-accent/5">
                                    <div className="text-3xl font-bold text-accent">98%</div>
                                    <div className="mt-1 text-sm text-secondary">Spokojných zákazníkov</div>
                                </div>
                            </div>
                        </section>

                        {/* Team */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-primary mb-6">
                                Náš tím
                            </h2>
                            <p className="text-secondary leading-relaxed mb-6">
                                Za Autobazar123 stojí tím skúsených profesionálov z oblasti automobilového
                                priemyslu a technológií. Spájame dlhoročné skúsenosti s modernými
                                technológiami, aby sme vám priniesli najlepší možný zážitok.
                            </p>
                        </section>

                        {/* CTA */}
                        <section className="text-center py-8">
                            <h2 className="text-xl font-bold text-primary mb-4">
                                Máte otázky?
                            </h2>
                            <p className="text-secondary mb-6">
                                Neváhajte nás kontaktovať. Radi vám pomôžeme.
                            </p>
                            <Link
                                href="/kontakt"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                            >
                                Kontaktujte nás
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
