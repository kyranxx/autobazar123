import { getLocale, getTranslations } from "next-intl/server";
import { getPricingSnapshot } from "@/lib/pricing/server";
import TopBannerClient from "@/components/TopBannerClient";

export default async function TopBanner() {
  const [t, locale] = await Promise.all([
    getTranslations("topBanner"),
    getLocale(),
  ]);
  const { summary } = await getPricingSnapshot(locale);

  return (
    <TopBannerClient
      verifiedSellers={t("verifiedSellers")}
      realVehiclePhotos={t("realVehiclePhotos")}
      globalBanner={summary.globalBanner}
    />
  );
}
