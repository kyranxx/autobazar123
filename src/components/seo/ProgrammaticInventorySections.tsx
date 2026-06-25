import Link from "next/link";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { SearchIcon } from "@/components/ui/Icons";
import type { BreadcrumbTrailItem } from "@/lib/seo/breadcrumbs";

export function ProgrammaticBreadcrumbs({
  items,
}: {
  items: BreadcrumbTrailItem[];
}) {
  return <BreadcrumbTrail items={items} />;
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
        className="mt-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary)]/90"
      >
        <SearchIcon className="mr-2 size-4" />
        Zobraziť ponuky
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
        className="mt-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary)]/90"
      >
        <SearchIcon className="mr-2 size-4" />
        Zobraziť ponuky
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
