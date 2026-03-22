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

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getBaseUrl()}${normalizedPath}`;
}
