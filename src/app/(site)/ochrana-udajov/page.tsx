import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceArticleCard,
  MarketplaceContainer,
  MarketplaceHero,
  MarketplacePageShell,
} from "@/components/ui/MarketplacePage";
import type { MarketCode } from "@/config/markets";
import { COMPANY_INFO } from "@/config/company";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";
import { resolvePublicCopyMarketCode } from "@/lib/market/public-copy";

type PrivacySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const SK_PRIVACY_SECTIONS: PrivacySection[] = [
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
      "Údaje o inzerátoch, napríklad parametre vozidla, cena, popis a fotografie.",
      "Komunikačné údaje v rámci správ medzi účastníkmi inzercie.",
      "Technické údaje (IP, zariadenie, logy, cookies).",
      "Platobné metadáta spojené s platbami, predplateným zostatkom dealera a fakturáciou.",
    ],
  },
  {
    title: "3. Účely a právne základy spracovania",
    paragraphs: [
      "Účtové a inzertné údaje spracúvame najmä na základe plnenia zmluvy podľa čl. 6 ods. 1 písm. b GDPR.",
      "Bezpečnostné logy, ochranu pred zneužitím a anti-fraud kontrolu spracúvame na základe oprávneného záujmu podľa čl. 6 ods. 1 písm. f GDPR.",
      "Účtovné doklady a fakturačné záznamy spracúvame z dôvodu plnenia zákonných povinností podľa čl. 6 ods. 1 písm. c GDPR.",
    ],
  },
  {
    title: "4. Doba uchovávania",
    paragraphs: [
      "Údaje neuchovávame dlhšie, ako je potrebné pre účel spracovania a zákonné požiadavky.",
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

const RO_PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: "1. Operatorul datelor personale",
    paragraphs: [
      `Operatorul datelor personale este ${COMPANY_INFO.legalName}, operatorul platformei AutoNinja.`,
      `Contact pentru protecția datelor personale: ${COMPANY_INFO.privacyEmail}.`,
    ],
  },
  {
    title: "2. Domeniul datelor prelucrate",
    paragraphs: [
      "Prelucrăm doar datele necesare pentru funcționarea platformei, securitate și îndeplinirea obligațiilor legale.",
    ],
    bullets: [
      "Date de identificare și contact ale contului, de exemplu e-mail, nume și număr de contact.",
      "Date despre anunțuri, de exemplu parametrii vehiculului, preț, descriere și fotografii.",
      "Date de comunicare din mesajele dintre participanții la anunț.",
      "Date tehnice (IP, dispozitiv, loguri, cookie-uri).",
      "Metadate de plată legate de plăți, soldul preplătit al dealerului și facturare.",
    ],
  },
  {
    title: "3. Scopuri și temeiuri juridice",
    paragraphs: [
      "Datele de cont și anunțuri sunt prelucrate în principal pentru executarea contractului conform art. 6 alin. 1 lit. b GDPR.",
      "Logurile de securitate, protecția împotriva abuzului și controalele anti-fraudă sunt prelucrate pe baza interesului legitim conform art. 6 alin. 1 lit. f GDPR.",
      "Documentele contabile și înregistrările de facturare sunt prelucrate pentru îndeplinirea obligațiilor legale conform art. 6 alin. 1 lit. c GDPR.",
    ],
  },
  {
    title: "4. Perioada de păstrare",
    paragraphs: [
      "Nu păstrăm datele mai mult decât este necesar pentru scopul prelucrării și cerințele legale.",
    ],
    bullets: [
      "Cont: pe durata contului activ și pentru o perioadă rezonabilă după închiderea lui.",
      "Anunțuri și mesaje asociate: conform necesităților operaționale, securității și soluționării disputelor.",
      "Înregistrări de facturare: conform cerințelor fiscale și contabile aplicabile.",
      "Loguri de sistem: conform politicii interne de retenție pentru securitate.",
    ],
  },
  {
    title: "5. Destinatari și transferuri",
    paragraphs: [
      "Pentru funcționarea serviciului folosim furnizori verificați de infrastructură tehnică și plăți.",
      "Pentru transferurile în afara SEE solicităm garanții adecvate, de exemplu clauze contractuale standard, conform GDPR.",
    ],
    bullets: [
      "Hosting și infrastructură aplicativă.",
      "Servicii de baze de date și analiză.",
      "Infrastructură de plăți și procese de facturare.",
      "Infrastructură de livrare e-mail.",
    ],
  },
  {
    title: "6. Drepturile tale ca persoană vizată",
    paragraphs: [
      "Ai dreptul să soliciți acces, rectificare, restricționarea prelucrării, opoziție la prelucrare sau ștergere, în limitele GDPR.",
      "Ai dreptul la portabilitatea datelor atunci când prelucrarea se bazează pe consimțământ sau contract.",
    ],
    bullets: [
      "Dreptul la informare și acces la date.",
      "Dreptul la rectificarea datelor inexacte sau neactuale.",
      "Dreptul la ștergere, dacă nu există un obstacol legal.",
      "Dreptul de a depune plângere la autoritatea de supraveghere competentă.",
    ],
  },
  {
    title: "7. Cookie-uri și tehnologii similare",
    paragraphs: [
      "Setările detaliate pentru cookie-uri sunt disponibile pe pagina separată de cookie-uri. Cookie-urile necesare sunt active mereu, iar cele analitice și de marketing sunt opționale.",
      "Îți poți modifica oricând consimțământul în setările cookie.",
    ],
  },
  {
    title: "8. Măsuri de securitate",
    paragraphs: [
      "Folosim măsuri tehnice și organizaționale pe mai multe niveluri pentru protejarea datelor împotriva pierderii, abuzului și accesului neautorizat.",
      "La plățile cu cardul nu prelucrăm datele complete ale cardului. Acestea sunt prelucrate de furnizorul infrastructurii de plată.",
      "Modelul de securitate este revizuit și actualizat periodic în funcție de riscuri.",
    ],
  },
  {
    title: "9. Contact și exercitarea drepturilor",
    paragraphs: [
      `Solicitările legate de protecția datelor personale se trimit la ${COMPANY_INFO.privacyEmail}.`,
      `Întrebările generale despre platformă sunt gestionate de suport la ${COMPANY_INFO.supportEmail}.`,
    ],
  },
];

