import { BRAND_URL } from "@/config/brand";

function buildRouteTargetKey(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}

export function getNavigationTargetKey(href: string): string | null {
  try {
    const url = new URL(href, BRAND_URL);
    return buildRouteTargetKey(url.pathname, url.searchParams.toString());
  } catch {
    return null;
  }
}

export function isCurrentNavigationTarget(
  pathname: string,
  search: string,
  href: string,
): boolean {
  const targetKey = getNavigationTargetKey(href);

  return targetKey !== null && buildRouteTargetKey(pathname, search) === targetKey;
}
