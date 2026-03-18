const LISTING_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1400&q=80",
] as const;

function getFallbackOffset(seed: string): number {
  return Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getListingFallbackGallery(seed: string): string[] {
  const offset = getFallbackOffset(seed);

  return LISTING_FALLBACK_IMAGES.map(
    (_, index) => LISTING_FALLBACK_IMAGES[(offset + index) % LISTING_FALLBACK_IMAGES.length],
  ).filter((image, index, images) => images.indexOf(image) === index);
}

export function getListingFallbackImage(seed: string): string {
  return getListingFallbackGallery(seed)[0] ?? LISTING_FALLBACK_IMAGES[0];
}
