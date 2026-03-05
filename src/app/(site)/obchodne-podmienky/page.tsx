import type { Metadata } from "next";

const SITE_URL = "https://autobazar123.sk";

export const metadata: Metadata = {
  title: "Obchodne podmienky | Autobazar123",
  description: "Kompletne obchodne podmienky platformy Autobazar123.",
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
    title: "1. Prevadzkovatel a rozsah sluzby",
    body: [
      "Prevadzkovatelom platformy Autobazar123 je Apollo Tech s. r. o. (dalej len Prevadzkovatel). Platforma sluzi na publikovanie inzercie vozidiel, vyhladavanie ponuk a kontakt medzi predavajucim a zaujemcom.",
      "Pouzivanim platformy potvrdzujete, ze ste sa oboznamili s tymito podmienkami a suhlasite s nimi.",
    ],
  },
  {
    title: "2. Definicie",
    body: [
      "Pouzivatel je fyzicka alebo pravnicka osoba, ktora ma účet alebo pouziva verejnu cast platformy.",
      "Inzerát je zaznam o vozidle vytvoreny Pouzivatelom. Predajca je Pouzivatel, ktory inzerát publikoval. Zaujemca je Pouzivatel, ktory kontaktuje Predajcu.",
    ],
  },
  {
    title: "3. Účet a registrácia",
    body: [
      "Na publikovanie inzerátov a odosielanie sprav je potrebna registrácia a aktivny účet.",
      "Pouzivatel je povinny uvadzat pravdive a aktualne údaje, chranit pristupove údaje a bezodkladne nahlasit podozrive prihlasenia.",
    ],
    bullets: [
      "Zakazane je vytvarat účet za inu osobu bez opravnenia.",
      "Zakazane je obchadzat bezpecnostne mechanizmy platformy.",
      "Prevadzkovatel moze účet docasne obmedzit pri poruseni pravidiel alebo podozreni na podvod.",
    ],
  },
  {
    title: "4. Pravidla inzercie",
    body: [
      "Inzerát musi obsahovat realne a overitelne informacie o vozidle. Fotografie a popis musia zodpovedat skutocnemu stavu.",
      "Nie je dovolene publikovat obsah, ktory porusuje zakon, prava tretich stran alebo dobre mravy.",
    ],
    bullets: [
      "Jeden inzerát reprezentuje jedno vozidlo.",
      "Zakazane su klamlive ceny, falosne najazdy alebo skryvanie podstatnych vad.",
      "Prevadzkovatel moze inzerát stiahnuť alebo upraviť jeho viditelnost pri poruseni pravidiel.",
    ],
  },
  {
    title: "5. Kreditny system a platby",
    body: [
      "Platenne funkcie platformy funguju na kreditnom principe. Cennik funkcii je uvedeny na verejnej cenovej stranke.",
      "Kredity sa pripisu po uspesnom spracovani platby. Nepouzite kredity ostavaju na účte Pouzivatela, pokial podmienky alebo zakon nestanovia inak.",
    ],
    bullets: [
      "Platby su spracovane externym poskytovatelom platobnej infrastruktury.",
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
      "Prevadzkovatel si vyhradzuje pravo preverit nahlasene zneuzitie a prijat opatrenia.",
    ],
  },
  {
    title: "7. Zodpovednost a obmedzenie zaruky",
    body: [
      "Prevadzkovatel nie je zmluvnou stranou kupnej zmluvy medzi Predajcom a Zaujemcom a nezodpoveda za kvalitu, povod alebo pravny stav vozidla.",
      "Prevadzkovatel zodpoveda za prevadzku platformy v rozsahu stanoveneho zakonmi SR a EU.",
    ],
  },
  {
    title: "8. Dusevne vlastnictvo",
    body: [
      "Softver, dizajn, databazova struktura a znacky platformy su chranene pravami dusevneho vlastnictva.",
      "Bez predchadzajuceho suhlasu je zakazane obsah platformy hromadne kopirovat, scrapovat alebo komercne znovu pouzit.",
    ],
  },
  {
    title: "9. Trvanie, ukoncenie a blokacia",
    body: [
      "Pouzivatel moze účet ukoncit poziadanim o vymazanie účtu alebo samostatnou deaktivaciou podla dostupnych nastaveni.",
      "Prevadzkovatel moze účet obmedzit alebo zrušiť pri opakovanom poruseni podmienok alebo pri pravnych povinnostiach.",
    ],
  },
  {
    title: "10. Reklamacie a podpora",
    body: [
      "Poziadavky na technicku podporu, reklamacie a podnety je možné zasielat elektronicky.",
      "Prevadzkovatel vybavuje podnety bez zbytocneho odkladu, standardne v pracovnych dnoch.",
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
      "Prevadzkovatel moze podmienky primerane aktualizovat. Aktualne znenie je vzdy publikovane na tejto stranke.",
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
              publikovania inzeratov, komunikacie medzi pouzivatelmi a platenych
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
