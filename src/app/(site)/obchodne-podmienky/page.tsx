import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obchodne podmienky | Autobazar123",
  description: "Obchodne podmienky pouzivania platformy Autobazar123.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="py-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">
              Obchodne podmienky
            </h1>
            <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
              Platne od: 1. januara 2026
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-secondary">
            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  1. Úvodné ustanovenia
                </h2>
                <p>
                  Tieto obchodné podmienky upravujú vzťahy medzi
                  prevádzkovateľom platformy Autobazar123 (ďalej len
                  &quot;Prevádzkovateľ&quot;) a používateľmi služby (ďalej len
                  &quot;Používateľ&quot;).
                </p>
                <p className="mt-2 text-secondary">
                  Používaním služby Autobazar123 Používateľ súhlasí s týmito
                  obchodnými podmienkami.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  2. Definícia služby
                </h2>
                <p>
                  Autobazar123 je online platforma pre inzerciu vozidiel. Služba
                  umožňuje Používateľom zverejňovať inzeráty, vyhľadávať vozidlá
                  a kontaktovať predajcov.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  3. Registrácia a účet
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>Pre zverejnenie inzerátu je potrebná registrácia.</li>
                  <li>Používateľ je povinný uviesť pravdivé údaje.</li>
                  <li>
                    Používateľ je zodpovedný za bezpečnosť svojich
                    prihlasovacích údajov.
                  </li>
                  <li>
                    Jeden Používateľ môže mať len jeden účet (fyzická osoba)
                    alebo jeden dealer účet (firma).
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  4. Kreditný systém
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>Služby sú hradené prostredníctvom kreditov.</li>
                  <li>1 kredit má hodnotu 1 €.</li>
                  <li>Zakúpené kredity sú nevratné.</li>
                  <li>Kredity neexpirujú.</li>
                  <li>
                    Ceny jednotlivých akcií (zverejnenie, topovanie,
                    zvýraznenie) sú uvedené v cenníku.
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  5. Pravidlá inzercie
                </h2>
                <ul className="list-disc pl-6 space-y-2 mt-0">
                  <li>Inzerát musí obsahovať pravdivé informácie o vozidle.</li>
                  <li>Fotografie musia zodpovedať skutočnému stavu vozidla.</li>
                  <li>
                    Je zakázané inzerovať kradnuté vozidlá alebo vozidlá bez
                    platnej dokumentácie.
                  </li>
                  <li>Jeden inzerát môže obsahovať len jedno vozidlo.</li>
                  <li>Inzerát je aktívny 30 dní od zverejnenia.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  6. Zodpovednosť
                </h2>
                <p>
                  Prevádzkovateľ nie je stranou obchodnej transakcie medzi
                  Používateľmi. Prevádzkovateľ nenesie zodpovednosť za:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Pravdivosť údajov v inzerátoch.</li>
                  <li>Kvalitu alebo stav inzerovaných vozidiel.</li>
                  <li>Škody vzniknuté z obchodných transakcií.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  7. Záverečné ustanovenia
                </h2>
                <p>
                  Prevádzkovateľ si vyhradzuje právo na zmenu týchto podmienok.
                  Zmeny nadobúdajú účinnosť ich zverejnením na webovej stránke.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="p-8 rounded-2xl border border-border bg-surface/30">
                <h2 className="text-xl font-bold text-primary mb-4 mt-0">
                  8. Kontakt
                </h2>
                <p>
                  V prípade otázok nás kontaktujte na:{" "}
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

