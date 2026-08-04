import { BRAND_URL } from "@/config/brand";
import { getTrimmedEnv } from "@/lib/env";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/g, "");
}

export function getBaseUrl(): string {
  return trimTrailingSlash(
    getTrimmedEnv("NEXT_PUBLIC_APP_URL")
      || getTrimmedEnv("NEXT_PUBLIC_SITE_URL")
      || BRAND_URL,
  );
}
