import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ochrana osobnĂ˝ch Ăşdajov | Autobazar123",
  description:
    "ZĂˇsady ochrany osobnĂ˝ch Ăşdajov platformy Autobazar123 v sĂşlade s GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="py-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">
              Ochrana osobnĂ˝ch Ăşdajov
            </h1>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              PlatnĂ© od: 1. januĂˇra 2026 | V sĂşlade s GDPR (Nariadenie EĂš
              2016/679)
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-secondary">
            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  1. PrevĂˇdzkovateÄľ
                </h2>
                <p>
                  PrevĂˇdzkovateÄľom osobnĂ˝ch Ăşdajov je Autobazar123 s.r.o., IÄŚO:
                  XX XXX XXX, so sĂ­dlom [adresa]. Pre otĂˇzky tĂ˝kajĂşce sa ochrany
                  Ăşdajov nĂˇs kontaktujte na:{" "}
                  <a
                    href="mailto:gdpr@autobazar123.sk"
                    className="text-accent hover:underline font-medium"
                  >
                    gdpr@autobazar123.sk
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  2. AkĂ© Ăşdaje zbierame
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>
                    <strong>RegistraÄŤnĂ© Ăşdaje:</strong> meno, e-mail, telefĂłn
                  </li>
                  <li>
                    <strong>Ăšdaje o inzerĂˇtoch:</strong> fotografie, popis
                    vozidla, cena
                  </li>
                  <li>
                    <strong>PlatobnĂ© Ăşdaje:</strong> spracovanĂ© cez Stripe
                    (nekopĂ­rujeme karty)
                  </li>
                  <li>
                    <strong>TechnickĂ© Ăşdaje:</strong> IP adresa, cookies, typ
                    prehliadaÄŤa
                  </li>
                  <li>
                    <strong>KomunikĂˇcia:</strong> sprĂˇvy medzi pouĹľĂ­vateÄľmi
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  3. ĂšÄŤel spracovania
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>Poskytovanie sluĹľby inzercie vozidiel</li>
                  <li>Spracovanie platieb za kredity</li>
                  <li>KomunikĂˇcia o stave inzerĂˇtov a ĂşÄŤtu</li>
                  <li>Zaistenie bezpeÄŤnosti a predchĂˇdzanie podvodom</li>
                  <li>ZlepĹˇovanie sluĹľby na zĂˇklade anonymizovanĂ˝ch dĂˇt</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  4. PrĂˇvny zĂˇklad spracovania
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>
                    <strong>Plnenie zmluvy:</strong> poskytovanie sluĹľby,
                    spracovanie platieb
                  </li>
                  <li>
                    <strong>SĂşhlas:</strong> marketingovĂˇ komunikĂˇcia,
                    newslettery
                  </li>
                  <li>
                    <strong>OprĂˇvnenĂ˝ zĂˇujem:</strong> bezpeÄŤnosĹĄ, predchĂˇdzanie
                    podvodom
                  </li>
                  <li>
                    <strong>ZĂˇkonnĂˇ povinnosĹĄ:</strong> ĂşÄŤtovnĂ© a daĹovĂ©
                    predpisy
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  5. Doba uchovĂˇvania
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>Ăšdaje o ĂşÄŤte: po dobu existencie ĂşÄŤtu + 3 roky</li>
                  <li>Ăšdaje o inzerĂˇtoch: 1 rok po ukonÄŤenĂ­ inzerĂˇtu</li>
                  <li>PlatobnĂ© transakcie: 10 rokov (zĂˇkonnĂˇ povinnosĹĄ)</li>
                  <li>KomunikĂˇcia: 2 roky</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  6. VaĹˇe prĂˇva
                </h2>
                <p className="mb-2">Ako dotknutĂˇ osoba mĂˇte prĂˇvo:</p>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>
                    <strong>PrĂˇvo na prĂ­stup:</strong> zĂ­skaĹĄ kĂłpiu svojich
                    Ăşdajov
                  </li>
                  <li>
                    <strong>PrĂˇvo na opravu:</strong> opraviĹĄ nesprĂˇvne Ăşdaje
                  </li>
                  <li>
                    <strong>PrĂˇvo na vymazanie:</strong> poĹľiadaĹĄ o zmazanie
                    ĂşÄŤtu
                  </li>
                  <li>
                    <strong>PrĂˇvo na prenos:</strong> exportovaĹĄ Ăşdaje v
                    strojovo ÄŤitateÄľnom formĂˇte
                  </li>
                  <li>
                    <strong>PrĂˇvo namietaĹĄ:</strong> proti spracovaniu na
                    zĂˇklade oprĂˇvnenĂ©ho zĂˇujmu
                  </li>
                  <li>
                    <strong>PrĂˇvo odvolaĹĄ sĂşhlas:</strong> kedykoÄľvek bez
                    uvedenia dĂ´vodu
                  </li>
                </ul>
                <p className="mt-4">
                  Pre uplatnenie prĂˇv kontaktujte:{" "}
                  <a
                    href="mailto:gdpr@autobazar123.sk"
                    className="text-accent hover:underline font-medium"
                  >
                    gdpr@autobazar123.sk
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  7. Cookies
                </h2>
                <p>
                  PouĹľĂ­vame cookies pre fungovanie sluĹľby. Podrobnosti nĂˇjdete v
                  nastaveniach cookies na strĂˇnke. Pomocou banneru mĂ´Ĺľete
                  spravovaĹĄ svoje preferencie.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  8. Tretie strany
                </h2>
                <p>Ăšdaje mĂ´Ĺľu byĹĄ zdieÄľanĂ© s:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>
                    <strong>Stripe:</strong> spracovanie platieb (USA, Privacy
                    Shield)
                  </li>
                  <li>
                    <strong>Supabase:</strong> databĂˇzovĂ© sluĹľby (EU/USA)
                  </li>
                  <li>
                    <strong>Vercel:</strong> hosting (EU/USA)
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  9. SĹĄaĹľnosti
                </h2>
                <p>
                  Ak mĂˇte pochybnosti o spracovanĂ­ vaĹˇich Ăşdajov, mĂˇte prĂˇvo
                  podaĹĄ sĹĄaĹľnosĹĄ na Ăšrad na ochranu osobnĂ˝ch Ăşdajov SR:{" "}
                  <a
                    href="https://dataprotection.gov.sk"
                    className="text-accent hover:underline font-medium"
                    target="_blank"
                    rel="noopener"
                  >
                    dataprotection.gov.sk
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

