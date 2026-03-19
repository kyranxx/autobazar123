import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function TopBanner() {
  const t = await getTranslations("topBanner");

  return (
    <div className="print:hidden relative z-[60] w-full bg-primary text-primary-foreground">
      <div className="container-main flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 font-semibold tracking-wide">
          <span className="rounded-full bg-[var(--color-mint)]/88 px-2.5 py-1 text-[var(--color-primary)] ring-1 ring-inset ring-white/18">
            {t("verifiedSellers")}
          </span>
          <span className="rounded-full bg-[var(--color-mint)]/88 px-2.5 py-1 text-[var(--color-primary)] ring-1 ring-inset ring-white/18">
            {t("realVehiclePhotos")}
          </span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <LanguageSwitcher tone="inverted" className="hidden sm:flex" />
        </div>
      </div>
    </div>
  );

}
