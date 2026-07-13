import type { Metadata } from "next";
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

type Section = {
  title: string;
  body: string[];
  bullets?: string[];
};

const SK_SECTIONS: Section[] = [
  {
    title: "1. Prevádzkovateľ a rozsah služby",
    body: [
      `Prevádzkovateľom platformy Autobazar123 je ${COMPANY_INFO.legalName} (ďalej len Prevádzkovateľ). Platforma slúži na publikovanie inzercie vozidiel, vyhľadávanie ponúk a kontakt medzi predávajúcim a záujemcom.`,
      "Používaním platformy potvrdzujete, že ste sa oboznámili s týmito podmienkami a súhlasíte s nimi.",
    ],
  },
  {
    title: "2. Definície",
    body: [
      "Používateľ je fyzická alebo právnická osoba, ktorá má účet alebo používa verejnú časť platformy.",
      "Inzerát je záznam o vozidle vytvorený Používateľom. Predajca je Používateľ, ktorý inzerát publikoval. Záujemca je Používateľ, ktorý kontaktuje Predajcu.",
    ],
  },
  {
    title: "3. Účet a registrácia",
    body: [
      "Na publikovanie inzerátov a odosielanie správ je potrebná registrácia a aktívny účet.",
      "Používateľ je povinný uvádzať pravdivé a aktuálne údaje, chrániť prístupové údaje a bezodkladne nahlásiť podozrivé prihlásenia.",
    ],
    bullets: [
      "Zakázané je vytvárať účet za inú osobu bez oprávnenia.",
      "Zakázané je obchádzať bezpečnostné mechanizmy platformy.",
      "Prevádzkovateľ môže účet dočasne obmedziť pri porušení pravidiel alebo podozrení na podvod.",
    ],
  },
  {
    title: "4. Pravidlá inzercie",
    body: [
      "Inzerát musí obsahovať reálne a overiteľné informácie o vozidle. Fotografie a popis musia zodpovedať skutočnému stavu.",
      "Nie je dovolené publikovať obsah, ktorý porušuje zákon, práva tretích strán alebo dobré mravy.",
    ],
    bullets: [
      "Jeden inzerát reprezentuje jedno vozidlo.",
      "Zakázané sú klamlivé ceny, falošné najazdy alebo skrývanie podstatných vád.",
      "Prevádzkovateľ môže inzerát stiahnuť alebo upraviť jeho viditeľnosť pri porušení pravidiel.",
    ],
  },
  {
    title: "5. Platby a predplatený zostatok",
    body: [
      "Aktuálny cenník je zverejnený na stránke cenníka. Počas štartovacej fázy môže byť základné zverejnenie podľa cenníka zdarma.",
      "Súkromní predajcovia hradia platené akcie priamo v eurách podľa aktuálneho cenníka. Typicky ide najmä o balíky Premium, Exclusive alebo predĺženie inzerátu.",
      "Overení dealeri používajú predplatený inzertný zostatok vedený v eurách. Dobitie zostatku a prípadný bonus pri dobití sú uvedené v cenníku alebo v dealer účte.",
    ],
    bullets: [
      "Predplatený inzertný zostatok je určený len na úhradu služieb platformy Autobazar123.",
      "Predplatený inzertný zostatok nie je prenosný medzi účtami a nie je určený na platby mimo platformy.",
      "Platby sú spracované externým poskytovateľom platobnej infraštruktúry.",
      "Doklad o platbe je doručený elektronicky.",
      "Pri zistenom zneužití môže byť predplatený zostatok upravený alebo dočasne zmrazený.",
    ],
  },
  {
    title: "6. Komunikácia medzi používateľmi",
    body: [
      "Správy medzi Predajcom a Záujemcom slúžia na dohodnutie obhliadky, ceny a detailov predaja.",
      "Komunikácia nesmie obsahovať spam, obťažovanie, podvody alebo nelegálny obsah.",
    ],
    bullets: [
      "Odosielanie správ podlieha bezpečnostným limitom a anti-spam pravidlám.",
      "Prevádzkovateľ si vyhradzuje právo preveriť nahlásené zneužitie a prijať primerané opatrenia.",
    ],
  },
  {
    title: "7. Zodpovednosť a obmedzenie záruky",
    body: [
      "Prevádzkovateľ nie je zmluvnou stranou kúpnej zmluvy medzi Predajcom a Záujemcom a nezodpovedá za kvalitu, pôvod alebo právny stav vozidla.",
      "Prevádzkovateľ zodpovedá za prevádzku platformy v rozsahu stanovenom právnymi predpismi Slovenskej republiky a Európskej únie.",
    ],
  },
  {
    title: "8. Duševné vlastníctvo",
    body: [
      "Softvér, dizajn, databázová štruktúra a značky platformy sú chránené právami duševného vlastníctva.",
      "Bez predchádzajúceho súhlasu je zakázané hromadné kopírovanie obsahu platformy, scrapovanie alebo komerčné znovu použitie.",
    ],
  },
  {
    title: "9. Trvanie, ukončenie a blokácia",
    body: [
      "Používateľ môže účet ukončiť požiadaním o vymazanie účtu alebo samostatnou deaktiváciou podľa dostupných nastavení.",
      "Prevádzkovateľ môže účet obmedziť alebo zrušiť pri opakovanom porušení podmienok alebo pri plnení zákonných povinností.",
    ],
  },
  {
    title: "10. Reklamácie a podpora",
    body: [
      "Požiadavky na technickú podporu, reklamácie a podnety je možné zasielať elektronicky.",
      "Prevádzkovateľ vybavuje podnety bez zbytočného odkladu, štandardne v pracovných dňoch.",
    ],
    bullets: [
      `Podpora: ${COMPANY_INFO.supportEmail}`,
      `GDPR kontakt: ${COMPANY_INFO.privacyEmail}`,
    ],
  },
  {
    title: "11. Rozhodné právo a jurisdikcia",
    body: [
      "Tieto podmienky sa riadia právnym poriadkom Slovenskej republiky.",
      "Spory sa prednostne riešia dohodou, následne príslušným súdom Slovenskej republiky, ak zákon neustanoví inak.",
    ],
  },
  {
    title: "12. Zmeny podmienok",
    body: [
      "Prevádzkovateľ môže vykonať primerané aktualizácie podmienok. Aktuálne znenie je vždy publikované na tejto stránke.",
      "Podstatné zmeny oznamujeme primeraným spôsobom vopred, napríklad oznamom v aplikácii alebo e-mailom.",
    ],
  },
];

