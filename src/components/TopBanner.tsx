import { getTranslations } from "next-intl/server";
import { getPricingSnapshot } from "@/lib/pricing/server";
import TopBannerClient from "@/components/TopBannerClient";

export default async function TopBanner() {
  const [t, tHome, { summary }] = await Promise.all([
    getTranslations("topBanner"),
    getTranslations("homePage"),
    getPricingSnapshot(),
  ]);

  const homeTrustItems = [
    t("verifiedSellers"),
    t("realVehiclePhotos"),
    tHome("buyerPromises.lessNoise.title"),
  ];

  return (
    <TopBannerClient
      verifiedSellers={t("verifiedSellers")}
      realVehiclePhotos={t("realVehiclePhotos")}
      globalBanner={summary.globalBanner}
      homeTrustItems={homeTrustItems}
    />
  );
}