function getPrivacyPageCopy(marketCode: MarketCode) {
  if (marketCode === "RO") {
    return {
      title: "Politica de confidențialitate | AutoNinja",
      description: "Politica de protecție a datelor personale pentru platforma AutoNinja (GDPR).",
      eyebrow: "GDPR",
      heroTitle: "Politica de confidențialitate",
      heroDescription:
        "Documentul descrie ce date personale prelucrăm, în ce scop, pentru cât timp și ce drepturi ai conform GDPR (UE 2016/679). Valabil de la 26 martie 2026.",
      breadcrumb: "Politica de confidențialitate",
      cookiePrefix: "Setările cookie sunt disponibile pe pagina",
      cookieLink: "Cookie-uri",
      sections: RO_PRIVACY_SECTIONS,
    };
  }

  return {
    title: "Ochrana osobných údajov | Autobazar123",
    description: "Politika ochrany osobných údajov platformy Autobazar123 (GDPR).",
    eyebrow: "GDPR",
    heroTitle: "Ochrana osobných údajov",
    heroDescription:
      "Dokument popisuje, aké osobné údaje spracúvame, na aký účel, po akú dobu a aké práva máte podľa GDPR (EÚ 2016/679). Platné od 26. marca 2026.",
    breadcrumb: "Ochrana osobných údajov",
    cookiePrefix: "Nastavenia cookies nájdete na stránke",
    cookieLink: "Cookies",
    sections: SK_PRIVACY_SECTIONS,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const copy = getPrivacyPageCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `${market.origin}${getMarketPath("/ochrana-udajov", market.code)}`,
    },
  };
}

export default async function PrivacyPage() {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const copy = getPrivacyPageCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          eyebrow={copy.eyebrow}
          title={copy.heroTitle}
          description={copy.heroDescription}
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: copy.breadcrumb }]}
              currentHref="/ochrana-udajov"
              siteUrl={market.origin}
            />
          }
        >
          <p className="mt-4 text-sm text-secondary">
            {copy.cookiePrefix}{" "}
            <Link
              href="/cookies"
              className="font-medium text-primary underline underline-offset-4 hover:text-accent"
            >
              {copy.cookieLink}
            </Link>
            .
          </p>
        </MarketplaceHero>

        <div className="space-y-4">
          {copy.sections.map((section) => (
            <MarketplaceArticleCard key={section.title}>
              <h2 className="text-xl font-semibold text-primary">{section.title}</h2>
              <div className="market-readable">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="list-disc">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </MarketplaceArticleCard>
          ))}
        </div>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}
