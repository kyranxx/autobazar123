import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ObchodnĂ© podmienky | Autobazar123",
  description: "ObchodnĂ© podmienky pouĹľĂ­vania platformy Autobazar123.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="py-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">
              ObchodnĂ© podmienky
            </h1>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              PlatnĂ© od: 1. januĂˇra 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-secondary">
            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  1. ĂšvodnĂ© ustanovenia
                </h2>
                <p>
                  Tieto obchodnĂ© podmienky upravujĂş vzĹĄahy medzi
                  prevĂˇdzkovateÄľom platformy Autobazar123 (ÄŹalej len
                  &quot;PrevĂˇdzkovateÄľ&quot;) a pouĹľĂ­vateÄľmi sluĹľby (ÄŹalej len
                  &quot;PouĹľĂ­vateÄľ&quot;).
                </p>
                <p className="mt-2 text-secondary">
                  PouĹľĂ­vanĂ­m sluĹľby Autobazar123 PouĹľĂ­vateÄľ sĂşhlasĂ­ s tĂ˝mito
                  obchodnĂ˝mi podmienkami.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  2. DefinĂ­cia sluĹľby
                </h2>
                <p>
                  Autobazar123 je online platforma pre inzerciu vozidiel. SluĹľba
                  umoĹľĹuje PouĹľĂ­vateÄľom zverejĹovaĹĄ inzerĂˇty, vyhÄľadĂˇvaĹĄ vozidlĂˇ
                  a kontaktovaĹĄ predajcov.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  3. RegistrĂˇcia a ĂşÄŤet
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>Pre zverejnenie inzerĂˇtu je potrebnĂˇ registrĂˇcia.</li>
                  <li>PouĹľĂ­vateÄľ je povinnĂ˝ uviesĹĄ pravdivĂ© Ăşdaje.</li>
                  <li>
                    PouĹľĂ­vateÄľ je zodpovednĂ˝ za bezpeÄŤnosĹĄ svojich
                    prihlasovacĂ­ch Ăşdajov.
                  </li>
                  <li>
                    Jeden PouĹľĂ­vateÄľ mĂ´Ĺľe maĹĄ len jeden ĂşÄŤet (fyzickĂˇ osoba)
                    alebo jeden dealer ĂşÄŤet (firma).
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  4. KreditnĂ˝ systĂ©m
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>SluĹľby sĂş hradenĂ© prostrednĂ­ctvom kreditov.</li>
                  <li>1 kredit mĂˇ hodnotu 1 â‚¬.</li>
                  <li>ZakĂşpenĂ© kredity sĂş nevratnĂ©.</li>
                  <li>Kredity neexpirujĂş.</li>
                  <li>
                    Ceny jednotlivĂ˝ch akciĂ­ (zverejnenie, topovanie,
                    zvĂ˝raznenie) sĂş uvedenĂ© v cennĂ­ku.
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  5. PravidlĂˇ inzercie
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>InzerĂˇt musĂ­ obsahovaĹĄ pravdivĂ© informĂˇcie o vozidle.</li>
                  <li>Fotografie musia zodpovedaĹĄ skutoÄŤnĂ©mu stavu vozidla.</li>
                  <li>
                    Je zakĂˇzanĂ© inzerovaĹĄ kradnutĂ© vozidlĂˇ alebo vozidlĂˇ bez
                    platnej dokumentĂˇcie.
                  </li>
                  <li>Jeden inzerĂˇt mĂ´Ĺľe obsahovaĹĄ len jedno vozidlo.</li>
                  <li>InzerĂˇt je aktĂ­vny 30 dnĂ­ od zverejnenia.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  6. ZodpovednosĹĄ
                </h2>
                <p>
                  PrevĂˇdzkovateÄľ nie je stranou obchodnej transakcie medzi
                  PouĹľĂ­vateÄľmi. PrevĂˇdzkovateÄľ nenesie zodpovednosĹĄ za:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>PravdivosĹĄ Ăşdajov v inzerĂˇtoch.</li>
                  <li>Kvalitu alebo stav inzerovanĂ˝ch vozidiel.</li>
                  <li>Ĺ kody vzniknutĂ© z obchodnĂ˝ch transakciĂ­.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  7. ZĂˇvereÄŤnĂ© ustanovenia
                </h2>
                <p>
                  PrevĂˇdzkovateÄľ si vyhradzuje prĂˇvo na zmenu tĂ˝chto podmienok.
                  Zmeny nadobĂşdajĂş ĂşÄŤinnosĹĄ ich zverejnenĂ­m na webovej strĂˇnke.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  8. Kontakt
                </h2>
                <p>
                  V prĂ­pade otĂˇzok nĂˇs kontaktujte na:{" "}
                  <a
                    href="mailto:podpora@autobazar123.sk"
                    className="text-accent hover:underline font-medium"
                  >
                    podpora@autobazar123.sk
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

