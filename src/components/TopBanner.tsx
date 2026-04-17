import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getPricingSnapshot } from "@/lib/pricing/server";

export default async function TopBanner() {
  const t = await getTranslations("topBanner");
  const { summary } = await getPricingSnapshot();

  return (
    <div className="print:hidden relative z-[140] w-full bg-primary text-primary-foreground">
      <div className="container-main flex flex-col gap-2.5 py-3 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:py-2">
        <div className="flex flex-wrap items-center gap-2 font-semibold tracking-wide">
          <span className="rounded-full bg-[var(--color-mint)]/88 px-2.5 py-1 text-[var(--color-primary)]">
            {t("verifiedSellers")}
          </span>
          <span className="rounded-full bg-[var(--color-mint)]/88 px-2.5 py-1 text-[var(--color-primary)]">
            {t("realVehiclePhotos")}
          </span>
        </div>

        <Link
          href="/ceny"
          className="w-full rounded-full bg-[var(--color-mint)]/88 px-4 py-2 text-center text-[13px] font-semibold leading-tight tracking-wide text-[var(--color-primary)] sm:mx-auto sm:w-auto sm:px-3 sm:py-1 sm:text-xs"
        >
          {summary.globalBanner}
        </Link>

        <div className="flex items-center justify-end gap-3 font-semibold sm:ml-auto">
          <LanguageSwitcher tone="inverted" flagsOnly className="hidden sm:flex" />
        </div>
      </div>
    </div>
  );

}
