import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_PRICING_CONFIG_V1,
  buildSharedPricingSummary,
  parsePricingConfigValue,
  type PricingConfigV1,
} from "@/lib/pricing/config";

export const PRICING_SITE_SETTING_KEY = "pricing_config_v1";

export async function getPricingConfig(): Promise<PricingConfigV1> {
  const admin = createAdminClient();
  if (!admin) {
    return DEFAULT_PRICING_CONFIG_V1;
  }

  const { data, error } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", PRICING_SITE_SETTING_KEY)
    .maybeSingle();

  if (error) {
    console.error("Failed to load pricing config:", error);
    return DEFAULT_PRICING_CONFIG_V1;
  }

  return parsePricingConfigValue(data?.value);
}

export async function getPricingSnapshot(locale = "sk-SK") {
  const config = await getPricingConfig();

  return {
    config,
    summary: buildSharedPricingSummary(config, locale),
  };
}
