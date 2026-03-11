import Link from "next/link";

const RECOVERY_LINKS = [
  { href: "/vysledky", label: "Prejst na ponuku áut" },
  { href: "/moj-ucet?tab=messages", label: "Otvorit správy" },
  { href: "/kontakt", label: "Kontaktovať podporu" },
];

export default function CarNotFound() {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="card p-8 sm:p-10">
          <p className="eyebrow mb-3">Inzerát nenájdený</p>
          <h1 className="text-3xl font-display font-semibold text-text-primary">
            Tento inzerát už nie je dostupný
          </h1>
          <p className="mt-3 text-text-secondary">
            Odkaz mohol expirovat, inzerát bol zmazaný alebo predany. Pokračujte
            jedným z rychlych krokov nizsie.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {RECOVERY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="card-interactive rounded-lg border border-border p-4 text-text-primary motion-interruptible"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/" className="btn-primary motion-interruptible">
              Spat na domov
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
