export function normalizeOgImageUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);

    if (url.searchParams.get("format")?.toLowerCase() === "webp") {
      url.searchParams.set("format", "jpg");
    }

    if (/\.webp$/i.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\.webp$/i, ".jpg");
    }

    return url.toString();
  } catch {
    if (/\.webp(\?|$)/i.test(rawUrl)) {
      return rawUrl.replace(/\.webp(\?|$)/i, ".jpg$1");
    }
    return rawUrl;
  }
}
