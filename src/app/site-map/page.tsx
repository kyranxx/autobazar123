import type { Metadata } from "next";
import { connection } from "next/server";
import sitemap from "../sitemap";

export const metadata: Metadata = {
  title: "Mapa stránky | Autobazar123.sk",
  description: "Prehľad verejných stránok a dôležitých kategórií na Autobazar123.sk.",
};

function labelForUrl(url: string) {
  const path = new URL(url).pathname;

  if (path === "/") {
    return "Domov";
  }

  return path
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .join(" / ");
}

export default async function HtmlSitemapPage() {
  await connection();
  const entries = await sitemap();
  const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());

  return (
    <main className="container-main py-12 lg:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Autobazar123.sk</p>
        <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-foreground lg:text-4xl">
          Mapa stránky
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Rýchly prehľad verejných stránok, značiek, modelov a aktívnych inzerátov, ktoré chceme mať dostupné vo vyhľadávaní.
        </p>

        <ol className="mt-10 grid gap-3 sm:grid-cols-2" role="list">
          {uniqueEntries.map((entry) => (
            <li key={entry.url}>
              <a
                href={entry.url}
                className="block rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                {labelForUrl(entry.url)}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
