export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export function isAllowedImageMimeType(contentType: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(contentType);
}

export function validateImageUploadInput(params: {
  contentType: string;
  fileSize: number;
}): { ok: true } | { ok: false; error: string } {
  const { contentType, fileSize } = params;

  if (!isAllowedImageMimeType(contentType)) {
    return {
      ok: false,
      error: "Invalid file type. Allowed: JPEG, PNG, WEBP, AVIF.",
    };
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return {
      ok: false,
      error: "Invalid file size.",
    };
  }

  if (fileSize > MAX_IMAGE_UPLOAD_BYTES) {
    return {
      ok: false,
      error: "File too large. Maximum size is 10MB.",
    };
  }

  return { ok: true };
}
