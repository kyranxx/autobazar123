import type { Metadata } from "next";

const SITE_URL = "https://autobazar123.sk";

export const metadata: Metadata = {
  title: "Obchodne podmienky | Autobazar123",
  description: "Kompletné obchodne podmienky platformy Autobazar123.",
  alternates: {
    canonical: `${SITE_URL}/obchodne-podmienky`,
  },
};

type Section = {
  title: string;
  body: string[];
  bullets?: string[];
};

const SECTIONS: Section[] = [
  {
    title: "1. Prevádzkovateľ a rozsah služby",
    body: [
      "Prevádzkovateľom platformy Autobazar123 je Apollo Tech s. r. o. (ďalej len Prevádzkovateľ). Platforma slúži na publikovanie inzercie vozidiel, vyhľadávanie ponúk a kontakt medzi predávajúcim a záujemcom.",
      "Používaním platformy potvrdzujete, že ste sa oboznámili s týmito podmienkami a súhlasíte s nimi.",
    ],
  },
  {
    title: "2. Definicie",
    body: [
      "Používateľ je fyzická alebo právnická osoba, ktorá má účet alebo používa verejnú časť platformy.",
      "Inzerát je záznam o vozidle vytvorený Používateľom. Predajca je Používateľ, ktorý inzerát publikoval. Záujemca je Používateľ, ktorý kontaktuje Predajcu.",
    ],
  },
  {
    title: "3. Účet a registrácia",
    body: [
      "Na publikovanie inzerátov a odosielanie sprav je potrebna registrácia a aktívny účet.",
      "Používateľ je povinný uvádzať pravdivé a aktuálne údaje, chrániť prístupové údaje a bezodkladne nahlásiť podozrivé prihlásenia.",
    ],
    bullets: [
      "Zakazane je vytvarat účet za inu osobu bez opravnenia.",
      "Zakazane je obchadzat bezpecnostne mechanizmy platformy.",
      "Prevadzkovatel moze účet dočasne obmedzit pri poruseni pravidiel alebo podozreni na podvod.",
    ],
  },
  {
    title: "4. Pravidla inzercie",
    body: [
      "Inzerát musi obsahovat reálne a overitelne informácie o vozidle. Fotografie a popis musia zodpovedat skutocnemu stavu.",
      "Nie je dovolene publikovat obsah, ktorý porusuje zakon, práva tretích strán alebo dobré mravy.",
    ],
    bullets: [
      "Jeden inzerát reprezentuje jedno vozidlo.",
      "Zakazane sú klamlive ceny, falosne najazdy alebo skryvanie podstatnych vad.",
      "Prevadzkovatel moze inzerát stiahnuť alebo upraviť jeho viditeľnosť pri poruseni pravidiel.",
    ],
  },
  {
    title: "5. Kreditny system a platby",
    body: [
      "Platenne funkcie platformy fungujú na kreditnom principe. Cenník funkcii je uvedeny na verejnej cenovej stranke.",
      "Kredity sa pripíšu po uspesnom spracovani platby. Nepouzite kredity ostavaju na účte Používateľa, pokial podmienky alebo zakon nestanovia inak.",
    ],
    bullets: [
      "Platby sú spracovane externym poskytovatelom platobnej infraštruktúry.",
      "Doklad o platbe je doruceny elektronicky.",
      "Pri zistenom zneuziti moze byt kreditny zostatok upraveny alebo zmrazeny.",
    ],
  },
  {
    title: "6. Komunikacia medzi pouzivatelmi",
    body: [
      "Správy medzi Predajcom a Zaujemcom sluzia na dohodnutie obhliadky, ceny a detailov predaja.",
      "Komunikacia nesmie obsahovat spam, obtazovanie, podvody alebo nelegalny obsah.",
    ],
    bullets: [
      "Odosielanie sprav podlieha bezpecnostnym limitom a anti-spam pravidlam.",
      "Prevadzkovatel si vyhradzuje pravo preverit nahlásené zneužitie a prijat opatrenia.",
    ],
  },
  {
    title: "7. Zodpovednost a obmedzenie zaruky",
    body: [
      "Prevadzkovatel nie je zmluvnou stranou kúpnej zmluvy medzi Predajcom a Zaujemcom a nezodpoveda za kvalitu, povod alebo pravny stav vozidlá.",
      "Prevadzkovatel zodpovedá za prevadzku platformy v rozsahu stanoveneho zakonmi SR a EU.",
    ],
  },
  {
    title: "8. Dusevne vlastnictvo",
    body: [
      "Softver, dizajn, databazova struktura a značky platformy sú chránené právami dusevneho vlastnictva.",
      "Bez predchadzajuceho suhlasu je zakazane obsah platformy hromadné kopírovať, scrapovat alebo komercne znovu použiť.",
    ],
  },
  {
    title: "9. Trvanie, ukoncenie a blokacia",
    body: [
      "Používateľ môže účet ukončiť požiadaním o vymazanie účtu alebo samostatnou deaktiváciou podľa dostupných nastavení.",
      "Prevadzkovatel moze účet obmedzit alebo zrušiť pri opakovanom poruseni podmienok alebo pri pravnych povinnostiach.",
    ],
  },
  {
    title: "10. Reklamacie a podpora",
    body: [
      "Poziadavky na technicku podporu, reklamacie a podnety je možné zasielat elektronicky.",
      "Prevádzkovateľ vybavuje podnety bez zbytočného odkladu, štandardne v pracovných dňoch.",
    ],
    bullets: [
      "Podpora: podpora@autobazar123.sk",
      "GDPR kontakt: gdpr@autobazar123.sk",
    ],
  },
  {
    title: "11. Rozhodne pravo a jurisdikcia",
    body: [
      "Tieto podmienky sa riadia pravnym poriadkom Slovenskej republiky.",
      "Spory sa prednostne riesia dohodou, nasledne prislusnym sudom SR, ak zakon neustanovi inak.",
    ],
  },
  {
    title: "12. Zmeny podmienok",
    body: [
      "Prevadzkovatel moze podmienky primerane aktualizovať. Aktualne znenie je vzdy publikovane na tejto stranke.",
      "Podstatne zmeny oznamujeme primeranym sposobom vopred (napr. oznam v aplikacii alebo e-mail).",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="pt-24 pb-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <header className="rounded-2xl border border-border bg-background p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Pravne dokumenty</p>
            <h1 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Obchodne podmienky
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
              Dokument upravuje pravidla pouzivania platformy Autobazar123,
              publikovania inzerátov, komunikacie medzi pouzivatelmi a platenych
              funkcii. Platne od 1. marca 2026.
            </p>
          </header>

          <div className="mt-8 space-y-5">
            {SECTIONS.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-border bg-background p-6 sm:p-7"
              >
                <h2 className="text-xl font-semibold text-primary">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-secondary sm:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-secondary sm:text-base">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
