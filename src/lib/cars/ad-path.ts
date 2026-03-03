const ROUTE_UUID_REGEX =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-.+)?$/i;

function normalizeForSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractAdIdFromRouteParam(param: string): string {
  const match = param.match(ROUTE_UUID_REGEX);
  if (!match) {
    return param;
  }

  return match[1];
}

export function buildAdPath({
  id,
  brand,
  model,
  year,
}: {
  id: string;
  brand?: string | null;
  model?: string | null;
  year?: number | string | null;
}): string {
  const slugSource = [brand, model, year ? String(year) : null]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("-");

  const slug = normalizeForSlug(slugSource).slice(0, 72);

  if (!slug) {
    return `/auto/${id}`;
  }

  return `/auto/${id}-${slug}`;
}
