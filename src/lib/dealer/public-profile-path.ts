export function buildDealerPublicProfilePath(slug: string): string {
  const normalizedSlug = slug.trim();
  return `/predajca/${encodeURIComponent(normalizedSlug)}`;
}

