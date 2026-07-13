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
  ctaLabel = "Zobraziť ponuky",
}: {
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
}) {
  return (
    <div className="market-soft-band mb-8 p-5">
      <h2 className="text-base font-semibold text-primary">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-secondary">{description}</p>
      <Link
        href={href}
        className="market-action-primary mt-4"
      >
        <SearchIcon className="mr-2 size-4" />
        {ctaLabel}
      </Link>
    </div>
  );
}

export function InventoryEmptyState({
  message,
  href,
  padded = true,
  ctaLabel = "Zobraziť ponuky",
}: {
  message: string;
  href: string;
  padded?: boolean;
  ctaLabel?: string;
}) {
  return (
    <div
      className={
        padded
          ? "market-card p-8 text-center"
          : "text-center py-12"
      }
    >
      <p className="text-secondary">{message}</p>
      <Link
        href={href}
        className="market-action-primary mt-4"
      >
        <SearchIcon className="mr-2 size-4" />
        {ctaLabel}
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
  locale = "sk-SK",
  availableLabel = "Dostupné ponuky na stránke",
  averagePriceLabel = "Priemerná cena",
  newestYearLabel = "Najnovší modelový rok",
}: {
  title: string;
  count: number;
  averagePriceEur: number | null;
  newestYear: number;
  className?: string;
  locale?: string;
  availableLabel?: string;
  averagePriceLabel?: string;
  newestYearLabel?: string;
}) {
  return (
    <div className={`${className} market-card p-4`}>
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-secondary">
        <li>{availableLabel}: {count}</li>
        {averagePriceEur !== null ? (
          <li>{averagePriceLabel}: {averagePriceEur.toLocaleString(locale)} EUR</li>
        ) : null}
        {newestYear > 0 ? <li>{newestYearLabel}: {newestYear}</li> : null}
      </ul>
    </div>
  );
}