const RO_SECTIONS: Section[] = [
  {
    title: "1. Operatorul și domeniul serviciului",
    body: [
      `Operatorul platformei Autobazar123 este ${COMPANY_INFO.legalName} (denumit în continuare Operatorul). Platforma este folosită pentru publicarea anunțurilor auto, căutarea ofertelor și contactul dintre vânzător și cumpărătorul interesat.`,
      "Prin folosirea platformei confirmați că ați citit acești termeni și sunteți de acord cu ei.",
    ],
  },
  {
    title: "2. Definiții",
    body: [
      "Utilizatorul este o persoană fizică sau juridică ce are un cont sau folosește partea publică a platformei.",
      "Anunțul este o înregistrare despre un vehicul creată de Utilizator. Vânzătorul este Utilizatorul care publică anunțul. Persoana interesată este Utilizatorul care contactează Vânzătorul.",
    ],
  },
  {
    title: "3. Cont și înregistrare",
    body: [
      "Pentru publicarea anunțurilor și trimiterea mesajelor este necesară înregistrarea și un cont activ.",
      "Utilizatorul trebuie să introducă date reale și actuale, să protejeze datele de acces și să raporteze imediat autentificările suspecte.",
    ],
    bullets: [
      "Este interzisă crearea unui cont pentru altă persoană fără autorizare.",
      "Este interzisă ocolirea mecanismelor de securitate ale platformei.",
      "Operatorul poate restricționa temporar contul în cazul încălcării regulilor sau al suspiciunii de fraudă.",
    ],
  },
  {
    title: "4. Reguli pentru anunțuri",
    body: [
      "Anunțul trebuie să conțină informații reale și verificabile despre vehicul. Fotografiile și descrierea trebuie să corespundă stării reale.",
      "Nu este permisă publicarea conținutului care încalcă legea, drepturile terților sau bunele moravuri.",
    ],
    bullets: [
      "Un anunț reprezintă un singur vehicul.",
      "Sunt interzise prețurile înșelătoare, kilometrajele false sau ascunderea defectelor importante.",
      "Operatorul poate elimina anunțul sau îi poate modifica vizibilitatea în cazul încălcării regulilor.",
    ],
  },
  {
    title: "5. Plăți și sold preplătit",
    body: [
      "Prețurile actuale sunt publicate pe pagina de prețuri. În faza de lansare, publicarea de bază poate fi gratuită conform listei de prețuri.",
      "Vânzătorii privați plătesc acțiunile plătite direct în euro, conform prețurilor curente. De obicei este vorba despre pachetele Premium, Exclusive sau prelungirea anunțului.",
      "Dealerii verificați folosesc un sold publicitar preplătit în euro. Încărcarea soldului și bonusul aferent sunt afișate în pagina de prețuri sau în contul de dealer.",
    ],
    bullets: [
      "Soldul publicitar preplătit este destinat doar plății serviciilor platformei Autobazar123.",
      "Soldul publicitar preplătit nu este transferabil între conturi și nu poate fi folosit pentru plăți în afara platformei.",
      "Plățile sunt procesate de un furnizor extern de infrastructură de plată.",
      "Dovada plății este livrată electronic.",
      "În caz de abuz, soldul preplătit poate fi ajustat sau blocat temporar.",
    ],
  },
  {
    title: "6. Comunicare între utilizatori",
    body: [
      "Mesajele dintre Vânzător și persoana interesată sunt destinate stabilirii vizionării, prețului și detaliilor vânzării.",
      "Comunicarea nu trebuie să conțină spam, hărțuire, fraude sau conținut ilegal.",
    ],
    bullets: [
      "Trimiterea mesajelor este supusă limitelor de securitate și regulilor anti-spam.",
      "Operatorul își rezervă dreptul de a verifica abuzurile raportate și de a lua măsuri adecvate.",
    ],
  },
  {
    title: "7. Răspundere și limitarea garanției",
    body: [
      "Operatorul nu este parte a contractului de vânzare-cumpărare dintre Vânzător și persoana interesată și nu răspunde pentru calitatea, originea sau statutul juridic al vehiculului.",
      "Operatorul răspunde pentru funcționarea platformei în limitele stabilite de legislația aplicabilă din Uniunea Europeană.",
    ],
  },
  {
    title: "8. Proprietate intelectuală",
    body: [
      "Software-ul, designul, structura bazei de date și mărcile platformei sunt protejate de drepturi de proprietate intelectuală.",
      "Fără acord prealabil este interzisă copierea în masă a conținutului platformei, scraping-ul sau reutilizarea comercială.",
    ],
  },
  {
    title: "9. Durată, încetare și blocare",
    body: [
      "Utilizatorul poate închide contul prin solicitarea ștergerii sau prin dezactivare, acolo unde această funcție este disponibilă.",
      "Operatorul poate restricționa sau închide contul în cazul încălcărilor repetate ale termenilor sau pentru îndeplinirea obligațiilor legale.",
    ],
  },
  {
    title: "10. Reclamații și suport",
    body: [
      "Solicitările de suport tehnic, reclamațiile și sesizările pot fi trimise electronic.",
      "Operatorul procesează solicitările fără întârzieri nejustificate, de regulă în zile lucrătoare.",
    ],
    bullets: [
      `Suport: ${COMPANY_INFO.supportEmail}`,
      `Contact GDPR: ${COMPANY_INFO.privacyEmail}`,
    ],
  },
  {
    title: "11. Lege aplicabilă și jurisdicție",
    body: [
      "Acești termeni sunt interpretați conform legislației aplicabile din Uniunea Europeană și jurisdicției operatorului platformei, dacă legea nu prevede altfel.",
      "Litigiile se soluționează cu prioritate pe cale amiabilă, iar ulterior de instanța competentă.",
    ],
  },
  {
    title: "12. Modificarea termenilor",
    body: [
      "Operatorul poate face actualizări rezonabile ale termenilor. Versiunea actuală este publicată întotdeauna pe această pagină.",
      "Modificările importante sunt anunțate în avans într-un mod adecvat, de exemplu printr-o notificare în aplicație sau prin e-mail.",
    ],
  },
];

