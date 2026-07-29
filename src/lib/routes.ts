import {
  getMarketConfig,
  type MarketCode,
  type MarketRouteMapping,
} from "@/config/markets";

export const CREATE_LISTING_ROUTE = "/moj-ucet?tab=create";
export const LEGACY_CREATE_LISTING_ROUTE = "/pridat-inzerat";

function routeMatches(
  pathname: string,
  source: string,
  match: MarketRouteMapping["match"],
): boolean {
  return match === "exact"
    ? pathname === source
    : pathname === source || pathname.startsWith(`${source}/`);
}

export function translateMarketPath(
  value: string,
  routeMappings: readonly MarketRouteMapping[],
  direction: "internal-to-public" | "public-to-internal",
): string {
  const [pathAndQuery, hash = ""] = value.split("#", 2);
  const queryIndex = pathAndQuery.indexOf("?");
  const pathname = queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;
  const query = queryIndex >= 0 ? pathAndQuery.slice(queryIndex) : "";

  const match = [...routeMappings]
    .sort((left, right) => {
      const leftSource =
        direction === "internal-to-public" ? left.internalPath : left.publicPath;
      const rightSource =
        direction === "internal-to-public" ? right.internalPath : right.publicPath;
      const exactPriority =
        Number(right.match === "exact") - Number(left.match === "exact");
      return exactPriority || rightSource.length - leftSource.length;
    })
    .find((mapping) => {
      const source =
        direction === "internal-to-public"
          ? mapping.internalPath
          : mapping.publicPath;
      return routeMatches(pathname, source, mapping.match);
    });

  if (!match) return value;

  const source =
    direction === "internal-to-public" ? match.internalPath : match.publicPath;
  const destination =
    direction === "internal-to-public" ? match.publicPath : match.internalPath;
  return `${destination}${pathname.slice(source.length)}${query}${hash ? `#${hash}` : ""}`;
}

export function getMarketPath(path: string, marketCode: MarketCode): string {
  return translateMarketPath(
    path,
    getMarketConfig(marketCode).routeMappings,
    "internal-to-public",
  );
}

export function getInternalMarketPath(path: string, marketCode: MarketCode): string {
  return translateMarketPath(
    path,
    getMarketConfig(marketCode).routeMappings,
    "public-to-internal",
  );
}

export function isLegacyMarketPath(path: string, marketCode: MarketCode): boolean {
  return getMarketPath(path, marketCode) !== path;
}
