import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Ochrana osobných údajov | Autobazar123",
    description: "Zásady ochrany osobných údajov platformy Autobazar123 v súlade s GDPR.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                    <h1 className="text-3xl font-bold text-primary mb-8">
                        Ochrana osobných údajov
                    </h1>

                    <div className="prose prose-lg max-w-none text-secondary">
                        <p className="text-sm text-tertiary mb-8">
                            Platné od: 1. januára 2026 | V súlade s GDPR (Nariadenie EÚ 2016/679)
                        </p>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                1. Prevádzkovateľ
                            </h2>
                            <p>
                                Prevádzkovateľom osobných údajov je Autobazar123 s.r.o., IČO: XX XXX XXX,
                                so sídlom [adresa]. Pre otázky týkajúce sa ochrany údajov nás
                                kontaktujte na: <a href="mailto:gdpr@autobazar123.sk" className="text-accent hover:underline">gdpr@autobazar123.sk</a>
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                2. Aké údaje zbierame
                            </h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Registračné údaje:</strong> meno, e-mail, telefón</li>
                                <li><strong>Údaje o inzerátoch:</strong> fotografie, popis vozidla, cena</li>
                                <li><strong>Platobné údaje:</strong> spracované cez Stripe (nekopírujeme karty)</li>
                                <li><strong>Technické údaje:</strong> IP adresa, cookies, typ prehliadača</li>
                                <li><strong>Komunikácia:</strong> správy medzi používateľmi</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                3. Účel spracovania
                            </h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Poskytovanie služby inzercie vozidiel</li>
                                <li>Spracovanie platieb za kredity</li>
                                <li>Komunikácia o stave inzerátov a účtu</li>
                                <li>Zaistenie bezpečnosti a predchádzanie podvodom</li>
                                <li>Zlepšovanie služby na základe anonymizovaných dát</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                4. Právny základ spracovania
                            </h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Plnenie zmluvy:</strong> poskytovanie služby, spracovanie platieb</li>
                                <li><strong>Súhlas:</strong> marketingová komunikácia, newslettery</li>
                                <li><strong>Oprávnený záujem:</strong> bezpečnosť, predchádzanie podvodom</li>
                                <li><strong>Zákonná povinnosť:</strong> účtovné a daňové predpisy</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                5. Doba uchovávania
                            </h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Údaje o účte: po dobu existencie účtu + 3 roky</li>
                                <li>Údaje o inzerátoch: 1 rok po ukončení inzerátu</li>
                                <li>Platobné transakcie: 10 rokov (zákonná povinnosť)</li>
                                <li>Komunikácia: 2 roky</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                6. Vaše práva
                            </h2>
                            <p className="mb-2">Ako dotknutá osoba máte právo:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Právo na prístup:</strong> získať kópiu svojich údajov</li>
                                <li><strong>Právo na opravu:</strong> opraviť nesprávne údaje</li>
                                <li><strong>Právo na vymazanie:</strong> požiadať o zmazanie účtu</li>
                                <li><strong>Právo na prenos:</strong> exportovať údaje v strojovo čitateľnom formáte</li>
                                <li><strong>Právo namietať:</strong> proti spracovaniu na základe oprávneného záujmu</li>
                                <li><strong>Právo odvolať súhlas:</strong> kedykoľvek bez uvedenia dôvodu</li>
                            </ul>
                            <p className="mt-4">
                                Pre uplatnenie práv kontaktujte: <a href="mailto:gdpr@autobazar123.sk" className="text-accent hover:underline">gdpr@autobazar123.sk</a>
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                7. Cookies
                            </h2>
                            <p>
                                Používame cookies pre fungovanie služby. Podrobnosti nájdete v
                                nastaveniach cookies na stránke. Pomocou banneru môžete spravovať
                                svoje preferencie.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                8. Tretie strany
                            </h2>
                            <p>Údaje môžu byť zdieľané s:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li><strong>Stripe:</strong> spracovanie platieb (USA, Privacy Shield)</li>
                                <li><strong>Supabase:</strong> databázové služby (EU/USA)</li>
                                <li><strong>Vercel:</strong> hosting (EU/USA)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-primary mb-4">
                                9. Sťažnosti
                            </h2>
                            <p>
                                Ak máte pochybnosti o spracovaní vašich údajov, máte právo podať
                                sťažnosť na Úrad na ochranu osobných údajov SR:{" "}
                                <a href="https://dataprotection.gov.sk" className="text-accent hover:underline" target="_blank" rel="noopener">
                                    dataprotection.gov.sk
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
