import Link from "next/link";

export function ProgrammaticBreadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="mb-6 text-sm">
      <ol className="flex items-center gap-2 text-secondary flex-wrap">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="contents">
            <span>
              {item.href ? (
                <Link href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              ) : (
                <span className="text-primary font-medium">{item.label}</span>
              )}
            </span>
            {index < items.length - 1 ? <span>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function InventorySearchCta({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="mb-8 rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <h2 className="text-base font-semibold text-primary">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-secondary">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
      >
        Zobraziť všetky výsledky vo vyhľadávaní
      </Link>
    </div>
  );
}

export function InventoryEmptyState({
  message,
  href,
  padded = true,
}: {
  message: string;
  href: string;
  padded?: boolean;
}) {
  return (
    <div
      className={
        padded
          ? "rounded-2xl border border-border bg-surface p-8 text-center"
          : "text-center py-12"
      }
    >
      <p className="text-secondary">{message}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
      >
        Zobraziť výsledky vo vyhľadávaní
      </Link>
    </div>
  );
}

export function InventoryMarketSummary({
  title,
  count,
  averagePriceEur,
  newestYear,
  className = "mb-4",
}: {
  title: string;
  count: number;
  averagePriceEur: number | null;
  newestYear: number;
  className?: string;
}) {
  return (
    <div className={`${className} rounded-xl border border-border bg-surface p-4`}>
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-secondary">
        <li>Dostupné ponuky na stránke: {count}</li>
        {averagePriceEur !== null ? (
          <li>Priemerná cena: {averagePriceEur.toLocaleString("sk-SK")} EUR</li>
        ) : null}
        {newestYear > 0 ? <li>Najnovší modelový rok: {newestYear}</li> : null}
      </ul>
    </div>
  );
}
