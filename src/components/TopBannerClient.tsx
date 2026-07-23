"use client";

import Link from "next/link";
import { CREATE_LISTING_ROUTE } from "@/lib/routes";

export default function TopBannerClient({
  freeListingCta,
}: {
  freeListingCta: string;
}) {
  return (
    <div className="print:hidden relative z-[140] hidden w-full bg-primary text-primary-foreground md:block">
      <div className="container-main flex min-h-10 items-center justify-center py-1.5 text-xs">
        <Link
          href={CREATE_LISTING_ROUTE}
          className="rounded-full bg-[var(--color-mint)] px-5 py-1.5 text-center font-bold leading-tight tracking-wide text-[var(--color-primary)] transition-colors hover:bg-white"
        >
          {freeListingCta}
        </Link>
      </div>
    </div>
  );
}
