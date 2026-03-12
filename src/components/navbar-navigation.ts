function buildRouteTargetKey(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}

export function getNavigationTargetKey(href: string): string | null {
  try {
    const url = new URL(href, "https://autobazar123.sk");
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
