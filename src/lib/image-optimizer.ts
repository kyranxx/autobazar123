/**
 * Image optimization utilities for Cloudflare Images
 * Generates optimized URLs with srcset for responsive loading
 */

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "auto";
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
}

/**
 * Transform Cloudflare Images URL with optimization parameters
 */
export function optimizeCloudflareImage(
  url: string,
  options: ImageOptions = {},
): string {
  if (!url.includes("imagedelivery.net")) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = "auto",
    fit = "scale-down",
  } = options;

  const params = new URLSearchParams();

  if (width) params.append("width", width.toString());
  if (height) params.append("height", height.toString());
  params.append("quality", quality.toString());
  params.append("format", format);
  params.append("fit", fit);

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${params.toString()}`;
}

/**
 * Generate srcset string for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1920],
): string {
  return widths
    .map(
      (width) =>
        `${optimizeCloudflareImage(baseUrl, { width, format: "webp" })} ${width}w`,
    )
    .join(", ");
}

/**
 * Get optimized image URL for thumbnail
 */
export function getThumbnailUrl(
  url: string,
  size: "sm" | "md" | "lg" = "md",
): string {
  const sizes = {
    sm: 200,
    md: 400,
    lg: 800,
  };

  return optimizeCloudflareImage(url, {
    width: sizes[size],
    height: sizes[size],
    fit: "cover",
    quality: 85,
    format: "webp",
  });
}

/**
 * Get optimized image URL for hero/banner
 */
export function getHeroImageUrl(url: string): string {
  return optimizeCloudflareImage(url, {
    width: 1920,
    height: 600,
    fit: "cover",
    quality: 85,
    format: "webp",
  });
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): void {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = optimizeCloudflareImage(url, { format: "webp" });
  link.imageSrcset = generateSrcSet(url);
  link.imageSizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw";
  document.head.appendChild(link);
}
