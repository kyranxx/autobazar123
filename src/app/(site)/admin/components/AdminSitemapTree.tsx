"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";

type TreeGroup = {
  title: string;
  items: Array<{ href: string; label: string }>;
};

const SITE_TREE: TreeGroup[] = [
  {
    title: "Verejne stranky",
    items: [
      { href: "/", label: "Domov" },
      { href: "/vysledky", label: "Výsledky vyhľadávania" },
      { href: "/predajcovia", label: "Predajcovia" },
      { href: "/ceny", label: "Cenník" },
      { href: "/kredity", label: "Legacy presmerovanie na cenník" },
      { href: "/kontakt", label: "Kontakt" },
      { href: "/o-nas", label: "O nas" },
    ],
  },
  {
    title: "Pouzivatelske rozhranie",
    items: [
      { href: "/moj-ucet?tab=ads", label: "Môj účet - Moje inzeráty" },
      { href: "/moj-ucet?tab=create", label: "Môj účet - Pridať inzerát" },
      { href: "/moj-ucet?tab=saved", label: "Môj účet - Uložené auta" },
      { href: "/moj-ucet?tab=messages", label: "Môj účet - Správy" },
      { href: "/moj-ucet?tab=settings", label: "Môj účet - Nastavenia" },
      { href: "/dealer", label: "Dealer centrum" },
      { href: "/admin", label: "Admin panel" },
    ],
  },
  {
    title: "Pravne a systemove",
    items: [
      { href: "/obchodne-podmienky", label: "Obchodne podmienky" },
      { href: "/ochrana-udajov", label: "Ochrana údajov" },
      { href: "/cookies", label: "Cookies" },
      { href: "/maintenance", label: "Maintenance stránka" },
      { href: "/sitemap.xml", label: "Sitemap XML" },
      { href: "/robots.txt", label: "Robots TXT" },
    ],
  },
  {
    title: "Priklad detailu inzerátu",
    items: [
      { href: "/auto/example-id-slug", label: "/auto/{id}-{slug}" },
    ],
  },
];

export function AdminSitemapTree() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strom stranky (bez listu všetkých inzerátov)</CardTitle>
        <p className="text-sm text-text-secondary">
          Tento prehľad je určený na rýchlu kontrolu hlavných podstránok a dialógov.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {SITE_TREE.map((group) => (
          <section key={group.title} className="rounded-xl border border-border-subtle bg-background p-4">
            <h3 className="text-sm font-semibold text-text-primary">{group.title}</h3>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => (
                <li key={item.href} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-text-primary">{item.label}</span>
                  <Link
                    href={item.href}
                    target="_blank"
                    className="text-sm text-accent transition-colors hover:text-accent-hover"
                  >
                    {item.href}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
