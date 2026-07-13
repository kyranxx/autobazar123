import Link from "next/link";
import {
  MarketplaceContainer,
  MarketplaceHero,
  MarketplaceLinkButton,
  MarketplacePageShell,
} from "@/components/ui/MarketplacePage";
import { getRequestMarketConfig } from "@/lib/market/request";

function getNotFoundCopy(marketCode: "SK" | "RO") {
  if (marketCode === "RO") {
    return {
      eyebrow: "Anunț negăsit",
      title: "Acest anunț nu mai este disponibil",
      description:
        "Linkul poate fi expirat, anunțul poate fi șters sau mașina poate fi vândută. Continuă cu unul dintre pașii rapizi de mai jos.",
      home: "Înapoi acasă",
      links: [
        { href: "/vysledky", label: "Mergi la anunțurile auto" },
        { href: "/moj-ucet?tab=messages", label: "Deschide mesajele" },
        { href: "/kontakt", label: "Contactează suportul" },
      ],
    };
  }

  return {
    eyebrow: "Inzerát nenájdený",
    title: "Tento inzerát už nie je dostupný",
    description:
      "Odkaz mohol expirovať, inzerát bol zmazaný alebo predaný. Pokračujte jedným z rýchlych krokov nižšie.",
    home: "Späť na domov",
    links: [
      { href: "/vysledky", label: "Prejsť na ponuku áut" },
      { href: "/moj-ucet?tab=messages", label: "Otvoriť správy" },
      { href: "/kontakt", label: "Kontaktovať podporu" },
    ],
  };
}

export default async function CarNotFound() {
  const market = await getRequestMarketConfig();
  const copy = getNotFoundCopy(market.code);

  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="md" className="space-y-6">
        <MarketplaceHero
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <MarketplaceLinkButton href="/" variant="secondary">
              {copy.home}
            </MarketplaceLinkButton>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {copy.links.map((link) => (
            <Link key={link.href} href={link.href} className="market-card block p-4 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}
