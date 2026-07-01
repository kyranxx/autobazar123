import { getTranslations } from "next-intl/server";
import { getPricingSnapshot } from "@/lib/pricing/server";
import TopBannerClient from "@/components/TopBannerClient";

export default async function TopBanner() {
  const [t, { summary }] = await Promise.all([
    getTranslations("topBanner"),
    getPricingSnapshot(),
  ]);

  return (
    <TopBannerClient
      verifiedSellers={t("verifiedSellers")}
      realVehiclePhotos={t("realVehiclePhotos")}
      globalBanner={summary.globalBanner}
    />
  );
}
