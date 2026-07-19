const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(
    /&(#(\d+)|#x([0-9a-f]+)|([a-z]+));/giu,
    (match, _entity, decimal: string | undefined, hex: string | undefined, named: string | undefined) => {
      if (decimal) {
        return String.fromCodePoint(Number.parseInt(decimal, 10));
      }

      if (hex) {
        return String.fromCodePoint(Number.parseInt(hex, 16));
      }

      if (named) {
        return NAMED_ENTITIES[named.toLowerCase()] ?? match;
      }

      return match;
    },
  );
}

export function normalizeTaxonomyName(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function normalizeTaxonomySlug(value: string): string {
  return normalizeTaxonomyName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/&/gu, " ")
    .replace(/\+/gu, " plus ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

export function normalizeTaxonomyLookupKey(value: string): string {
  return normalizeTaxonomyName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
}
