"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function TopBannerClient({
  verifiedSellers,
  realVehiclePhotos,
  globalBanner,
  homeTrustItems,
}: {
  verifiedSellers: string;
  realVehiclePhotos: string;
  globalBanner: string;
  homeTrustItems: string[];
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <div className="print:hidden relative z-[140] w-full bg-[var(--color-primary)] text-white">
        <div className="container-main flex min-h-9 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-2 text-xs font-semibold sm:gap-x-14">
          {homeTrustItems.map((item, index) => (
            <span key={item} className="inline-flex min-w-0 items-center gap-2 text-white">
              <TopBannerIcon variant={index} />
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

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

function TopBannerIcon({ variant }: { variant: number }) {
  const paths = [
    "M12 3.5l6 2.4v4.7c0 4.1-2.5 7.7-6 9.1-3.5-1.4-6-5-6-9.1V5.9l6-2.4z M9.7 11.7l1.5 1.5 3.3-3.4",
    "M4.5 7.5h3l1.2-1.8h6.6l1.2 1.8h3v10.2h-15V7.5z M12 10.2a3 3 0 100 6 3 3 0 000-6z",
    "M5 12.3l4.1 4.1L19 6.5",
  ];

  return (
    <svg
      className="size-4 text-[var(--color-mint)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[variant] ?? paths[0]} />
    </svg>
  );
}
