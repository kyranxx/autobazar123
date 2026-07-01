"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function TopBannerClient({
  verifiedSellers,
  realVehiclePhotos,
  globalBanner,
}: {
  verifiedSellers: string;
  realVehiclePhotos: string;
  globalBanner: string;
}) {
  return (
    <div className="print:hidden relative z-[140] w-full bg-primary text-primary-foreground">
      <div className="container-main flex flex-col gap-1.5 py-2 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:py-2">
        <div className="grid w-full grid-cols-2 gap-1.5 font-semibold tracking-wide sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2">
          <span className="flex min-h-8 items-center justify-center rounded-full bg-[var(--color-mint)]/88 px-3 py-1 text-center leading-tight text-[var(--color-primary)] sm:min-h-0 sm:px-2.5">
            {verifiedSellers}
          </span>
          <span className="flex min-h-8 items-center justify-center rounded-full bg-[var(--color-mint)]/88 px-3 py-1 text-center leading-tight text-[var(--color-primary)] sm:min-h-0 sm:px-2.5">
            {realVehiclePhotos}
          </span>
        </div>

        <Link
          href="/ceny"
          className="w-full rounded-full bg-[var(--color-mint)]/88 px-4 py-1.5 text-center text-[13px] font-semibold leading-tight tracking-wide text-[var(--color-primary)] sm:mx-auto sm:w-auto sm:px-3 sm:py-1 sm:text-xs"
        >
          {globalBanner}
        </Link>

        <div className="flex items-center justify-end gap-3 font-semibold sm:ml-auto">
          <LanguageSwitcher tone="inverted" flagsOnly className="hidden sm:flex" />
        </div>
      </div>
    </div>
  );
}
