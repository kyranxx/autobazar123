"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import HomeSearchFormClient from "@/components/home/HomeSearchFormClient";
import { ArrowRightIcon } from "@/components/ui/Icons";

export default function HomeFrontpageSearch() {
  const tHome = useTranslations("homePage");
  const tHomeSearch = useTranslations("homeSearch");

  return (
    <div className="w-full min-w-0">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--home-brand)]">
          {tHomeSearch("quickFlow")}
        </p>
        <Link
          href="/pridat-inzerat"
          prefetch={false}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--home-brand)]/16 bg-white px-4 text-sm font-black text-[var(--home-brand)] shadow-sm transition-colors hover:border-[var(--home-brand)]/28 hover:bg-[var(--home-mint-soft)]"
        >
          {tHome("ctaSellCar")}
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
      <HomeSearchFormClient className="mt-0 shadow-[0_24px_60px_-38px_rgba(17,24,39,0.68)] lg:p-5" />
    </div>
  );
}
