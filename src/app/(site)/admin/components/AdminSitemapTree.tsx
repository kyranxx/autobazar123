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
      { href: "/vysledky", label: "Vysledky vyhladavania" },
      { href: "/predajcovia", label: "Predajcovia" },
      { href: "/ceny", label: "Cennik" },
      { href: "/kredity", label: "Kredity" },
      { href: "/kontakt", label: "Kontakt" },
      { href: "/o-nas", label: "O nas" },
    ],
  },
  {
    title: "Pouzivatelske rozhranie",
    items: [
      { href: "/moj-ucet?tab=ads", label: "Moj ucet - Moje inzeraty" },
      { href: "/moj-ucet?tab=create", label: "Moj ucet - Pridat inzerat" },
      { href: "/moj-ucet?tab=credits", label: "Moj ucet - Kredity" },
      { href: "/moj-ucet?tab=saved", label: "Moj ucet - Ulozene auta" },
      { href: "/moj-ucet?tab=messages", label: "Moj ucet - Spravy" },
      { href: "/moj-ucet?tab=settings", label: "Moj ucet - Nastavenia" },
      { href: "/dealer", label: "Dealer centrum" },
      { href: "/admin", label: "Admin panel" },
    ],
  },
  {
    title: "Pravne a systemove",
    items: [
      { href: "/obchodne-podmienky", label: "Obchodne podmienky" },
      { href: "/ochrana-udajov", label: "Ochrana udajov" },
      { href: "/cookies", label: "Cookies" },
      { href: "/maintenance", label: "Maintenance stranka" },
      { href: "/sitemap.xml", label: "Sitemap XML" },
      { href: "/robots.txt", label: "Robots TXT" },
    ],
  },
  {
    title: "Priklad detailu inzeratu",
    items: [
      { href: "/auto/example-id-slug", label: "/auto/{id}-{slug}" },
    ],
  },
];

export function AdminSitemapTree() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strom stranky (bez listu vsetkych inzeratov)</CardTitle>
        <p className="text-sm text-text-secondary">
          Tento prehlad je urceny na rychlu kontrolu hlavnych podstranok a dialogov.
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
