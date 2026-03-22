const LISTING_FALLBACK_IMAGE = "/placeholder-car.jpg";

export function getListingFallbackGallery(seed: string): string[] {
  void seed;
  return [LISTING_FALLBACK_IMAGE];
}

export function getListingFallbackImage(seed: string): string {
  void seed;
  return LISTING_FALLBACK_IMAGE;
}
