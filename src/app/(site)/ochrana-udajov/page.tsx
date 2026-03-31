import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_URL } from "@/config/brand";
import { COMPANY_INFO } from "@/config/company";

const SITE_URL = BRAND_URL;

export const metadata: Metadata = {
  title: "Ochrana osobných údajov | Autobazar123",
  description: "Politika ochrany osobných údajov platformy Autobazar123 (GDPR).",
  alternates: {
    canonical: `${SITE_URL}/ochrana-udajov`,
  },
};

type PrivacySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: "1. Správca osobných údajov",
    paragraphs: [
      `Správcom osobných údajov je ${COMPANY_INFO.legalName} (ďalej len Správca), prevádzkovateľ platformy Autobazar123.`,
      `Kontakt pre ochranu osobných údajov: ${COMPANY_INFO.privacyEmail}.`,
    ],
  },
  {
    title: "2. Rozsah spracúvaných údajov",
    paragraphs: [
      "Spracúvame len údaje potrebné na prevádzku platformy, bezpečnosť a plnenie právnych povinností.",
    ],
    bullets: [
      "Identifikačné a kontaktné údaje účtu, napríklad e-mail, meno a telefón.",
      "Údaje o inzerátoch, napríklad parametre vozidlá, cena, popis a fotografie.",
      "Komunikačné údaje v rámci správ medzi účastníkmi inzercie.",
      "Technické údaje (IP, zariadenie, logy, cookies).",
      "Platobné metadata spojené s platbami, predplateným zostatkom dealera a fakturáciou.",
    ],
  },
  {
    title: "3. Účely a právne základy spracovania",
    paragraphs: [
      "Účtové a inzertné údaje spracúvame najmä na základe plnenia zmluvy podľa čl. 6 ods. 1 písm. b GDPR.",
      "Bezpečnostné logy, ochranu pred zneužitím a anti-fraud kontrolu spracúvame na základe oprávneného záujmu podľa čl. 6 ods. 1 písm. f GDPR.",
      "Účtovné doklady a fakturačné záznamy spracúvame na základe zákonnej povinností podľa čl. 6 ods. 1 písm. c GDPR.",
    ],
  },
  {
    title: "4. Doba uchovávania",
    paragraphs: [
      "Údaje neuchovávame dlhšie, ako je potrebné pre účel spracovania a právne povinností.",
    ],
    bullets: [
      "Účet: po dobu aktívneho účtu a primerané obdobie po jeho zrušení.",
      "Inzeráty a súvisiace správy: podľa prevádzkovej potreby, bezpečnosti a riešenia sporov.",
      "Fakturačné záznamy: podľa slovenských daňových a účtovných predpisov.",
      "Systémové logy: podľa internej retention politiky bezpečnosti.",
    ],
  },
  {
    title: "5. Príjemcovia a prenosy",
    paragraphs: [
      "Na prevádzku služby využívame overených poskytovateľov technickej infraštruktúry a platieb.",
      "Pri prenosoch mimo EHP vyžadujeme primerané záruky, napríklad štandardné zmluvné doložky, v súlade s GDPR.",
    ],
    bullets: [
      "Hosting a aplikačná infraštruktúra.",
      "Databázové a analytické služby.",
      "Platobná infraštruktúra a fakturačné procesy.",
      "E-mailová doručovacia infraštruktúra.",
    ],
  },
  {
    title: "6. Vaše práva ako dotknutej osoby",
    paragraphs: [
      "Máte právo požiadať o prístup, opravu, obmedzenie spracovania, namietať spracovanie alebo požiadať o vymazanie v medziach GDPR.",
      "Máte právo na prenositeľnosť údajov pri spracovaní založenom na súhlase alebo zmluve.",
    ],
    bullets: [
      "Právo na informácie a prístup k údajom.",
      "Právo na opravu nepresných alebo neaktuálnych údajov.",
      "Právo na vymazanie, ak neexistuje prekážka zo zákona.",
      "Právo podať sťažnosť dozornému orgánu Slovenskej republiky.",
    ],
  },
  {
    title: "7. Cookies a podobné technológie",
    paragraphs: [
      "Detailné nastavenia cookies sú dostupné na samostatnej stránke cookies. Nevyhnutné cookies sú aktívne vždy, analytické a marketingové cookies sú voliteľné.",
      "Svoj súhlas môžete kedykoľvek zmeniť v nastaveniach cookies.",
    ],
  },
  {
    title: "8. Bezpečnostné opatrenia",
    paragraphs: [
      "Používame viacvrstvové technické a organizačné opatrenia na ochranu dát pred stratou, zneužitím a neoprávneným prístupom.",
      "Pri platbách kartou nespracúvame celé údaje o karte. Tie spracúva poskytovateľ platobnej infraštruktúry.",
      "Bezpečnostný model pravidelne revidujeme a aktualizujeme podľa rizík.",
    ],
  },
  {
    title: "9. Kontakt a uplatnenie práv",
    paragraphs: [
      `Požiadavky súvisiace s ochranou osobných údajov smerujte na ${COMPANY_INFO.privacyEmail}.`,
      `Všeobecné otázky k platforme rieši podpora na ${COMPANY_INFO.supportEmail}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="pt-24 pb-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <header className="rounded-2xl border border-border bg-background p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">GDPR</p>
            <h1 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Ochrana osobných údajov
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
              Dokument popisuje, aké osobné údaje spracúvame, na aký účel, po akú
              dobu a aké práva máte podľa GDPR (EÚ 2016/679). Platné od 26. marca 2026.
            </p>
            <p className="mt-3 text-sm text-secondary">
              Nastavenia cookies najdete na stránke{" "}
              <Link
                href="/cookies"
                className="font-medium text-primary underline underline-offset-4 hover:text-accent"
              >
                Cookies
              </Link>
              .
            </p>
          </header>

          <div className="mt-8 space-y-5">
            {PRIVACY_SECTIONS.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-border bg-background p-6 sm:p-7"
              >
                <h2 className="text-xl font-semibold text-primary">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-secondary sm:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets && (
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
