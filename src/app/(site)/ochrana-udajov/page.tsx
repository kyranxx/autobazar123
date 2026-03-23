import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_URL } from "@/config/brand";
import { COMPANY_INFO } from "@/config/company";

const SITE_URL = BRAND_URL;

export const metadata: Metadata = {
  title: "Ochrana osobných údajov | Autobazar123",
  description: "Kompletná politika ochrany osobných údajov (GDPR).",
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
    title: "2. Rozsah spracuvanych údajov",
    paragraphs: [
      "Spracuvame len údaje potrebne na prevadzku platformy, bezpečnosť a plnenie pravnych povinnosti.",
    ],
    bullets: [
      "Identifikacne a kontaktné údaje účtu (email, meno, telefón).",
      "Údaje o inzerátoch (parametre vozidlá, cena, popis, fotografie).",
      "Komunikacne údaje v ramci správ medzi ucastnikmi inzercie.",
      "Technické údaje (IP, zariadenie, logy, cookies).",
      "Platobné metadata spojene s kreditmi a fakturaciou.",
    ],
  },
  {
    title: "3. Ucely a pravne zaklady spracovania",
    paragraphs: [
      "Uctove a inzertne údaje spracuvame najma na zaklade plnenia zmluvy (cl. 6 ods. 1 pism. b GDPR).",
      "Bezpecnostne logy a anti-fraud kontrolu spracuvame na zaklade opravneneho zaujmu (cl. 6 ods. 1 pism. f GDPR).",
      "Uctovne doklady a fakturacne zaznamy spracuvame na zaklade zakonnej povinnosti (cl. 6 ods. 1 pism. c GDPR).",
    ],
  },
  {
    title: "4. Doba uchovavania",
    paragraphs: [
      "Údaje neuchovavame dlhsie, ako je potrebne pre ucel spracovania a pravne povinnosti.",
    ],
    bullets: [
      "Účet: po dobu aktivneho účtu a primerane obdobie po zruseni.",
      "Inzeráty a suvisiace správy: podľa prevadzkovej potreby, bezpecnosti a riesenia sporov.",
      "Fakturacne zaznamy: podľa slovenskych danovych a uctovnych predpisov.",
      "Systemove logy: podľa internej retention politiky bezpecnosti.",
    ],
  },
  {
    title: "5. Prijemcovia a prenosy",
    paragraphs: [
      "Na prevádzku služby využívame overených poskytovateľov technickej infraštruktúry a platieb.",
      "Pri prenosoch mimo EHP vyzadujeme primerane zaruky (napr. standardne zmluvné dolozky) v sulade s GDPR.",
    ],
    bullets: [
      "Hosting a aplikacna infrastruktura.",
      "Databázové a analytické služby.",
      "Platobna infrastruktura a fakturacne procesy.",
      "Emailova dorucovacia infrastruktura.",
    ],
  },
  {
    title: "6. Vase práva ako dotknutej osoby",
    paragraphs: [
      "Mate pravo poziadat o prístup, opravu, obmedzenie spracovania, namietat spracovanie alebo poziadat o vymazanie v medziach GDPR.",
      "Mate pravo na prenositelnost údajov pri spracovani zalozenom na suhlase alebo zmluve.",
    ],
    bullets: [
      "Pravo na informácie a prístup k udajom.",
      "Pravo na opravu nepresnych alebo neaktualnych údajov.",
      "Pravo na vymazanie (ak neexistuje prekazka zo zakona).",
      "Pravo podat staznost dozornemu organu SR.",
    ],
  },
  {
    title: "7. Cookies a podobné technologie",
    paragraphs: [
      "Detailné nastavenia cookies sú dostupne na samostatnej stránke cookies. Nevyhnutne cookies sú aktívne vzdy; analyticke a marketingove cookies sú voliteľné.",
      "Svoj suhlas môžete kedykoľvek zmeniť v nastaveniach cookies.",
    ],
  },
  {
    title: "8. Bezpecnostne opatrenia",
    paragraphs: [
      "Používame viacvrstvove technické a organizacne opatrenia na ochranu dat pred stratou, zneuzitim a neopravnenym pristupom.",
      "Bezpečnostný model pravidelne revidujeme a aktualizujeme podľa rizik.",
    ],
  },
  {
    title: "9. Kontakt a uplatnenie prav",
    paragraphs: [
      `Poziadavky suvisiace s ochranou osobných údajov smerujte na ${COMPANY_INFO.privacyEmail}.`,
      `Vseobecne otázky k platforme riesi podpora na ${COMPANY_INFO.supportEmail}.`,
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
              Dokument popisuje, ake osobné údaje spracuvame, na aky ucel, po aku
              dobu a ake práva mate podľa GDPR (EU 2016/679). Platne od 1. marca 2026.
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
