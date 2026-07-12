import type { Metadata } from "next";
import { PublicPageBreadcrumbs } from "@/components/seo/PublicPageBreadcrumbs";
import {
  MarketplaceArticleCard,
  MarketplaceContainer,
  MarketplaceHero,
  MarketplacePageShell,
} from "@/components/ui/MarketplacePage";
import { COMPANY_INFO } from "@/config/company";
import { getRequestMarketConfig } from "@/lib/market/request";
import { getMarketPath } from "@/lib/routes";


export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarketConfig();
  return {
  title: "Obchodné podmienky | Autobazar123",
  description: "Obchodné podmienky platformy Autobazar123 pre inzerciu vozidiel a platené služby.",
  alternates: {
    canonical: `${market.origin}${getMarketPath("/obchodne-podmienky", market.code)}`,
  },
  };
}

type Section = {
  title: string;
  body: string[];
  bullets?: string[];
};

const SECTIONS: Section[] = [
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

export default function TermsPage() {
  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="lg" className="space-y-8">
        <MarketplaceHero
          eyebrow="Právne dokumenty"
          title="Obchodné podmienky"
          description="Dokument upravuje pravidlá používania platformy Autobazar123, publikovania inzerátov, komunikácie medzi používateľmi a platených služieb. Platné od 26. marca 2026."
          breadcrumbs={
            <PublicPageBreadcrumbs
              items={[{ label: "Obchodné podmienky" }]}
              currentHref="/obchodne-podmienky"
            />
          }
        />

        <div className="space-y-4">
          {SECTIONS.map((section) => (
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
