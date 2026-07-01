import Link from "next/link";
import {
  MarketplaceContainer,
  MarketplaceHero,
  MarketplaceLinkButton,
  MarketplacePageShell,
} from "@/components/ui/MarketplacePage";

const RECOVERY_LINKS = [
  { href: "/vysledky", label: "Prejsť na ponuku áut" },
  { href: "/moj-ucet?tab=messages", label: "Otvoriť správy" },
  { href: "/kontakt", label: "Kontaktovať podporu" },
];

export default function CarNotFound() {
  return (
    <MarketplacePageShell>
      <MarketplaceContainer size="md" className="space-y-6">
        <MarketplaceHero
          eyebrow="Inzerát nenájdený"
          title="Tento inzerát už nie je dostupný"
          description="Odkaz mohol expirovať, inzerát bol zmazaný alebo predaný. Pokračujte jedným z rýchlych krokov nižšie."
          actions={
            <MarketplaceLinkButton href="/" variant="secondary">
              Späť na domov
            </MarketplaceLinkButton>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {RECOVERY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="market-card block p-4 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </MarketplaceContainer>
    </MarketplacePageShell>
  );
}