function getTermsPageCopy(marketCode: MarketCode) {
  if (marketCode === "RO") {
    return {
      title: "Termeni și condiții | Autobazar123",
      description:
        "Termenii platformei Autobazar123 pentru anunțuri auto și servicii plătite.",
      eyebrow: "Documente juridice",
      heroTitle: "Termeni și condiții",
      heroDescription:
        "Documentul stabilește regulile de folosire a platformei Autobazar123, publicarea anunțurilor, comunicarea între utilizatori și serviciile plătite. Valabil de la 26 martie 2026.",
      breadcrumb: "Termeni și condiții",
      sections: RO_SECTIONS,
    };
  }

  return {
    title: "Obchodné podmienky | Autobazar123",
    description: "Obchodné podmienky platformy Autobazar123 pre inzerciu vozidiel a platené služby.",
    eyebrow: "Právne dokumenty",
    heroTitle: "Obchodné podmienky",
    heroDescription:
      "Dokument upravuje pravidlá používania platformy Autobazar123, publikovania inzerátov, komunikácie medzi používateľmi a platených služieb. Platné od 26. marca 2026.",
    breadcrumb: "Obchodné podmienky",
    sections: SK_SECTIONS,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const copy = getTermsPageCopy(
    resolvePublicCopyMarketCode(locale, market.code),
  );

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `${market.origin}${getMarketPath("/obchodne-podmienky", market.code)}`,
    },
  };
}

export default async function TermsPage() {
  const [market, locale] = await Promise.all([
    getRequestMarketConfig(),
    getLocale(),
  ]);
  const copy = getTermsPageCopy(
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
              currentHref="/obchodne-podmienky"
              siteUrl={market.origin}
            />
          }
        />

        <div className="space-y-4">
          {copy.sections.map((section) => (
            <MarketplaceArticleCard key={section.title}>
              <h2 className="text-xl font-semibold text-primary">{section.title}</h2>
              <div className="market-readable">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && section.bullets.length > 0 ? (
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
