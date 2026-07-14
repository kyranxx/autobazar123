import type { MarketCode } from "@/config/markets";

export const CREATE_LISTING_ROUTE = "/moj-ucet?tab=create";
export const LEGACY_CREATE_LISTING_ROUTE = "/pridat-inzerat";

const ROMANIAN_PUBLIC_ROUTE_MAP = {
  "/moj-ucet": "/contul-meu",
  "/vysledky": "/masini",
  "/predajcovia": "/dealeri",
  "/kalkulacka-leasingu": "/calculator-leasing",
  "/ceny": "/preturi",
  "/kontakt": "/contact",
  "/o-nas": "/despre-noi",
  "/obchodne-podmienky": "/termeni-si-conditii",
  "/ochrana-udajov": "/politica-de-confidentialitate",
  "/auto": "/masina",
  "/predajca": "/dealeri",
} as const;

function replaceRoutePrefix(
  value: string,
  routeMap: Readonly<Record<string, string>>,
): string {
  const [pathAndQuery, hash = ""] = value.split("#", 2);
  const queryIndex = pathAndQuery.indexOf("?");
  const pathname = queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;
  const query = queryIndex >= 0 ? pathAndQuery.slice(queryIndex) : "";

  const match = Object.entries(routeMap)
    .sort(([left], [right]) => right.length - left.length)
    .find(([source]) => pathname === source || pathname.startsWith(`${source}/`));

  if (!match) return value;

  const [source, destination] = match;
  return `${destination}${pathname.slice(source.length)}${query}${hash ? `#${hash}` : ""}`;
}

export function getMarketPath(path: string, marketCode: MarketCode): string {
  return marketCode === "RO"
    ? replaceRoutePrefix(path, ROMANIAN_PUBLIC_ROUTE_MAP)
    : path;
}

export function getInternalMarketPath(path: string, marketCode: MarketCode): string {
  if (marketCode !== "RO") return path;

  const pathname = path.split(/[?#]/, 1)[0];
  if (pathname.startsWith("/dealeri/")) {
    return replaceRoutePrefix(path, { "/dealeri": "/predajca" });
  }

  return replaceRoutePrefix(
    path,
    Object.fromEntries(
      Object.entries(ROMANIAN_PUBLIC_ROUTE_MAP)
        .filter(([internal]) => internal !== "/predajca")
        .map(([internal, localized]) => [localized, internal]),
    ),
  );
}

export function isLegacyMarketPath(path: string, marketCode: MarketCode): boolean {
  return marketCode === "RO" && getMarketPath(path, marketCode) !== path;
}
