import { getTranslations } from "next-intl/server";
import TopBannerClient from "@/components/TopBannerClient";

export default async function TopBanner() {
  const t = await getTranslations("topBanner");

  return (
    <TopBannerClient
      freeListingCta={t("freeListingCta")}
    />
  );
}
